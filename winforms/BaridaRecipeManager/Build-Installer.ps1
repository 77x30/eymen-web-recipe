# Barida Recipe Manager - Installer Builder
# Run this script in PowerShell to compile the installer

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   Barida Recipe Manager - Installer Builder" -ForegroundColor Cyan  
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Check for Inno Setup
$isccPaths = @(
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
)

$isccPath = $isccPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $isccPath) {
    Write-Host "ERROR: Inno Setup not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Inno Setup 6 from:" -ForegroundColor Yellow
    Write-Host "https://jrsoftware.org/isdl.php" -ForegroundColor Blue
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Found Inno Setup at: $isccPath" -ForegroundColor Green
Write-Host ""
Write-Host "Compiling installer..." -ForegroundColor Yellow
Write-Host ""

# Run ISCC
$process = Start-Process -FilePath $isccPath -ArgumentList "setup.iss" -Wait -PassThru -NoNewWindow
$exitCode = $process.ExitCode

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host "   BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "   Installer created in: Output\" -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Green
    
    # List the output
    Get-ChildItem "Output\*.exe" | ForEach-Object {
        Write-Host "   -> $($_.Name) ($([math]::Round($_.Length/1MB, 2)) MB)" -ForegroundColor Cyan
    }
} else {
    Write-Host "======================================================" -ForegroundColor Red
    Write-Host "   BUILD FAILED! Exit code: $exitCode" -ForegroundColor Red
    Write-Host "======================================================" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
