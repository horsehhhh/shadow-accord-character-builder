; NSIS Script to create self-extracting executable
!define APPNAME "Shadow Accord Character Builder"
!define COMPANYNAME "Shadow Accord Team"
!define DESCRIPTION "Character Builder for Shadow Accord RPG"
!define VERSIONMAJOR 0
!define VERSIONMINOR 1
!define VERSIONBUILD 6

; These will be displayed by the "Click here for support information" link in "Add/Remove Programs"
!define HELPURL "https://github.com/shadowaccord/character-builder"
!define UPDATEURL "https://github.com/shadowaccord/character-builder"
!define ABOUTURL "https://github.com/shadowaccord/character-builder"

!define INSTALLSIZE 400000 ; estimate install size in KB

RequestExecutionLevel user ; don't require admin
InstallDir "$TEMP\${APPNAME}"
Name "${APPNAME}"
Icon "public\favicon.ico"
outFile "dist\ShadowAccord-CharacterBuilder-Portable.exe"

!include LogicLib.nsh

; Modern UI
!include "MUI2.nsh"
!define MUI_ICON "public\favicon.ico"

page directory
Page instfiles

!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_NOTCHECKED
!define MUI_FINISHPAGE_RUN_TEXT "Run ${APPNAME}"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchLink"
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"

function .onInit
    ; Create temp directory
    CreateDirectory "$INSTDIR"
functionEnd

section "install"
    ; Copy all files
    SetOutPath "$INSTDIR"
    File /r "dist\ShadowAccord-CharacterBuilder-win32-x64\*"
    
    ; Create desktop shortcut
    CreateShortcut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\ShadowAccord-CharacterBuilder.exe"
sectionEnd

Function LaunchLink
    ExecShell "" "$INSTDIR\ShadowAccord-CharacterBuilder.exe"
FunctionEnd

function .onInstSuccess
    ; Launch the application
    Exec '"$INSTDIR\ShadowAccord-CharacterBuilder.exe"'
functionEnd