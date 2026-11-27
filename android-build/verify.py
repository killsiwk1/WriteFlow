"""Read the delivered APK, independently verify both signatures and its compiled entry points."""
from pathlib import Path
from struct import unpack_from,pack
from hashlib import sha1,sha256
from zipfile import ZipFile
from tempfile import TemporaryDirectory
import subprocess,zlib,base64,json,re
from xml.etree import ElementTree as ET
import sys
from collections import Counter
apk=Path(sys.argv[1]).read_bytes()
U=lambda b,p:unpack_from('<I',b,p)[0]
H=lambda b,p:unpack_from('<H',b,p)[0]
Q=lambda b,p:unpack_from('<Q',b,p)[0]
def lp(b):
    n=U(b,0);assert n<=len(b)-4;return b[4:4+n],b[4+n:]
def exactly(b):
    v,tail=lp(b);assert tail==b'';return v
e=len(apk)-22;assert apk[e:e+4]==b'PK\x05\x06'
central=U(apk,e+16);assert apk[central-16:central]==b'APK Sig Block 42'
start=central-8-Q(apk,central-24)
assert Q(apk,start)==Q(apk,central-24)
n=Q(apk,start+8);assert U(apk,start+16)==0x7109871a
signer=exactly(exactly(apk[start+20:start+16+n]))
signed,tail=lp(signer);signatures,tail=lp(tail);pub=exactly(tail)
digests,tail=lp(signed);certs,tail=lp(tail);assert exactly(tail)==b''
entry=exactly(digests);sig=exactly(signatures);assert U(entry,0)==U(sig,0)==0x103
digest=exactly(entry[4:]);signature=exactly(sig[4:]);cert=exactly(certs)
orig_eocd=bytearray(apk[e:]);orig_eocd[16:20]=pack('<I',start)
chunk_hashes=[]
for sec in (apk[:start],apk[central:e],orig_eocd):
    for o in range(0,len(sec),1<<20):
        part=sec[o:o+(1<<20)];chunk_hashes.append(sha256(b'\xa5'+pack('<I',len(part))+part).digest())
assert sha256(b'\x5a'+pack('<I',len(chunk_hashes))+b''.join(chunk_hashes)).digest()==digest
def openssl(*args,data=b''):
    r=subprocess.run(['openssl',*args],input=data,capture_output=True);assert r.returncode==0,r.stderr;return r.stdout
with ZipFile(sys.argv[1]) as z,TemporaryDirectory() as t:
    dest=Path(t);assert z.testzip() is None
    pem=openssl('x509','-inform','DER','-pubkey','-noout',data=cert)
    assert openssl('pkey','-pubin','-outform','DER',data=pem)==pub
    (dest/'pub').write_bytes(pem);(dest/'sig').write_bytes(signature)
    assert b'Verified OK' in openssl('dgst','-sha256','-verify',str(dest/'pub'),'-signature',str(dest/'sig'),data=signed)
    sf=z.read('META-INF/WRITEFLOW.SF');(dest/'sf').write_bytes(sf);mf=z.read('META-INF/MANIFEST.MF')
    assert openssl('smime','-verify','-binary','-noverify','-inform','DER','-content',str(dest/'sf'),data=z.read('META-INF/WRITEFLOW.RSA'))==sf
    assert base64.b64encode(sha256(mf).digest()) in sf
    for section in mf.split(b'\r\n\r\n')[1:]:
        if not section:continue
        name,h=section.split(b'\r\n');assert base64.b64decode(h.split(b': ')[1])==sha256(z.read(name[6:].decode())).digest()
        assert base64.b64encode(sha256(section+b'\r\n\r\n').digest()) in sf
    ax=z.read('AndroidManifest.xml');dx=z.read('classes.dex');html=z.read('assets/WriteFlow.html').decode()
assert U(ax,4)==len(ax)
at=8;stack=[];tags=[];ids=[]
while at<len(ax):
    t,h,size=unpack_from('<HHI',ax,at)
    if t==1:
        strings=[];off=at+U(ax,at+20)
        for i in range(U(ax,at+8)):
            p=off+U(ax,at+28+4*i);l=H(ax,p);strings.append(ax[p+2:p+2+2*l].decode('utf-16-le'))
    elif t==0x180:ids=[U(ax,pos) for pos in range(at+8,at+size,4)]
    elif t==0x102:
        name=strings[U(ax,at+20)];attrs={};pos=at+16+H(ax,at+24)
        for i in range(H(ax,at+28)):
            ns,key,raw,sz,zero,typ,val=unpack_from('<IIIHBBI',ax,pos);assert sz==8 and not zero
            attrs[strings[key]]=strings[val] if typ==3 else val
            if ns!=0xffffffff:assert strings[ns]=='http://schemas.android.com/apk/res/android' and ids[key]
            pos+=20
        stack.append(name);tags.append((name,attrs))
    elif t==0x103:assert stack.pop()==strings[U(ax,at+20)]
    at+=size
