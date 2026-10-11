# Flutter on iOS without a Mac

Ship a Flutter app to the App Store from Windows or Linux. The iOS build runs on a free cloud Mac.

## What you still need

| Need | Cost | Why it cannot be skipped |
|---|---|---|
| Apple Developer Program | $99 / year | Apple requires it to sign and publish |
| A Codemagic account | free (500 Mac minutes / month) | the cloud Mac that builds your app |
| A Git repo (GitHub, GitLab, Bitbucket) | free | Codemagic builds from it |
| A real iPhone | not needed to build or publish | only needed to try the app yourself (see "Testing") |

Apple may ask you to verify your identity in the Apple Developer app on an Apple device. Check this before you pay.

## Setup (about 30 minutes)

1. **Enroll** at developer.apple.com/programs/enroll as an individual. Wait for approval.
2. **Fix your project.** In your app folder run:
   `dart run path/to/tool/ios_prep.dart com.yourname.app`
   It sets the bundle ID, raises the iOS minimum to 16, and adds permission texts for common plugins. Edit those texts to say why your app needs each permission.
3. **Create the app** in App Store Connect (appstoreconnect.apple.com > Apps > +). Use the same bundle ID. Copy its numeric **Apple ID** (App > General > App Information).
4. **Create an API key**: App Store Connect > Users and Access > Integrations > App Store Connect API > Team Keys > +, role **App Manager**. Download the `.p8` file once. Note the Key ID and Issuer ID.
5. **Connect Codemagic**: sign up at codemagic.io, add your repo, then Teams > Integrations > App Store Connect > add the key from step 4. Remember the name you give it.
6. **Copy `codemagic.yaml`** next to your `pubspec.yaml` and replace the three `CHANGE` values.
7. **Build**: `git tag ios-1.0.0 && git push --tags`. Codemagic builds, signs and uploads to TestFlight. Allow 15-25 minutes.

## Testing without an iPhone

- Layout and flow: run your app on Windows/Linux/web with the `device_preview` package. It is not real iOS, so plugin behavior can differ.
- Real iOS: install the TestFlight build on any iPhone or iPad (a friend's works).
- Cloud iPhone streams (such as Appetize) can run builds made for the simulator. Not covered here.

## Limits

- Some plugins using CocoaPods cannot be used by tools that build off a Mac. A cloud Mac handles CocoaPods fine, so this kit does not have that limit.
- The free Codemagic plan allows one build at a time and 500 Mac minutes a month. Check codemagic.io/pricing for current numbers.
- This kit is not tested end to end on a store submission yet. Treat steps as a checklist and fix what Apple's errors say.

## Related tool

`xcross` runs debug builds on a real iPhone from Windows/Linux with hot reload. It cannot make release builds or publish.
