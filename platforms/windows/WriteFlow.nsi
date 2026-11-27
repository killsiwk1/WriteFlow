Unicode true
!include "MUI2.nsh"
Name "VerbaStep · English Learning & Practice"
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
 Rename "$DESKTOP\WriteFlow.lnk" "$DESKTOP\VerbaStep.lnk"
 Rename "$SMPROGRAMS\WriteFlow.lnk" "$SMPROGRAMS\VerbaStep.lnk"
 CreateShortCut "$DESKTOP\VerbaStep.lnk" "$INSTDIR\WriteFlow.exe" "" "$INSTDIR\WriteFlow.ico"
 CreateShortCut "$SMPROGRAMS\VerbaStep.lnk" "$INSTDIR\WriteFlow.exe" "" "$INSTDIR\WriteFlow.ico"
SectionEnd
