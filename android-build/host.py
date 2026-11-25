"""Android framework bindings for WriteFlow. No Internet or storage permissions."""
from dexbuild import Dex
from pathlib import Path
d=Dex()
def L(s):return 'L'+s+';'
app=L('local/writeflow/app/MainActivity');chrome=L('local/writeflow/app/EditorChrome');client=L('local/writeflow/app/OfflineClient')
act=L('android/app/Activity');ch=L('android/webkit/WebChromeClient');wc=L('android/webkit/WebViewClient');web=L('android/webkit/WebView');sett=L('android/webkit/WebSettings')
ctx=L('android/content/Context');view=L('android/view/View');bundle=L('android/os/Bundle');intent=L('android/content/Intent');uri=L('android/net/Uri')
vr=L('android/webkit/ValueCallback');params=L('android/webkit/WebChromeClient$FileChooserParams');req=L('android/webkit/WebResourceRequest');resp=L('android/webkit/WebResourceResponse')
st=L('java/lang/String');ob=L('java/lang/Object');fis=L('java/io/FileInputStream');fos=L('java/io/FileOutputStream');stream=L('java/io/InputStream');out=L('java/io/OutputStream');dis=L('java/io/DataInputStream')
toast=L('android/widget/Toast');exc=L('java/lang/Exception');jsr=L('android/webkit/JsPromptResult');assets=L('android/content/res/AssetManager');resolver=L('android/content/ContentResolver');json=L('org/json/JSONObject')
URL='https://writeflow.invalid/WriteFlow.html'
for a,b in [(app,act),(chrome,ch),(client,wc)]:d.cls(a,b)
webfield=d.fld(app,'web',web)
cb=d.fld(app,'chooser',vr)
owner={c:d.fld(c,'owner',app) for c in (chrome,client)}
# Each call lists the framework prototype and the source registers explicitly.
def call(k,c,n,r,ps,rs):return (k,d.ref(c,n,r,*ps),rs)
def V(c,n,r,ps,rs):return call('virtual',c,n,r,ps,rs)
def D(c,n,ps,rs):return call('direct',c,n,'V',ps,rs)
def Su(c,n,r,ps,rs):return call('super',c,n,r,ps,rs)
def St(c,n,r,ps,rs):return call('static',c,n,r,ps,rs)
def I(c,n,r,ps,rs):return call('interface',c,n,r,ps,rs)
def label(s):return (':',s)
def method(c,n,r,p,regs,ops,catches=(),flags=1):d.method(c,n,r,tuple(p),flags,regs,ops,catches)
def message(context,text):
    return [('str',5,text),('const',6,0),St(toast,'makeText',toast,[ctx,L('java/lang/CharSequence'),'I'],[context,5,6]),('obj',5),V(toast,'show','V',[],[5])]
method(app,'<init>','V',[],1,[D(act,'<init>',[],[0]),('ret',)],flags=0x10001)
for c,sup in [(chrome,ch),(client,wc)]:
    method(c,'<init>','V',[app],2,[D(sup,'<init>',[],[0]),('iput',1,0,owner[c]),('ret',)],flags=0x10001)
