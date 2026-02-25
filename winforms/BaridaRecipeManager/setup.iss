; Inno Setup Script for Barida Recipe Manager
; Requires Inno Setup 6.0 or later (https://jrsoftware.org/isdl.php)

#define MyAppName "Barida Recipe Manager"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Barida Makina - Eymen Gozel"
#define MyAppURL "https://barida.xyz"
#define MyAppExeName "BaridaRecipeManager.exe"
#define MyAppAssocName "Barida Recipe File"
#define MyAppAssocExt ".brcp"
#define MyAppAssocKey StringChange(MyAppAssocName, " ", "") + MyAppAssocExt

[Setup]
AppId={{B4R1D4-R3C1P3-M4N4G3R-2024}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\Barida\RecipeManager
DefaultGroupName=Barida
DisableProgramGroupPage=yes
; LicenseFile=..\..\LICENSE
OutputDir=Output
OutputBaseFilename=BaridaRecipeManager-Setup-{#MyAppVersion}
SetupIconFile=Resources\icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
WizardImageFile=compiler:WizModernImage.bmp
WizardSmallImageFile=compiler:WizModernSmallImage.bmp
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
DisableWelcomePage=no
DisableDirPage=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[CustomMessages]
english.InstallingWebView2=Installing Microsoft Edge WebView2 Runtime...
turkish.InstallingWebView2=Microsoft Edge WebView2 Runtime kuruluyor...

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Main application files
Source: "bin\Release\BaridaRecipeManager.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\Release\BaridaRecipeManager.exe.config"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "bin\Release\BaridaRecipeManager.pdb"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "bin\Release\Microsoft.Web.WebView2.Core.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\Release\Microsoft.Web.WebView2.WinForms.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\Release\Microsoft.Web.WebView2.Wpf.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\Release\Newtonsoft.Json.dll"; DestDir: "{app}"; Flags: ignoreversion
; Resources folder with icon
Source: "bin\Release\Resources\*"; DestDir: "{app}\Resources"; Flags: ignoreversion recursesubdirs createallsubdirs
; WebView2 native runtimes
Source: "bin\Release\runtimes\win-x64\native\*"; DestDir: "{app}\runtimes\win-x64\native"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "bin\Release\runtimes\win-x86\native\*"; DestDir: "{app}\runtimes\win-x86\native"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "bin\Release\runtimes\win-arm64\native\*"; DestDir: "{app}\runtimes\win-arm64\native"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
; WebView2 Bootstrapper for runtime installation
Source: "MicrosoftEdgeWebview2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall skipifsourcedoesntexist

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\Resources\icon.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\Resources\icon.ico"; Tasks: desktopicon

[Run]
; Install WebView2 Runtime if not present
Filename: "{tmp}\MicrosoftEdgeWebview2Setup.exe"; Parameters: "/silent /install"; StatusMsg: "{cm:InstallingWebView2}"; Flags: waituntilterminated skipifdoesntexist
; Launch app after install
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Registry]
Root: HKLM; Subkey: "SOFTWARE\Barida\RecipeManager"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\Barida\RecipeManager"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey

[UninstallDelete]
Type: filesandordirs; Name: "{localappdata}\BaridaRecipeManager"

[Code]
function IsWebView2Installed: Boolean;
var
  ResultCode: Integer;
begin
  Result := RegKeyExists(HKLM, 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}') or
            RegKeyExists(HKLM, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}') or
            RegKeyExists(HKCU, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}');
end;

function InitializeSetup: Boolean;
begin
  Result := True;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Post-installation tasks can go here
  end;
end;
