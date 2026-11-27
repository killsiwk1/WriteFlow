#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#import <sqlite3.h>
#include <string.h>

// Store the same versioned schema that the portable edition uses for backups.
@interface LocalStore : NSObject
@property(nonatomic) sqlite3 *db;
- (BOOL)open:(NSString *)path;
- (NSDictionary *)snapshot;
- (BOOL)commit:(NSString *)json revision:(NSInteger)revision;
@end
@implementation LocalStore
- (BOOL)open:(NSString *)path {
    if (sqlite3_open_v2(path.fileSystemRepresentation,&_db,SQLITE_OPEN_READWRITE|SQLITE_OPEN_CREATE,NULL)!=SQLITE_OK) return NO;
    sqlite3_busy_timeout(_db,5000);
    return sqlite3_exec(_db,"CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,json TEXT NOT NULL); INSERT OR IGNORE INTO state VALUES(1,0,'null');",NULL,NULL,NULL)==SQLITE_OK;
}
- (NSDictionary *)snapshot {
    sqlite3_stmt *s=NULL;
    if (sqlite3_prepare_v2(_db,"SELECT revision,json FROM state WHERE id=1",-1,&s,NULL)!=SQLITE_OK) return nil;
    NSDictionary *result=nil;
    if (sqlite3_step(s)==SQLITE_ROW) {
        NSString *json=[NSString stringWithUTF8String:(const char *)sqlite3_column_text(s,1)];
        if(json) result=@{@"revision":@(sqlite3_column_int64(s,0)),@"json":json};
    }
    sqlite3_finalize(s);
    return result;
}
- (BOOL)commit:(NSString *)json revision:(NSInteger)revision {
    sqlite3_stmt *s=NULL;
    if (sqlite3_prepare_v2(_db,"UPDATE state SET revision=revision+1,json=? WHERE id=1 AND revision=?",-1,&s,NULL)!=SQLITE_OK) return NO;
    sqlite3_bind_text(s,1,json.UTF8String,-1,SQLITE_TRANSIENT);
    sqlite3_bind_int64(s,2,revision);
    BOOL ok=sqlite3_step(s)==SQLITE_DONE && sqlite3_changes(_db)==1;
    sqlite3_finalize(s);
    return ok;
}
- (void)dealloc { if (_db) sqlite3_close(_db); }
@end