method(app,'onCreate','V',[bundle],12,[
    Su(act,'onCreate','V',[bundle],[10,11]),('const',2,1),V(act,'requestWindowFeature','Z',['I'],[10,2]),('new',0,web),D(web,'<init>',[ctx],[0,10]),
    ('iput',0,10,webfield),V(web,'getSettings',sett,[],[0]),('obj',1),('const',2,1),
    V(sett,'setJavaScriptEnabled','V',['Z'],[1,2]),V(sett,'setDomStorageEnabled','V',['Z'],[1,2]),('const',2,0),V(sett,'setBlockNetworkLoads','V',['Z'],[1,2]),
    ('const',2,0),V(sett,'setAllowFileAccess','V',['Z'],[1,2]),V(sett,'setAllowContentAccess','V',['Z'],[1,2]),
    ('new',3,client),D(client,'<init>',[app],[3,10]),V(web,'setWebViewClient','V',[wc],[0,3]),
    ('new',3,chrome),D(chrome,'<init>',[app],[3,10]),V(web,'setWebChromeClient','V',[ch],[0,3]),
    V(act,'setContentView','V',[view],[10,0]),V(ctx,'getAssets',assets,[],[10]),('obj',1),('str',2,'WriteFlow.html'),V(assets,'open',stream,[st],[1,2]),('obj',1),
    ('new',6,L('java/util/Scanner')),('str',2,'UTF-8'),D(L('java/util/Scanner'),'<init>',[stream,st],[6,1,2]),('str',2,r'\A'),V(L('java/util/Scanner'),'useDelimiter',L('java/util/Scanner'),[st],[6,2]),V(L('java/util/Scanner'),'next',st,[],[6]),('obj',2),V(L('java/util/Scanner'),'close','V',[],[6]),
    ('str',1,URL),('str',3,'text/html'),('str',4,'UTF-8'),('str',5,URL),('vrange',d.ref(web,'loadDataWithBaseURL','V',st,st,st,st,st),0,6),('ret',)],flags=4)
method(app,'onBackPressed','V',[],4,[
    ('iget',0,3,webfield),('ifz',0,'done'),('str',1,'window.navigateBack && window.navigateBack()'),('const',2,0),
    V(web,'evaluateJavascript','V',[st,vr],[0,1,2]),label('done'),('ret',)])
method(client,'shouldOverrideUrlLoading','Z',[web,req],4,[('const',0,1),('return',0)])
method(client,'shouldInterceptRequest',resp,[web,req],9,[
    label('try'),I(req,'getUrl',uri,[],[8]),('obj',0),V(uri,'getHost',st,[],[0]),('obj',4),('ifz',4,'missing'),('str',1,'.supabase.co'),V(st,'endsWith','Z',[st],[4,1]),('res',2),('ifnz',2,'online'),V(uri,'toString',st,[],[0]),('obj',0),('str',1,URL),V(st,'equals','Z',[ob],[1,0]),('res',2),('ifz',2,'missing'),
    ('iget',1,6,owner[client]),V(ctx,'getAssets',assets,[],[1]),('obj',1),('str',2,'WriteFlow.html'),V(assets,'open',stream,[st],[1,2]),('obj',2),
    ('new',3,resp),('str',0,'text/html'),('str',1,'UTF-8'),D(resp,'<init>',[st,st,stream],[3,0,1,2]),('returno',3),label('end'),
    label('exception'),('exception',0),label('online'),label('missing'),('const',3,0),('returno',3)],
    [('try','end',exc,'exception')])
method(chrome,'onShowFileChooser','Z',[web,vr,params],12,[
    ('iget',0,8,owner[chrome]),('iget',1,0,cb),('ifz',1,'new'),('const',2,0),I(vr,'onReceiveValue','V',[ob],[1,2]),label('new'),('iput',10,0,cb),
    label('try'),('str',1,'android.intent.action.OPEN_DOCUMENT'),('new',2,intent),D(intent,'<init>',[st],[2,1]),('str',1,'android.intent.category.OPENABLE'),V(intent,'addCategory',intent,[st],[2,1]),
    ('str',1,'*/*'),V(intent,'setType',intent,[st],[2,1]),('const',1,1),V(act,'startActivityForResult','V',[intent,'I'],[0,2,1]),label('end'),('goto','done'),
    label('err'),('exception',3),('const',1,0),('iput',1,0,cb),I(vr,'onReceiveValue','V',[ob],[10,1]),*message(0,'无法打开文件选择器'),label('done'),('const',0,1),('return',0)],
    [('try','end',exc,'err')])
