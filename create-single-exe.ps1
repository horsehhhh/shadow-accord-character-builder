# PowerShell script to create single executable using IExpress
$appPath = "C:\Users\brend\Desktop\shadow-accord-test\dist\ShadowAccord-CharacterBuilder-win32-x64"
$outputPath = "C:\Users\brend\Desktop\shadow-accord-test\dist\ShadowAccord-CharacterBuilder-Single.exe"
$sedFile = "C:\Users\brend\Desktop\shadow-accord-test\iexpress.sed"

# Create IExpress directive file
$sedContent = @"
[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=%InstallPrompt%
DisplayLicense=%DisplayLicense%
FinishMessage=%FinishMessage%
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=%PostInstallCmd%
AdminQuietInstCmd=%AdminQuietInstCmd%
UserQuietInstCmd=%UserQuietInstCmd%
SourceFiles=SourceFiles

[Strings]
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName=$outputPath
FriendlyName=Shadow Accord Character Builder
AppLaunched=ShadowAccord-CharacterBuilder.exe
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
FILE0="ShadowAccord-CharacterBuilder.exe"

[SourceFiles]
SourceFiles0=$appPath\

[SourceFiles0]
%FILE0%=
"@

# Write the SED file
$sedContent | Out-File -FilePath $sedFile -Encoding ASCII

# Run IExpress
Write-Host "Creating single executable with IExpress..."
Start-Process -FilePath "iexpress.exe" -ArgumentList "/N", $sedFile -Wait -NoNewWindow

if (Test-Path $outputPath) {
    Write-Host "SUCCESS: Single executable created at $outputPath"
    $size = (Get-Item $outputPath).Length / 1MB
    Write-Host "File size: $([math]::Round($size, 2)) MB"
} else {
    Write-Host "ERROR: Failed to create single executable"
}