from pathlib import Path
import plistlib, subprocess, shutil, tempfile
root=Path(__file__).resolve().parents[1]
dist=root/'dist'
with tempfile.TemporaryDirectory() as td:
    stage=Path(td)/'stage'
    app=stage/'WriteFlow.app'
    mac=app/'Contents/MacOS'
    res=app/'Contents/Resources'
    mac.mkdir(parents=True);res.mkdir()
    plist={'CFBundleExecutable':'WriteFlow','CFBundleIdentifier':'local.writeflow.desktop','CFBundleName':'VerbaStep','CFBundleDisplayName':'VerbaStep','CFBundlePackageType':'APPL','CFBundleIconFile':'WriteFlow.icns','CFBundleVersion':'35','CFBundleShortVersionString':'3.1.1','LSMinimumSystemVersion':'13.0','NSHighResolutionCapable':True}
    (app/'Contents/Info.plist').write_bytes(plistlib.dumps(plist))
    for language in ('en','zh-Hans'):
        loc=res/(language+'.lproj');loc.mkdir()
        (loc/'InfoPlist.strings').write_text('"CFBundleDisplayName" = "VerbaStep";\n"CFBundleName" = "VerbaStep";\n',encoding='utf-16')
    shutil.copyfile(dist/'WriteFlow.html',res/'WriteFlow.html')
    shutil.copyfile(root/'assets/WriteFlow.icns',res/'WriteFlow.icns')
    exe=mac/'WriteFlow'
    subprocess.run(['xcrun','clang','-arch','arm64','-arch','x86_64','-mmacosx-version-min=13.0','-fobjc-arc','-framework','Cocoa','-framework','WebKit','-lsqlite3',str(root/'platforms/macos/main.m'),'-o',str(exe)],check=True)
    subprocess.run(['codesign','--force','--sign','-',str(app)],check=True)
    subprocess.run([str(exe),'--self-test'],check=True)
    subprocess.run(['codesign','--verify','--strict',str(app)],check=True)
    # Install inside /Applications so future releases use the same file URL.
    comp=Path(td)/'component.plist'
    comp.write_bytes(plistlib.dumps([{'RootRelativeBundlePath':'WriteFlow.app','BundleIsRelocatable':False,'BundleIsVersionChecked':True,'BundleOverwriteAction':'upgrade','BundleHasStrictIdentifier':True}]))
    subprocess.run(['pkgbuild','--root',str(stage),'--component-plist',str(comp),'--identifier','local.writeflow.installer','--version','3.1.1','--install-location','/Applications',str(dist/'WriteFlow-macOS.pkg')],check=True)
    print('Universal native application, SQLite write/reopen/revision self-test and bundle verification passed.')
