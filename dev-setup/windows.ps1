# macless dev-setup (Windows): everything to run a Flutter app on a real iPhone, no Mac.
# Usage:  powershell -ExecutionPolicy Bypass -File windows.ps1 [-Xip C:\path\Xcode.xip]
param([string]$Xip)
$ErrorActionPreference = 'Stop'
function Step($m) { Write-Host "`n== $m" -ForegroundColor Cyan }

Step '1/5 Flutter'
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  Write-Host 'Flutter not found. Install it first: https://docs.flutter.dev/get-started/install/windows' -ForegroundColor Yellow
  exit 1
}

Step '2/5 xcross (official installer: github.com/arxdeus/xcross)'
if (-not (Get-Command xcross -ErrorAction SilentlyContinue)) {
  Invoke-RestMethod https://raw.githubusercontent.com/arxdeus/xcross/main/install.ps1 | Invoke-Expression
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')
}
if (-not (Get-Command xcross -ErrorAction SilentlyContinue)) {
  Write-Host 'xcross installed but not on PATH yet. Open a NEW terminal and run this script again.' -ForegroundColor Yellow
  exit 1
}

Step '3/5 Swift, LLVM, Python tools (xcross asks before each package)'
xcross setup

Step '4/5 Xcode download (needs your Apple ID, about 3 GB)'
if (-not $Xip) { $Xip = (Get-ChildItem "$env:USERPROFILE\Downloads\Xcode*.xip" -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }
if (-not $Xip -or -not (Test-Path $Xip)) {
  Write-Host 'Download Xcode*.xip from https://xcodereleases.com (sign in with your Apple ID).' -ForegroundColor Yellow
  Write-Host 'Then run this script again. It finds the file in Downloads, or pass -Xip C:\path\Xcode.xip'
  exit 1
}
Write-Host "Using $Xip"

Step '5/5 iOS SDK (one time, takes a while; Xcode itself is never run)'
xcross sdk install $Xip

Write-Host "`nDone. Plug in an iPhone (iOS 17+), then in your Flutter app folder run:" -ForegroundColor Green
Write-Host '  xcross flutter doctor'
Write-Host '  xcross flutter run'
