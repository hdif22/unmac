#!/usr/bin/env node
// macless setup: run inside YOUR app folder.  node path/to/macless/setup.mjs
// Optional: --stack flutter|expo|swift --bundle-id com.you.app
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; };
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q, v) => v ?? (await rl.question(q)).trim();
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

const stack = (await ask('Stack (flutter / expo / swift): ', arg('stack'))).toLowerCase();
const id = await ask('Bundle ID, like com.yourname.app: ', arg('bundle-id'));
rl.close();
if (!['flutter', 'expo', 'swift'].includes(stack)) bail('Stack must be flutter, expo or swift.');
if (!/^[A-Za-z][\w-]*(\.[A-Za-z][\w-]*)+$/.test(id)) bail('Bundle ID must look like com.yourname.app');

const PERMS = {
  NSCameraUsageDescription: ['camera|cunning_document_scanner|mobile_scanner|expo-camera', 'Why your app needs the camera.'],
  NSPhotoLibraryUsageDescription: ['image_picker|file_picker|photo_manager|expo-image-picker|expo-media-library', 'Why your app needs your photos.'],
  NSFaceIDUsageDescription: ['local_auth|expo-local-authentication', 'Why your app uses Face ID.'],
  NSMicrophoneUsageDescription: ['record|speech_to_text|expo-av', 'Why your app needs the microphone.'],
  NSLocationWhenInUseUsageDescription: ['geolocator|location|expo-location', 'Why your app needs your location.'],
};
const usedPerms = (manifest) =>
  Object.entries(PERMS).filter(([, [re]]) => new RegExp(String.raw`^\s*"?(${re})"?\s*:`, 'm').test(manifest));

function template(file, extra = (s) => s) {
  if (exists('codemagic.yaml')) return console.log('kept your existing codemagic.yaml');
  fs.writeFileSync('codemagic.yaml', extra(read(path.join(here, file)).replaceAll('com.CHANGE.ME', id)));
  console.log('wrote codemagic.yaml');
}

if (stack === 'flutter') {
  need('pubspec.yaml', 'Run this inside a Flutter app folder.');
  const pbx = 'ios/Runner.xcodeproj/project.pbxproj', plist = 'ios/Runner/Info.plist';
  need(pbx, 'No ios/ folder. Run: flutter create --platforms=ios .');
  let p = read(pbx)
    .replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]*?(\.RunnerTests)?;/g, (_, t) => `PRODUCT_BUNDLE_IDENTIFIER = ${id}${t ?? ''};`)
    .replace(/IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);/g, (m, v) => (parseFloat(v) < 15.5 ? 'IPHONEOS_DEPLOYMENT_TARGET = 16.0;' : m));
  fs.writeFileSync(pbx, p);
  let s = read(plist), add = '';
  for (const [key, [, text]] of usedPerms(read('pubspec.yaml')))
    if (!s.includes(key)) { add += `\t<key>${key}</key>\n\t<string>${text}</string>\n`; console.log(`added ${key} (edit the text)`); }
  if (add) { const i = s.lastIndexOf('</dict>'); fs.writeFileSync(plist, s.slice(0, i) + add + s.slice(i)); }
  console.log(`bundle ID set to ${id}, iOS minimum 16.0`);
  template('flutter/codemagic.yaml');
}

if (stack === 'expo') {
  need('package.json', 'Run this inside an Expo app folder.');
  need('app.json', 'No app.json found. If you use app.config.js, copy expo/app.json.snippet by hand.');
  const cfg = JSON.parse(read('app.json')); cfg.expo ??= {};
  cfg.expo.ios = { ...cfg.expo.ios, bundleIdentifier: id };
  const info = (cfg.expo.ios.infoPlist ??= {});
  for (const [key, [, text]] of usedPerms(read('package.json'))) if (!info[key]) { info[key] = text; console.log(`added ${key} (edit the text)`); }
  fs.writeFileSync('app.json', JSON.stringify(cfg, null, 2) + '\n');
  if (!exists('eas.json')) { fs.copyFileSync(path.join(here, 'expo/eas.json'), 'eas.json'); console.log('wrote eas.json'); }
  console.log(`bundle ID set to ${id}`);
}

if (stack === 'swift') {
  const entries = fs.readdirSync('.');
  const ws = entries.find((f) => f.endsWith('.xcworkspace')), pr = entries.find((f) => f.endsWith('.xcodeproj'));
  if (!ws && !pr) bail('No .xcodeproj or .xcworkspace here. Run this in the folder that holds your Xcode project.');
  const proj = ws ?? pr, scheme = proj.replace(/\.(xcworkspace|xcodeproj)$/, '');
  template('swift/codemagic.yaml', (y) => y.replace('CHANGE_ME.xcodeproj', proj).replace('CHANGE_ME"\n        APP', `${scheme}"\n        APP`)
    .replace(/XCODE_PROJECT:/, ws ? 'XCODE_WORKSPACE:' : 'XCODE_PROJECT:')
    .replace('--project "$XCODE_PROJECT"', ws ? '--workspace "$XCODE_WORKSPACE"' : '--project "$XCODE_PROJECT"'));
  console.log('Check the scheme name in codemagic.yaml; I guessed:', scheme);
  console.log('Set the bundle ID to', id, 'in Xcode (target > Signing & Capabilities).');
}

console.log(`
Still yours to do (Apple's web forms, cannot be automated):
  1. Enroll: https://developer.apple.com/programs/enroll   ($99/year)
  2. Create the app + note its numeric Apple ID: https://appstoreconnect.apple.com
  3. Create an API key (role App Manager): App Store Connect > Users and Access > Integrations
  4. ${stack === 'expo' ? 'npx eas-cli login && npx eas-cli build -p ios --profile production' : 'Connect this repo + the key at https://codemagic.io, fill the CHANGE values in codemagic.yaml, then: git tag ios-1.0.0 && git push --tags'}
Full guide: README.md`);

function need(f, msg) { if (!exists(f)) bail(msg); }
function bail(msg) { console.error(msg); process.exit(1); }
