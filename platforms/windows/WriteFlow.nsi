Unicode true
!include "MUI2.nsh"
Name "WriteFlow 3.0.3 英语学习"
OutFile "../../dist/WriteFlow-Windows-Setup.exe"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\Programs\WriteFlow"
InstallDirRegKey HKCU "Software\WriteFlow" "InstallDir"
Icon "../../assets/WriteFlow.ico"
!define MUI_ICON "../../assets/WriteFlow.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\WriteFlow.exe"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "SimpChinese"
Section
 SetOutPath "$INSTDIR"
 File "../../dist/WriteFlow.exe"
 File "../../dist/WriteFlow.html"
 File "../../assets/WriteFlow.ico"
 WriteRegStr HKCU "Software\WriteFlow" "InstallDir" "$INSTDIR"
 CreateShortCut "$DESKTOP\WriteFlow.lnk" "$INSTDIR\WriteFlow.exe" "" "$INSTDIR\WriteFlow.ico"
 CreateShortCut "$SMPROGRAMS\WriteFlow.lnk" "$INSTDIR\WriteFlow.exe" "" "$INSTDIR\WriteFlow.ico"
SectionEnd
