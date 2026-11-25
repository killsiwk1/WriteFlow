#define UNICODE
#define _UNICODE
#include <windows.h>
#include <shlwapi.h>
#include <shellapi.h>
#include <strsafe.h>
static BOOL find_browser(WCHAR *path, DWORD capacity) {
    const WCHAR *apps[] = {L"Microsoft\\Edge\\Application\\msedge.exe", L"Google\\Chrome\\Application\\chrome.exe"};
    const WCHAR *bases[] = {L"ProgramFiles(x86)", L"ProgramW6432", L"ProgramFiles", L"LOCALAPPDATA"};
    for (int i=0;i<2;i++) for(int j=0;j<4;j++){
        WCHAR base[MAX_PATH];
        DWORD n=GetEnvironmentVariableW(bases[j],base,MAX_PATH);
        if(n && n<MAX_PATH && SUCCEEDED(StringCchPrintfW(path,capacity,L"%s\\%s",base,apps[i])) && PathFileExistsW(path)) return TRUE;
    }
    return FALSE;
}
int WINAPI wWinMain(HINSTANCE h,HINSTANCE prev,PWSTR command,int show){
    WCHAR page[MAX_PATH],browser[MAX_PATH],url[4096],args[4200];
    DWORD n=GetModuleFileNameW(NULL,page,MAX_PATH),size=4096;
    if(!n || n>=MAX_PATH || !PathRemoveFileSpecW(page) || !PathAppendW(page,L"WriteFlow.html") || !PathFileExistsW(page) || FAILED(UrlCreateFromPathW(page,url,&size,0))){
        MessageBoxW(NULL,L"找不到应用文件，请重新运行安装包。",L"WriteFlow",MB_ICONERROR);return 1;
    }
    if(!find_browser(browser,MAX_PATH)){
        MessageBoxW(NULL,L"独立窗口需要 Microsoft Edge 或 Google Chrome。也可用本机浏览器打开安装目录中的 WriteFlow.html。",L"WriteFlow",MB_ICONINFORMATION);return 1;
    }
    StringCchPrintfW(args,4200,L"--app=\"%s\"",url);
    if((INT_PTR)ShellExecuteW(NULL,L"open",browser,args,NULL,SW_SHOWNORMAL)<=32){
        MessageBoxW(NULL,L"无法启动学习窗口。请检查浏览器安装。",L"WriteFlow",MB_ICONERROR);return 1;
    }
    return 0;
}
