"""Encode the small Android manifest as Android binary XML."""
import struct
P=lambda fmt,*v:struct.pack('<'+fmt,*v)
NO=0xffffffff
NS='http://schemas.android.com/apk/res/android'
ids={'icon':0x01010002,'label':0x01010001,'name':0x01010003,'exported':0x01010010,'configChanges':0x0101001f,'minSdkVersion':0x0101020c,'versionCode':0x0101021b,'versionName':0x0101021c,'targetSdkVersion':0x01010270,'allowBackup':0x01010280,'windowSoftInputMode':0x0101022b}
def manifest():
    strings=sorted(ids,key=ids.get)
    def idx(v):
        if v not in strings:strings.append(v)
        return strings.index(v)
    def node(t,body):return P('HHIII',t,16,len(body)+16,1,NO)+body
    def ns(start):return node(0x100 if start else 0x101,P('II',idx('android'),idx(NS)))
    def tag(n,attrs=()):
        a=b''
        for k,kind,v in sorted(attrs,key=lambda x:ids.get(x[0],0)):
            nsid=idx(NS) if k in ids else NO
            string=idx(v) if kind==3 else NO
            a+=P('IIIHBBI',nsid,idx(k),string,8,0,kind,string if kind==3 else v)
        return node(0x102,P('IIHHHHHH',NO,idx(n),20,20,len(attrs),0,0,0)+a)
    def end(n):return node(0x103,P('II',NO,idx(n)))
    def leaf(n,attrs):return tag(n,attrs)+end(n)
    body=ns(True)+tag('manifest',[('package',3,'local.writeflow.app'),('versionCode',16,11),('versionName',3,'3.0.3')])
    body+=leaf('uses-sdk',[('minSdkVersion',16,26),('targetSdkVersion',16,32)])

    body+=leaf('uses-permission',[('name',3,'android.permission.INTERNET')])
    body+=tag('application',[('icon',1,0x7f010000),('label',3,'WriteFlow'),('allowBackup',18,0)])+tag('activity',[('name',3,'local.writeflow.app.MainActivity'),('exported',18,NO),('configChanges',17,0x4a0),('windowSoftInputMode',17,0x10)])+tag('intent-filter')
    body+=leaf('action',[('name',3,'android.intent.action.MAIN')])+leaf('category',[('name',3,'android.intent.category.LAUNCHER')])+end('intent-filter')+end('activity')+end('application')+end('manifest')+ns(False)
    offsets=[];pool=b''
    for s in strings:
        offsets.append(len(pool));raw=s.encode('utf-16-le');pool+=P('H',len(raw)//2)+raw+b'\0\0'
    pool+=bytes(-len(pool)%4);start=28+4*len(strings)
    table=P('HHIIIIII',1,28,start+len(pool),len(strings),0,0,start,0)+P('I'*len(offsets),*offsets)+pool
    res=P('HHI',0x180,8,8+4*len(ids))+P('I'*len(ids),*sorted(ids.values()))
    return P('HHI',3,8,8+len(table)+len(res)+len(body))+table+res+body

