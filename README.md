# unmac

Ship iOS apps without a Mac. Build an iPhone app from Windows or Linux on a cloud Mac you do not own or pay for. Make a release for free, or publish to the App Store with Apple's $99 account.

## Pick your stack

| You use | Cloud builder | Start here |
|---|---|---|
| Flutter | Codemagic (free: 500 Mac minutes / month) | [Flutter](#flutter) |
| React Native with Expo | Expo EAS (free: 15 iOS builds / month) | [Expo](#react-native-expo) |
| Swift / Xcode project | Codemagic | [Swift](#swift-native) |
| Android only (Kotlin/Java) | none | [Android only](#android-only) |

Check current limits before you rely on them: codemagic.io/pricing and expo.dev/pricing.

## Free release, no $99 (Flutter)

No Apple Developer account, no Mac, no iPhone. GitHub's free macOS runners build it.

1. In your app folder run `node path/to/unmac/setup.mjs` (needs Node.js). Pick `flutter`, then `free`. It fixes the iOS settings and writes `.github/workflows/free-release.yml` with your app name, bundle ID, name and icon filled in. Push the app to a **public** GitHub repo (free macOS builds).
2. `git tag v1.0.0 && git push --tags`. The GitHub Release gets three files:
   - `app.ipa`: unsigned release build.
   - `app-simulator.zip`: debug build for the iOS Simulator.
   - `source.json`: an AltStore / SideStore source.
3. **See it without an iPhone:** upload `app-simulator.zip` to appetize.io and it runs in the browser. The free plan is small (third-party lists say about 30 minutes a month), and Flutter runs only debug mode on the simulator.
4. **Install it on an iPhone:** users install `app.ipa` with Sideloadly, AltStore or SideStore. These sign it with their own free Apple ID. A free Apple ID's apps expire after 7 days and must be refreshed. Or users add `https://github.com/OWNER/REPO/releases/latest/download/source.json` as a source in AltStore / SideStore to get updates.

Not possible without the $99: the App Store, TestFlight, and apps that never expire.

## Paid route: App Store and TestFlight

## What you still need (every stack)

| Need | Cost |
|---|---|
| Apple Developer Program | $99 / year (Apple requires it to sign and publish) |
| A cloud builder account (above) | free tier |
| A real iPhone | not needed to build or publish. Only to try the app yourself. |

Apple may ask you to verify your identity in the Apple Developer app on an Apple device. Check this before you pay.

## Shared Apple steps (do once)

1. **Enroll** at developer.apple.com/programs/enroll as an individual. Wait for approval.
2. **Create the app** in App Store Connect (appstoreconnect.apple.com > Apps > +). Pick a bundle ID like `com.yourname.app`. Copy the numeric **Apple ID** (App > General > App Information).
3. **Create an API key** (Codemagic paths): App Store Connect > Users and Access > Integrations > App Store Connect API > Team Keys > +, role **App Manager**. Download the `.p8` file once. Note the Key ID and Issuer ID. The first time, the account holder may have to click "Request Access" there.

## Flutter

1. In your app folder run `node path/to/unmac/setup.mjs` (needs Node.js) and pick `flutter`. It sets the bundle ID, raises the iOS minimum to 16, adds permission texts for common plugins and writes `codemagic.yaml`. Edit the texts to say why your app needs each permission.
2. Connect your repo at codemagic.io. Teams > Integrations > App Store Connect > add the key. Remember its name.
3. Fill the remaining `CHANGE` values in `codemagic.yaml` (integration name, Apple ID).
4. `git tag ios-1.0.0 && git push --tags`. Allow 15-25 minutes. The build lands in TestFlight.

## React Native (Expo)

Works for Expo projects. A bare React Native app with custom native code is harder and is not covered.

1. In your app folder run `node path/to/unmac/setup.mjs` and pick `expo`. It sets the bundle ID and permission texts in `app.json` and adds `eas.json`. If you use `app.config.js`, merge `expo/app.json.snippet` by hand.
2. Put your numeric Apple ID into `eas.json` (`ascAppId`) and run `npx eas-cli login`.
3. `npx eas-cli build -p ios --profile production`. EAS asks for your Apple login once and creates the signing for you.
4. `npx eas-cli submit -p ios --profile production` uploads it to App Store Connect / TestFlight.

## Swift (native)

1. In the folder with your Xcode project run `node path/to/unmac/setup.mjs` and pick `swift`. It finds your project or workspace and writes `codemagic.yaml`. Check the scheme name it guessed.
2. Set the bundle ID in Xcode (target > Signing & Capabilities). Connect your repo at codemagic.io and add the API key as in Flutter step 2.
3. Fill the remaining `CHANGE` values, then push a tag like `ios-1.0.0`.

Writing Swift on Windows or Linux: `xtool` (github.com/xtool-org/xtool) builds apps that are Swift packages (`Package.swift`), not `.xcodeproj` projects. On Windows it runs inside WSL. Like `dev-setup` below, it extracts Apple's SDK from `Xcode.xip`, so the same license warning applies. Release builds still go through the cloud Mac.

## Optional: run on your iPhone while developing (Flutter) - read the warning first

> **Warning.** This part extracts Apple's iOS SDK from `Xcode.xip` and uses it on a non-Apple computer. Apple's Xcode license (sections 2.5 and 2.7) says Apple software may only run on Apple-branded hardware and the SDKs may not be used separately. Whether this is enforced against individuals is unclear, and this is not legal advice. The cloud-build route above does not have this problem. Use `dev-setup` only if you accept the risk.

Release builds always go through the cloud Mac above. For the daily loop (edit, hot reload, debug on a real iPhone) there is `dev-setup`, built on [xcross](https://github.com/arxdeus/xcross).

1. Windows: `powershell -ExecutionPolicy Bypass -File dev-setup/windows.ps1`. Linux: `sh dev-setup/linux.sh` (untested).
2. It installs xcross, Swift, LLVM and the Python tools. It stops once to ask you to download `Xcode.xip` from xcodereleases.com (Apple ID, about 2 GB), then extracts the iOS SDK from it. Xcode itself never runs.
3. Windows also needs Apple's iTunes and iCloud installed from apple.com (not the Microsoft Store) so USB works. The script checks this.
4. Plug in an iPhone with iOS 17 or newer, then in your app: `xcross flutter doctor` and `xcross flutter run`.

Needs a real iPhone, debug builds only, no CocoaPods-only plugins. A free Apple ID gives apps that expire after 7 days and allows about 3 apps at a time. No WSL is needed on Windows.

## Android only

If your app is Kotlin or Java, there is nothing to build for iOS. You would need a cross-platform route first: Flutter, React Native or Kotlin Multiplatform. This kit covers the first two.

## Testing without an iPhone

- Layout and flow: Flutter has the `device_preview` package. It is not real iOS, so plugin behavior can differ.
- Real iOS: install the TestFlight build on any iPhone or iPad. A friend's works.
- Cloud iPhone streams (such as Appetize) run simulator builds. Not covered here.

## Honest limits

- The cloud build steps have not been tested end to end against a store submission. Treat them as a checklist and follow what Apple's errors say.
- Free plans have limits: one build at a time and monthly caps. They change, so check the pricing pages.
- `xcross` (github.com/arxdeus/xcross) runs Flutter debug builds on a real iPhone from Windows or Linux. It cannot make release builds or publish, and it skips plugins that need CocoaPods. This kit does not use it.
