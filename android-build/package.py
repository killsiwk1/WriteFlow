"""Build and sign the offline installer using APK Signature Scheme v2 (RSA/SHA-256).
Private signing material is outside the site and every published artifact.
"""
import struct,zlib,hashlib,zipfile,io,subprocess,tempfile,os,base64
from pathlib import Path
from host import d
from manifest import manifest
P=lambda x: struct.pack('<I',x)
Q=lambda x: struct.pack('<Q',x)
LP=lambda b:P(len(b))+b
SHA=lambda b:hashlib.sha256(b).digest()
base=Path(__file__).resolve().parent
out=base.parent/'dist'
keys=Path(os.environ['WRITEFLOW_SIGNING_DIR']).expanduser().resolve()

def run(*cmd,data=None):return subprocess.run(cmd,input=data,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout
def materials():
    os.umask(0o077);keys.mkdir(mode=0o700,exist_ok=True)
    key=keys/'signing.pem';cert=keys/'certificate.pem'
    if not key.exists():run('openssl','genrsa','-out',str(key),'3072')
    if not cert.exists():run('openssl','req','-new','-x509','-sha256','-key',str(key),'-out',str(cert),'-days','10000','-subj','/CN=WriteFlow Offline Release/O=WriteFlow')
    der=run('openssl','x509','-in',str(cert),'-outform','DER')
    pub=run('openssl','pkey','-in',str(key),'-pubout','-outform','DER')
    return key,cert,der,pub
def content_digest(sections):
    chunks=[]
    for part in sections:
        for i in range(0,len(part),1048576):
            chunk=part[i:i+1048576];chunks.append(SHA(b'\xa5'+P(len(chunk))+chunk))
    return SHA(b'\x5a'+P(len(chunks))+b''.join(chunks))
def build():
    key,cert,der,pub=materials()
    html=(out/'WriteFlow.html').read_text()
    bridge="""window.WriteFlowDevice={exitApp(){window.prompt('writeflow-exit','')},save(name,mime,bytes){const result=window.prompt('writeflow-export',JSON.stringify({name,mime:mime.split(';')[0],bytes}));if(result!=='ok')throw Error('文件导出未完成');}};"""
    html=html.replace('<script>','<script>'+bridge+'\n',1)
    files={'AndroidManifest.xml':manifest(),'classes.dex':d.build(),'assets/WriteFlow.html':html.encode()}
    with zipfile.ZipFile(base/'launcher-resources.ap_') as resources:
        files.update({name:resources.read(name) for name in resources.namelist() if name=='resources.arsc' or name.startswith('res/')})
    # Include a conventional JAR signature for tools that inspect V1 metadata.
    def b64(b):return base64.b64encode(b).decode('ascii')
    heads={k:('Name: '+k+'\r\nSHA-256-Digest: '+b64(SHA(v))+'\r\n\r\n').encode() for k,v in files.items()}
    mf=b'Manifest-Version: 1.0\r\nCreated-By: WriteFlow\r\n\r\n'+b''.join(heads.values())
    sf=('Signature-Version: 1.0\r\nX-Android-APK-Signed: 2\r\nSHA-256-Digest-Manifest: '+b64(SHA(mf))+'\r\n\r\n').encode()+b''.join(('Name: '+k+'\r\nSHA-256-Digest: '+b64(SHA(v))+'\r\n\r\n').encode() for k,v in heads.items())
    rsa=run('openssl','smime','-sign','-binary','-noattr','-md','sha256','-signer',str(cert),'-inkey',str(key),'-outform','DER',data=sf)
    files.update({'META-INF/MANIFEST.MF':mf,'META-INF/WRITEFLOW.SF':sf,'META-INF/WRITEFLOW.RSA':rsa})
    bio=io.BytesIO()
    with zipfile.ZipFile(bio,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name,data in files.items():
            if name!='resources.arsc':
                z.writestr(name,data)
                continue
            info=zipfile.ZipInfo(name)
            pad=-(bio.tell()+30+len(name)+4)%4
            info.extra=struct.pack('<HH',0xffff,pad)+bytes(pad)
            z.writestr(info,data,compress_type=zipfile.ZIP_STORED)
    raw=bio.getvalue();e=raw.rfind(b'PK\x05\x06');off=struct.unpack_from('<I',raw,e+16)[0]
    local,central,eocd=raw[:off],raw[off:e],raw[e:]
    alg=0x0103;digest=content_digest([local,central,eocd])
    signed=LP(LP(P(alg)+LP(digest)))+LP(LP(der))+LP(b'')
    signature=run('openssl','dgst','-sha256','-sign',str(key),data=signed)
    signer=LP(signed)+LP(LP(P(alg)+LP(signature)))+LP(pub)
    v2=LP(LP(signer))
    pair=Q(len(v2)+4)+P(0x7109871a)+v2
    size=len(pair)+24;block=Q(size)+pair+Q(size)+b'APK Sig Block 42'
    apk=local+block+central+eocd[:16]+P(off+len(block))+eocd[20:]
    dest=out/'WriteFlow-Android.apk';dest.write_bytes(apk);dest.chmod(0o644)
    print(dest.name,len(apk),hashlib.sha256(apk).hexdigest())
if __name__=='__main__':build()