assert not stack and [v['name'] for k,v in tags if k=='uses-permission']==['android.permission.INTERNET']
g=dict(tags);assert g['manifest']['package']=='local.writeflow.app' and g['uses-sdk']['minSdkVersion']==26 and g['activity']['exported']
assert g['action']['name']=='android.intent.action.MAIN' and g['category']['name']=='android.intent.category.LAUNCHER'
assert dx[:8]==b'dex\n035\0' and len(dx)==U(dx,32)
assert sha1(dx[32:]).digest()==dx[12:32] and zlib.adler32(dx[12:])==U(dx,8)
def leb(b,p):
    x=0;shift=0
    while 1:
        v=b[p];p+=1;x|=(v&127)<<shift
        if v<128:return x,p
        shift+=7
def elems(offset,width):
    count,begin=unpack_from('<II',dx,offset);return range(begin,begin+count*width,width)
names=[]
for p in elems(56,4):
    q=U(dx,p);l,q=leb(dx,q);names.append(dx[q:dx.index(b'\0',q)].decode())
types=[names[U(dx,p)] for p in elems(64,4)]
meth=[(types[H(dx,p)],names[U(dx,p+4)]) for p in elems(88,8)]
assert ('Llocal/writeflow/app/MainActivity;','onCreate') in meth
widths={0x0a:1,0x0c:1,0x0d:1,0x0e:1,0x0f:1,0x11:1,0x13:2,0x1a:2,0x22:2,0x23:2,0x29:2,0x32:2,0x33:2,0x38:2,0x39:2,0x54:2,0x5b:2,**dict.fromkeys([0x6e,0x6f,0x70,0x71,0x72,0x74],3)}
compiled={};checked=0
for co in elems(96,32):
    q=U(dx,co+24);counts=[]
    for _ in range(4):v,q=leb(dx,q);counts.append(v)
    for _ in range(sum(counts[:2])):_,q=leb(dx,q);_,q=leb(dx,q)
    for total in counts[2:]:
        idx=0
        for _ in range(total):
            delta,q=leb(dx,q);idx+=delta;flags,q=leb(dx,q);code,q=leb(dx,q)
            nr,ins,outs,nt=unpack_from('<4H',dx,code);n=U(dx,code+12);words=unpack_from('<'+'H'*n,dx,code+16)
            pos=0;starts=set();targets=[];calls=[]
            while pos<n:
                starts.add(pos);op=words[pos]&255;sz=widths[op]
                if op==0x29 or op in range(0x32,0x3a):targets.append(pos+unpack_from('<h',dx,code+16+(pos+1)*2)[0])
                if op in (0x6e,0x6f,0x70,0x71,0x72,0x74):
                    calls.append(meth[words[pos+1]]);cnt=(words[pos]>>8) if op==0x74 else words[pos]>>12
                    assert cnt<=outs
                    if op==0x74:assert words[pos+2]+cnt<=nr
                    else:assert all(r<nr for r in [*((words[pos+2]>>(4*i))&15 for i in range(4)),(words[pos]>>8)&15][:cnt])
                pos+=sz
            assert pos==n and set(targets)<=starts
            compiled[meth[idx]]=calls;checked+=1
assert ('Landroid/webkit/WebView;','evaluateJavascript') in compiled['Llocal/writeflow/app/MainActivity;','onBackPressed']
assert ('Landroid/app/Activity;','finish') in compiled['Llocal/writeflow/app/EditorChrome;','onJsPrompt']
assert 'window.navigateBack && window.navigateBack()' in names and 'writeflow-exit' in names and 'writeflow-exit' in html
launch=compiled['Llocal/writeflow/app/MainActivity;','onCreate']
assert ('Landroid/webkit/WebView;','loadDataWithBaseURL') in launch
assert ('Landroid/webkit/WebSettings;','setDomStorageEnabled') in launch
assert any(name=='onShowFileChooser' for _,name in compiled)
assert any(name=='onJsPrompt' for _,name in compiled)
assert any(name=='onActivityResult' for _,name in compiled)
bank=json.loads(re.search(r'const BANK=(\[.*?\]);\n',html,re.S)[1])
assert len(bank)==3000 and len(set(q['id'] for q in bank))==3000 and 'writeflow-export' in html
course=json.loads(re.search(r'const curriculum=(\{.*?\});\n',html,re.S)[1])
all_questions=bank+course['questions']
assert len(course['lessons'])==218 and len(all_questions)==len({q['id'] for q in all_questions})==3725
assert g['manifest']['versionCode']==13 and g['manifest']['versionName']=='3.1.1'
print('PASS — independent APK v2 content digest, certificate/public key, RSA signature, v1 CMS and per-entry digests')
print('PASS — binary manifest, launcher, API range and Internet permission only; DEX checksum, method references, branches and register ranges')
print('PASS —',checked,'compiled methods; 3725 bundled questions; HTML plus Android file import/export hooks')

