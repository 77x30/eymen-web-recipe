# Barida Recipe Manager - Installer Guide

## Building the Installer

### Prerequisites
1. **Inno Setup 6** - Download from https://jrsoftware.org/isdl.php
2. **Built Application** - Run `MSBuild` or build from Visual Studio in Release mode

### Steps

1. **Build the Application**
   ```cmd
   cd winforms\BaridaRecipeManager
   "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe" BaridaRecipeManager.csproj /p:Configuration=Release /t:Rebuild
   ```

2. **Build the Installer**
   - Double-click `build-installer.bat` 
   - OR run: `"%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe" setup.iss`

3. **Output**
   - Installer will be created in `Output\BaridaRecipeManager-Setup-1.0.0.exe`

### Code Signing (Optional but Recommended)

To remove "Unknown Publisher" warning, you need a code signing certificate:

1. **Get a Certificate**
   - Purchase from DigiCert, Sectigo, GlobalSign, etc. (~$200-400/year)
   - Or use Azure SignTool with Azure Key Vault
   
2. **Sign the Installer**
   ```cmd
   signtool sign /a /tr http://timestamp.digicert.com /td sha256 /fd sha256 "Output\BaridaRecipeManager-Setup-1.0.0.exe"
   ```

3. **Sign the Application (before building installer)**
   ```cmd
   signtool sign /a /tr http://timestamp.digicert.com /td sha256 /fd sha256 "bin\Release\BaridaRecipeManager.exe"
   ```

### Files Included in Installer

- BaridaRecipeManager.exe (Main application)
- Microsoft.Web.WebView2.*.dll (WebView2 runtime)
- Newtonsoft.Json.dll (JSON library)
- WebView2 native runtimes
- Microsoft Edge WebView2 bootstrapper (auto-installs if needed)

### Version Update

To update version number:
1. Edit `setup.iss` - Change `#define MyAppVersion "1.0.0"`
2. Edit `Program.cs` - Change `APP_VERSION = "1.0.0"`
3. Rebuild application and installer
