# macless dev-setup (Windows): everything to run a Flutter app on a real iPhone, no Mac.
# Usage:  powershell -ExecutionPolicy Bypass -File windows.ps1 [-Xip C:\path\Xcode.xip]
param([string]$Xip)
$ErrorActionPreference = 'Stop'
function Step($m) { Write-Host "`n== $m" -ForegroundColor Cyan }

Write-Host 'WARNING: this extracts Apple''s iOS SDK and uses it on a non-Apple computer. Apple''s Xcode license (sections 2.5 and 2.7) allows Apple software only on Apple-branded hardware. Not legal advice. Cloud builds (see README) do not have this problem.' -ForegroundColor Yellow
if ((Read-Host 'Type YES to continue') -ne 'YES') { exit 0 }

Step '0/5 Apple USB drivers'
if (-not (Get-Service 'Apple Mobile Device Service' -ErrorAction SilentlyContinue)) {
  Write-Host 'Install iTunes and iCloud from apple.com (NOT the Microsoft Store), then run this script again. No sign-in needed.' -ForegroundColor Yellow
  exit 1
}

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

Step '4/5 Xcode download (needs your Apple ID, about 2 GB)'
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
