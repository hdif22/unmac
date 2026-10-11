# macless

Ship iOS apps without a Mac. Build and publish an iPhone app from Windows or Linux. The iOS build runs on a cloud Mac that you do not own or pay for.

## Pick your stack

| You use | Cloud builder | Start here |
|---|---|---|
| Flutter | Codemagic (free: 500 Mac minutes / month) | [Flutter](#flutter) |
| React Native with Expo | Expo EAS (free: 15 iOS builds / month) | [Expo](#react-native-expo) |
| Swift / Xcode project | Codemagic | [Swift](#swift-native) |
| Android only (Kotlin/Java) | none | [Android only](#android-only) |

Check current limits before you rely on them: codemagic.io/pricing and expo.dev/pricing.

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
3. **Create an API key** (Codemagic paths): App Store Connect > Users and Access > Integrations > App Store Connect API > Team Keys > +, role **App Manager**. Download the `.p8` file once. Note the Key ID and Issuer ID.

## Flutter

1. Connect your repo at codemagic.io. Teams > Integrations > App Store Connect > add the key. Remember its name.
2. In your app folder run `dart run path/to/flutter/tool/ios_prep.dart com.yourname.app`. It sets the bundle ID, raises the iOS minimum to 16 and adds permission texts for common plugins. Edit the texts to say why your app needs each one.
3. Copy `flutter/codemagic.yaml` next to your `pubspec.yaml` and replace the `CHANGE` values.
4. `git tag ios-1.0.0 && git push --tags`. Allow 15-25 minutes. The build lands in TestFlight.

## React Native (Expo)

Works for Expo projects. A bare React Native app with custom native code is harder and is not covered.

1. In your app: `npx eas-cli login`, then `npx eas-cli build:configure`.
2. Merge `expo/app.json.snippet` into your `app.json` and replace `expo/eas.json` values (`ascAppId`).
3. `npx eas-cli build -p ios --profile production`. EAS asks for your Apple login once and creates the signing for you.
4. `npx eas-cli submit -p ios --profile production` uploads it to App Store Connect / TestFlight.

## Swift (native)

1. Connect your repo at codemagic.io and add the API key as in Flutter step 1.
2. Copy `swift/codemagic.yaml` into your repo root and replace the `CHANGE` values (project or workspace name, scheme).
3. Push a tag like `ios-1.0.0`.

Writing Swift on Windows or Linux: `xtool` (github.com/xtool-org/xtool) builds pure Swift Package apps there. Projects that need Xcode features (storyboards, asset catalogs, many frameworks) are limited. Plan on cloud builds for anything bigger.

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
