"""Assembler for the small, typed instruction subset used by the offline WebView host.
All section indices follow DEX 035 ordering. Branch targets are instruction boundaries.
"""
import struct, hashlib, zlib
from dataclasses import dataclass,field
P=lambda fmt,*v:struct.pack('<'+fmt,*v)
def uleb(x):
    assert x>=0
    out=bytearray()
    while x>=128: out.append((x&127)|128);x>>=7
    out.append(x);return bytes(out)
@dataclass
class Method:
    ref:tuple
    flags:int
    regs:int
    ops:list
    catches:list=field(default_factory=list)
class Dex:
    def __init__(self):
        self.classes={};self.methods={};self.fields={};self.strings=set();self.types=set();self.protos=set();self.refs=set()
    def typ(self,t):
        self.types.add(t);self.strings.add(t);return t
    def ref(self,owner,name,ret,*params):
        self.typ(owner);self.typ(ret)
        for x in params:self.typ(x)
        self.strings.add(name);self.strings.add(self.short(ret,params));self.protos.add((ret,params))
        r=(owner,name,ret,params);self.refs.add(r);return r
    def short(self,ret,args):return ''.join('L' if t.startswith(('L','[')) else t for t in (ret,*args))
    def cls(self,t,sup):
        self.classes[self.typ(t)]=self.typ(sup)
    def fld(self,cls,name,t):
        self.typ(t);self.strings.add(name);r=cls,name,t;self.fields[r]=1;return r
    def method(self,cls,name,ret,params,flags,regs,ops,catches=()):
        r=self.ref(cls,name,ret,*params)
        for op in ops:
            if op[0]=='str':self.strings.add(op[2])
            if op[0] in ('new','array','cast'):self.typ(op[-1])
        for _,_,typ,_ in catches:self.typ(typ)
        self.methods[r]=Method(r,flags,regs,ops,catches)
    def build(self):
        strings=sorted(self.strings,key=lambda s:s.encode('utf-16-be'));S={v:i for i,v in enumerate(strings)}
        types=sorted(self.types,key=S.get);T={v:i for i,v in enumerate(types)}
        protos=sorted(self.protos,key=lambda p:(T[p[0]],tuple(map(T.get,p[1]))));Pr={v:i for i,v in enumerate(protos)}
        fields=sorted(self.fields,key=lambda x:(T[x[0]],S[x[1]],T[x[2]]));F={v:i for i,v in enumerate(fields)}
        refs=sorted(self.refs,key=lambda r:(T[r[0]],S[r[1]],Pr[r[2:]]));M={v:i for i,v in enumerate(refs)}
        classes=sorted(self.classes,key=T.get)
        # Class definitions sorted in superclass-first order (all superclass dependencies are framework types).
        h=112;data=bytearray(h);maps=[(0,1,0)]
        def reserve(typ,count,size):
            if not count:return 0
            at=len(data);data.extend(bytes(size*count));maps.append((typ,count,at));return at
        so=reserve(1,len(strings),4);to=reserve(2,len(types),4);po=reserve(3,len(protos),12)
        fo=reserve(4,len(fields),8);mo=reserve(5,len(refs),8);co=reserve(6,len(classes),32);ds=len(data)
        def align(): data.extend(bytes((-len(data))%4))
        def put(off,fmt,*args):struct.pack_into('<'+fmt,data,off,*args)
        maps.append((0x2002,len(strings),len(data)))
        for i,s in enumerate(strings):
            put(so+i*4,'I',len(data));units=s.encode('utf-16-be');encoded=bytearray()
            for j in range(0,len(units),2):
                n=int.from_bytes(units[j:j+2],'big')
                if 0<n<128:encoded.append(n)
                elif n<2048:encoded.extend((0xc0|(n>>6),0x80|(n&63)))
                else:encoded.extend((0xe0|(n>>12),0x80|((n>>6)&63),0x80|(n&63)))
            data.extend(uleb(len(units)//2)+encoded+b'\0')
        for i,t in enumerate(types):put(to+4*i,'I',S[t])
        align();offs={};paramsets=sorted({p for _,p in protos if p})
        if paramsets:maps.append((0x1001,len(paramsets),len(data)))
        for params in paramsets:
            align();offs[params]=len(data);data.extend(P('I',len(params))+P('H'*len(params),*map(T.get,params)))
        for i,(ret,ps) in enumerate(protos):put(po+12*i,'III',S[self.short(ret,ps)],T[ret],offs.get(ps,0))
        for i,(c,n,t) in enumerate(fields):put(fo+8*i,'HHI',T[c],T[t],S[n])
        for i,(c,n,r,ps) in enumerate(refs):put(mo+8*i,'HHI',T[c],Pr[r,ps],S[n])
        align();maps.append((0x2001,len(self.methods),len(data)));code={}
        for r in sorted(self.methods,key=M.get):
            m=self.methods[r];align();code[r]=len(data);words=[];labels={};fix=[];outs=0
            for op,*a in m.ops:
                if op==':':labels[a[0]]=len(words);continue
                if op=='str':words += [0x1a|(a[0]<<8),S[a[1]]]
                elif op in ('new','cast'):words += [(0x22 if op=='new' else 0x1f)|(a[0]<<8),T[a[1]]]
                elif op=='array':words +=[0x23|(a[0]<<8)|(a[1]<<12),T[a[2]]]
                elif op=='aput':words +=[0x4d|(a[0]<<8),a[1]|(a[2]<<8)]
                elif op=='const':words +=[0x13|(a[0]<<8),a[1]&65535]
                elif op in ('iget','iput'):words +=[(0x54 if op=='iget' else 0x5b)|(a[0]<<8)|(a[1]<<12),F[a[2]]]
                elif op=='vrange':
                    ref,start,count=a
                    assert count==len(ref[3])+1 and start+count<=m.regs
                    words += [0x74|(count<<8),M[ref],start];outs=max(outs,count)
                elif op in ('virtual','super','direct','static','interface'):
                    ref,registers=a;L=len(registers);assert L<=5 and all(0<=x<m.regs and x<16 for x in registers)
                    assert L==len(ref[3])+(op!='static'),(m.ref,ref,registers)
                    outs=max(outs,L);regs=list(registers)+[0]*(5-L);c,d,e,f,g=regs
                    words +=[{'virtual':0x6e,'super':0x6f,'direct':0x70,'static':0x71,'interface':0x72}[op]|(L<<12)|(g<<8),M[ref],c|(d<<4)|(e<<8)|(f<<12)]
                elif op in ('res','obj','exception','return','returno','throw'):words +=[{'res':0x0a,'obj':0x0c,'exception':0x0d,'return':0x0f,'returno':0x11,'throw':0x27}[op]|(a[0]<<8)]
                elif op=='ret':words.append(0x0e)
                elif op in ('ifz','ifnz','ifne','ifeq','goto'):
                    pc=len(words)
                    if op=='goto':words+=[0x29,0]
                    elif op in ('ifz','ifnz'):words +=[(0x38 if op=='ifz' else 0x39)|(a[0]<<8),0]
                    else:words +=[(0x33 if op=='ifne' else 0x32)|(a[0]<<8)|(a[1]<<12),0]
                    fix.append((pc,a[-1]))
                else:raise ValueError(op)
            for pc,l in fix:
                delta=labels[l]-pc;assert -32768<=delta<32768 and delta;words[pc+1]=delta&65535
            data.extend(P('HHHHII',m.regs,len(r[3])+1,outs,len(m.catches),0,len(words))+P('H'*len(words),*words))
            if m.catches:
                if len(words)%2:data.extend(b'\0\0')
                handlers=bytearray(uleb(len(m.catches)))
                for start,end,typ,dst in m.catches:
                    data.extend(P('IHH',labels[start],labels[end]-labels[start],len(handlers)))
                    handlers.extend(uleb(1)+uleb(T[typ])+uleb(labels[dst]))
                data.extend(handlers)
        maps.append((0x2000,len(classes),len(data)))
        for i,cls in enumerate(classes):
            off=len(data);fld=[f for f in fields if f[0]==cls];ms=sorted((r for r in self.methods if r[0]==cls),key=M.get);direct=[r for r in ms if r[1]=='<init>'];virt=[r for r in ms if r not in direct]
            data.extend(uleb(0)+uleb(len(fld))+uleb(len(direct))+uleb(len(virt)))
            last=0
            for f in fld:data.extend(uleb(F[f]-last)+uleb(self.fields[f]));last=F[f]
            for group in (direct,virt):
                last=0
                for r in group:data.extend(uleb(M[r]-last)+uleb(self.methods[r].flags)+uleb(code[r]));last=M[r]
            put(co+32*i,'8I',T[cls],1,T[self.classes[cls]],0,0xffffffff,0,off,0)
        align();mapoff=len(data);maps.append((0x1000,1,mapoff));data.extend(P('I',len(maps)))
        for t,n,o in sorted(maps,key=lambda e:e[2]):data.extend(P('HHII',t,0,n,o))
        data[:8]=b'dex\n035\0';put(32,'20I',len(data),112,0x12345678,0,0,mapoff,len(strings),so,len(types),to,len(protos),po,len(fields),fo,len(refs),mo,len(classes),co,len(data)-ds,ds)
        data[12:32]=hashlib.sha1(data[32:]).digest();put(8,'I',zlib.adler32(data[12:])&0xffffffff)
        return bytes(data)

