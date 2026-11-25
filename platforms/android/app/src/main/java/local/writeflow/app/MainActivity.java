package local.writeflow.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.*;
import android.widget.Toast;
import android.util.Base64;
import java.io.*;
import java.util.Collections;

public final class MainActivity extends Activity {
    private static final String PAGE = "https://writeflow.invalid/WriteFlow.html";
    private static final int OPEN = 1, SAVE = 2;
    private WebView web;
    private ValueCallback<Uri[]> choosing;
    private File pendingFile;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (state != null && state.containsKey("pendingFile")) {
            pendingFile = new File(getCacheDir(), state.getString("pendingFile"));
        }
        web = new WebView(this);
        WebSettings cfg = web.getSettings();
        cfg.setJavaScriptEnabled(true);
        cfg.setDomStorageEnabled(true);
        cfg.setAllowFileAccess(false);
        cfg.setAllowContentAccess(false);
        cfg.setBlockNetworkLoads(false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) { return true; }
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                try {
                    if (PAGE.equals(req.getUrl().toString())) {
                        return new WebResourceResponse("text/html", "UTF-8", getAssets().open("WriteFlow.html"));
                    }
                    if ("https".equals(req.getUrl().getScheme())) return null;
                } catch (IOException ignored) { }
                return new WebResourceResponse("text/plain","UTF-8",404,"Missing",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> result,FileChooserParams params) {
                if (choosing != null) choosing.onReceiveValue(null);
                choosing = result;
                Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE);
                String[] types = params.getAcceptTypes();
                pick.setType(types.length==1 && types[0].startsWith("image/") && !types[0].contains(",") ? types[0] : "*/*");
                try { startActivityForResult(pick, OPEN); }
                catch (RuntimeException e) { choosing.onReceiveValue(null); choosing = null; notice("无法打开系统文件选择器"); }
                return true;
            }
        });
        web.addJavascriptInterface(new ExportBridge(), "WriteFlowDevice");
        setContentView(web);
        web.loadUrl(PAGE);
    }
    @Override public void onBackPressed() {
        if (web != null) web.evaluateJavascript("window.navigateBack && window.navigateBack()",null);
    }
    public final class ExportBridge {
        @JavascriptInterface public void exitApp() { runOnUiThread(MainActivity.this::finish); }
        @JavascriptInterface public void save(String name, String mime, String data) {
            try {
                final File file = File.createTempFile("export-", ".tmp", getCacheDir());
                try (InputStream input = new android.util.Base64InputStream(new ByteArrayInputStream(data.getBytes(java.nio.charset.StandardCharsets.US_ASCII)), Base64.DEFAULT);
                     OutputStream out = new FileOutputStream(file)) { copy(input, out); }
                runOnUiThread(() -> {
                    if (pendingFile != null) { file.delete(); notice("请先完成当前导出"); return; }
                    pendingFile=file;
                    Intent create=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE);
                    create.setType(mime.split(";")[0]); create.putExtra(Intent.EXTRA_TITLE,name);
                    try { startActivityForResult(create,SAVE); }
                    catch (RuntimeException e) { file.delete(); pendingFile=null; notice("无法打开保存位置"); }
                });
            } catch (IOException | IllegalArgumentException e) { runOnUiThread(() -> notice("导出失败，请检查设备剩余空间")); }
        }
    }
    private static void copy(InputStream in, OutputStream out) throws IOException {
        byte[] buf=new byte[32768]; int count;
        while ((count=in.read(buf))!=-1) out.write(buf,0,count);
    }
    @Override protected void onActivityResult(int code,int result,Intent intent) {
        super.onActivityResult(code,result,intent);
        Uri uri = result==RESULT_OK && intent!=null ? intent.getData() : null;
        if (code==OPEN && choosing!=null) { choosing.onReceiveValue(uri==null?null:new Uri[]{uri}); choosing=null; }
        if (code==SAVE && pendingFile!=null) {
            File file=pendingFile; pendingFile=null;
            if (uri==null) { file.delete(); return; }
            new Thread(() -> {
                try (InputStream in=new FileInputStream(file); OutputStream out=getContentResolver().openOutputStream(uri,"wt")) {
                    if (out==null) throw new IOException("No stream");
                    copy(in,out); runOnUiThread(() -> notice("文件已保存"));
                } catch (IOException | SecurityException e) { runOnUiThread(() -> notice("文件保存失败")); }
                finally { file.delete(); }
            }).start();
        }
    }
    @Override protected void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        if (pendingFile!=null) state.putString("pendingFile",pendingFile.getName());
    }
    private void notice(String text) { Toast.makeText(this,text,Toast.LENGTH_SHORT).show(); }
    @Override protected void onDestroy() { web.removeJavascriptInterface("WriteFlowDevice"); web.destroy(); super.onDestroy(); }
}
