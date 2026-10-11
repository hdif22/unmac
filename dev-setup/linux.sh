#!/bin/sh
# macless dev-setup (Linux): everything to run a Flutter app on a real iPhone, no Mac.
# Usage: sh linux.sh [/path/to/Xcode.xip]
set -e
step() { printf '\n== %s\n' "$1"; }

step "1/5 Flutter"
command -v flutter >/dev/null || { echo "Install Flutter first: https://docs.flutter.dev/get-started/install/linux"; exit 1; }

step "2/5 Swift (swiftly)"
if ! command -v swift >/dev/null; then
  curl -fsSL https://swiftlang.github.io/swiftly/swiftly-install.sh | bash
  echo "Open a NEW terminal, then run: swiftly install latest && swift --version   (must be 6.4 or newer). Then run this script again."
  exit 1
fi

step "3/5 xcross (official installer: github.com/arxdeus/xcross)"
command -v xcross >/dev/null || curl -fsSL https://raw.githubusercontent.com/arxdeus/xcross/main/install.sh | sh
command -v xcross >/dev/null || { echo "Open a NEW terminal so xcross is on PATH, then run this script again."; exit 1; }
xcross setup

step "4/5 Xcode download (needs your Apple ID, about 2 GB)"
XIP="${1:-$(ls "$HOME"/Downloads/Xcode*.xip 2>/dev/null | head -n1)}"
[ -f "$XIP" ] || { echo "Download Xcode*.xip from https://xcodereleases.com, then run: sh linux.sh /path/to/Xcode.xip"; exit 1; }

step "5/5 iOS SDK (one time, takes a while; Xcode itself is never run)"
xcross sdk install "$XIP"

printf '\nDone. Plug in an iPhone (iOS 17+), then in your Flutter app folder run:\n  xcross flutter doctor\n  xcross flutter run\n'