@interface App : NSObject <NSApplicationDelegate,WKUIDelegate,WKNavigationDelegate,WKScriptMessageHandlerWithReply>
@property(strong) NSWindow *window;
@property(strong) WKWebView *web;
@property(strong) LocalStore *store;
@property(strong) NSURL *page;
@end
@implementation App
- (void)applicationDidFinishLaunching:(NSNotification *)note {
    NSURL *support=[[[NSFileManager defaultManager] URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask] firstObject];
    NSURL *folder=[support URLByAppendingPathComponent:@"WriteFlow" isDirectory:YES];
    [[NSFileManager defaultManager] createDirectoryAtURL:folder withIntermediateDirectories:YES attributes:nil error:nil];
    self.store=[LocalStore new];
    if (![self.store open:[[folder URLByAppendingPathComponent:@"study.sqlite3"] path]]) {
        NSAlert *alert=[NSAlert new]; alert.messageText=@"无法打开本机学习数据库"; [alert runModal]; [NSApp terminate:nil]; return;
    }
    self.page=[[NSBundle mainBundle] URLForResource:@"WriteFlow" withExtension:@"html"];
    WKWebViewConfiguration *cfg=[WKWebViewConfiguration new];
    [cfg.userContentController addScriptMessageHandlerWithReply:self contentWorld:WKContentWorld.pageWorld name:@"writeflow"];
    self.window=[[NSWindow alloc] initWithContentRect:NSMakeRect(0,0,1080,760) styleMask:NSWindowStyleMaskTitled|NSWindowStyleMaskClosable|NSWindowStyleMaskMiniaturizable|NSWindowStyleMaskResizable backing:NSBackingStoreBuffered defer:NO];
    self.window.title=@"VerbaStep · English Learning & Practice"; self.window.minSize=NSMakeSize(400,470);
    self.web=[[WKWebView alloc] initWithFrame:self.window.contentView.bounds configuration:cfg];
    self.web.UIDelegate=self; self.web.navigationDelegate=self;
    self.window.contentView=self.web;
    NSMenu *menu=[NSMenu new]; NSMenuItem *appItem=[NSMenuItem new]; [menu addItem:appItem]; NSMenu *appMenu=[NSMenu new]; [appMenu addItemWithTitle:@"退出 VerbaStep" action:@selector(terminate:) keyEquivalent:@"q"]; appItem.submenu=appMenu;
    NSMenuItem *editItem=[NSMenuItem new]; [menu addItem:editItem]; NSMenu *edit=[[NSMenu alloc] initWithTitle:@"编辑"]; editItem.submenu=edit;
    [edit addItemWithTitle:@"撤销" action:@selector(undo:) keyEquivalent:@"z"]; [edit addItemWithTitle:@"剪切" action:@selector(cut:) keyEquivalent:@"x"]; [edit addItemWithTitle:@"复制" action:@selector(copy:) keyEquivalent:@"c"]; [edit addItemWithTitle:@"粘贴" action:@selector(paste:) keyEquivalent:@"v"]; [edit addItemWithTitle:@"全选" action:@selector(selectAll:) keyEquivalent:@"a"]; NSApp.mainMenu=menu;
    [self.web loadFileURL:self.page allowingReadAccessToURL:self.page];
    [self.window center]; [self.window makeKeyAndOrderFront:nil]; [NSApp activateIgnoringOtherApps:YES];
}
- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender { return YES; }
- (void)webView:(WKWebView *)view decidePolicyForNavigationAction:(WKNavigationAction *)action decisionHandler:(void (^)(WKNavigationActionPolicy))reply {
    reply([action.request.URL isEqual:self.page]?WKNavigationActionPolicyAllow:WKNavigationActionPolicyCancel);
}
- (void)webView:(WKWebView *)view runJavaScriptConfirmPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(BOOL))reply {
    NSAlert *a=[NSAlert new]; a.messageText=message; [a addButtonWithTitle:@"取消"]; [a addButtonWithTitle:@"确认"];
    [a beginSheetModalForWindow:self.window completionHandler:^(NSModalResponse r){reply(r==NSAlertSecondButtonReturn);}];
}
- (void)webView:(WKWebView *)view runOpenPanelWithParameters:(WKOpenPanelParameters *)p initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSArray<NSURL *> *))reply {
    NSOpenPanel *panel=[NSOpenPanel openPanel]; panel.allowsMultipleSelection=NO;panel.canChooseDirectories=NO;
    [panel beginSheetModalForWindow:self.window completionHandler:^(NSModalResponse r){reply(r==NSModalResponseOK?panel.URLs:nil);}];
}
- (void)userContentController:(WKUserContentController *)controller didReceiveScriptMessage:(WKScriptMessage *)m replyHandler:(void (^)(id,NSString *))reply {
    if (!m.frameInfo.mainFrame || ![m.frameInfo.request.URL isEqual:self.page] || ![m.body isKindOfClass:NSDictionary.class]) { reply(nil,@"来源无效");return; }
    NSDictionary *args=m.body;
    if ([args[@"op"] isEqual:@"load"]) { NSDictionary *v=self.store.snapshot;reply(v,v?nil:@"本机读取失败");return; }
    if ([args[@"op"] isEqual:@"commit"] && [args[@"json"] isKindOfClass:NSString.class] && [args[@"revision"] isKindOfClass:NSNumber.class]) {
        BOOL ok=[self.store commit:args[@"json"] revision:[args[@"revision"] integerValue]];reply(@(ok),nil);return;
    }
    if ([args[@"op"] isEqual:@"export"] && [args[@"data"] isKindOfClass:NSString.class] && [args[@"name"] isKindOfClass:NSString.class]) {
        NSData *data=[[NSData alloc] initWithBase64EncodedString:args[@"data"] options:0];
        if(!data){reply(nil,@"导出内容损坏");return;}
        NSSavePanel *panel=[NSSavePanel savePanel];panel.nameFieldStringValue=[args[@"name"] lastPathComponent];
        [panel beginSheetModalForWindow:self.window completionHandler:^(NSModalResponse r){
            if(r!=NSModalResponseOK){reply(@NO,nil);return;}
            NSError *error=nil;BOOL ok=[data writeToURL:panel.URL options:NSDataWritingAtomic error:&error];reply(@(ok),ok?nil:error.localizedDescription);
        }];return;
    }
    reply(nil,@"未知操作");
}
@end

int main(int argc,const char *argv[]) {
    @autoreleasepool {
        if (argc==2 && strcmp(argv[1],"--self-test")==0) {
            NSURL *page=[[NSBundle mainBundle] URLForResource:@"WriteFlow" withExtension:@"html"];
            NSString *html=[NSString stringWithContentsOfURL:page encoding:NSUTF8StringEncoding error:nil];
            if(![html containsString:@"WF500"]) return 2;
            NSString *path=[NSTemporaryDirectory() stringByAppendingPathComponent:[NSUUID UUID].UUIDString];
            LocalStore *s=[LocalStore new]; if(![s open:path]||![s commit:@"{\"test\":1}" revision:0]||[s commit:@"{}" revision:0])return 3;
            s=nil;s=[LocalStore new];BOOL ok=[s open:path]&&[s.snapshot[@"json"] isEqual:@"{\"test\":1}"]&&[s.snapshot[@"revision"] integerValue]==1;
            s=nil;[[NSFileManager defaultManager] removeItemAtPath:path error:nil];return ok?0:4;
        }
        NSApplication *app=[NSApplication sharedApplication]; [app setActivationPolicy:NSApplicationActivationPolicyRegular];
        __attribute__((objc_precise_lifetime)) App *delegate=[App new]; app.delegate=delegate; [app run]; (void)delegate; return 0;
    }
}