# Javascript requests export with prompt(marker, JSON): filename, MIME, base64.
# Export bytes are staged in a private file so activity recreation does not lose a pending export.
method(chrome,'onJsPrompt','Z',[web,st,st,st,jsr],15,[
    ('str',0,URL),V(st,'equals','Z',[ob],[0,11]),('res',1),('ifz',1,'other'),('str',0,'writeflow-exit'),V(st,'equals','Z',[ob],[0,12]),('res',1),('ifz',1,'export'),
    ('str',0,'ok'),V(jsr,'confirm','V',[st],[14,0]),('iget',7,9,owner[chrome]),V(act,'finish','V',[],[7]),('const',0,1),('return',0),label('export'),('str',0,'writeflow-export'),V(st,'equals','Z',[ob],[0,12]),('res',1),('ifz',1,'other'),
    ('iget',7,9,owner[chrome]),label('try'),('new',0,json),D(json,'<init>',[st],[0,13]),
    ('str',1,'bytes'),V(json,'getString',st,[st],[0,1]),('obj',2),('const',3,0),St(L('android/util/Base64'),'decode','[B',[st,'I'],[2,3]),('obj',2),
    ('str',1,'export.pending'),V(ctx,'openFileOutput',fos,[st,'I'],[7,1,3]),('obj',4),V(out,'write','V',['[B'],[4,2]),V(out,'close','V',[],[4]),
    ('str',1,'android.intent.action.CREATE_DOCUMENT'),('new',2,intent),D(intent,'<init>',[st],[2,1]),('str',1,'android.intent.category.OPENABLE'),V(intent,'addCategory',intent,[st],[2,1]),
    ('str',1,'mime'),V(json,'getString',st,[st],[0,1]),('obj',3),V(intent,'setType',intent,[st],[2,3]),
    ('str',1,'name'),V(json,'getString',st,[st],[0,1]),('obj',3),('str',1,'android.intent.extra.TITLE'),V(intent,'putExtra',intent,[st,st],[2,1,3]),
    ('const',1,2),V(act,'startActivityForResult','V',[intent,'I'],[7,2,1]),('str',1,'ok'),V(jsr,'confirm','V',[st],[14,1]),label('end'),('goto','done'),
    label('err'),('exception',3),('str',1,'failed'),V(jsr,'confirm','V',[st],[14,1]),*message(7,'无法导出文件'),label('done'),('const',0,1),('return',0),
    label('other'),('const',0,0),('return',0)], [('try','end',exc,'err')])
# Activity result: route document picker results and copy staged data to the user-selected URI.
method(app,'onActivityResult','V',['I','I',intent],15,[
    Su(act,'onActivityResult','V',['I','I',intent],[11,12,13,14]),('const',0,1),('ifne',0,12,'save'),
    ('iget',1,11,cb),('ifz',1,'ret'),('const',0,0),('iput',0,11,cb),St(params,'parseResult','['+uri,['I',intent],[13,14]),('obj',2),I(vr,'onReceiveValue','V',[ob],[1,2]),('ret',),
    label('save'),('const',0,2),('ifne',0,12,'ret'),('const',0,-1),('ifne',0,13,'clean'),('ifz',14,'clean'),
    label('try'),V(intent,'getData',uri,[],[14]),('obj',1),('ifz',1,'clean'),('str',0,'export.pending'),V(ctx,'openFileInput',fis,[st],[11,0]),('obj',2),
    V(fis,'available','I',[],[2]),('res',3),('array',4,3,'[B'),('new',3,dis),D(dis,'<init>',[stream],[3,2]),V(dis,'readFully','V',['[B'],[3,4]),V(stream,'close','V',[],[3]),
    V(ctx,'getContentResolver',resolver,[],[11]),('obj',2),('str',0,'wt'),V(resolver,'openOutputStream',out,[uri,st],[2,1,0]),('obj',2),V(out,'write','V',['[B'],[2,4]),V(out,'close','V',[],[2]),*message(11,'文件已保存'),label('end'),('goto','clean'),
    label('err'),('exception',1),*message(11,'文件保存失败'),label('clean'),('str',0,'export.pending'),V(ctx,'deleteFile','Z',[st],[11,0]),label('ret'),('ret',)], [('try','end',exc,'err')],flags=4)
if __name__=='__main__':Path(__file__).with_name('classes.dex').write_bytes(d.build())

