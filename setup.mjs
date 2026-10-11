#!/usr/bin/env node
// unmac setup: run inside YOUR app folder.  node path/to/unmac/setup.mjs
// Optional: --stack flutter|expo|swift --bundle-id com.you.app --route free|store --app-name X --developer Y
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; };
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const lines = rl[Symbol.asyncIterator]();
const ask = async (q, v) => {
  if (v !== undefined) return v;
  process.stdout.write(q);
  return ((await lines.next()).value ?? '').trim();
};
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

const git = (c) => { try { return execSync(`git ${c}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };

const stack = (await ask('Stack (flutter / expo / swift): ', arg('stack'))).toLowerCase();
if (!['flutter', 'expo', 'swift'].includes(stack)) bail('Stack must be flutter, expo or swift.');
const id = await ask('Bundle ID, like com.yourname.app: ', arg('bundle-id'));
if (!/^[A-Za-z][\w-]*(\.[A-Za-z][\w-]*)+$/.test(id)) bail('Bundle ID must look like com.yourname.app');
// Flutter only: free release on GitHub (no $99) or App Store / TestFlight via Codemagic ($99).
const route = stack !== 'flutter' ? 'store'
  : ((await ask('Release: free (GitHub, no $99) or store (App Store, $99) [free]: ', arg('route'))) || 'free').toLowerCase();
if (!['free', 'store'].includes(route)) bail('Release must be free or store.');
let appName, dev;
if (route === 'free') {
  const pub = exists('pubspec.yaml') ? (read('pubspec.yaml').match(/^name:\s*(\S+)/m) ?? [])[1] : '';
  appName = (await ask(`App name [${pub}]: `, arg('app-name'))) || pub;
  const me = git('config user.name');
  dev = (await ask(`Your name [${me}]: `, arg('developer'))) || me;
}
rl.close();

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
  let p = read(pbx);
  // Main app ID = the shortest one; tests and extensions start with it and keep their suffix.
  const old = [...p.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = "?([^;"]+)"?;/g)].map((m) => m[1]).sort((a, b) => a.length - b.length)[0];
  if (old) p = p.replaceAll(`PRODUCT_BUNDLE_IDENTIFIER = ${old}`, `PRODUCT_BUNDLE_IDENTIFIER = ${id}`);
  p = p
    .replace(/IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);/g, (m, v) => (parseFloat(v) < 15.5 ? 'IPHONEOS_DEPLOYMENT_TARGET = 16.0;' : m));
  fs.writeFileSync(pbx, p);
  let s = read(plist), add = '';
  for (const [key, [, text]] of usedPerms(read('pubspec.yaml')))
    if (!s.includes(key)) { add += `\t<key>${key}</key>\n\t<string>${text}</string>\n`; console.log(`added ${key} (edit the text)`); }
  if (add) { const i = s.lastIndexOf('</dict>'); fs.writeFileSync(plist, s.slice(0, i) + add + s.slice(i)); }
  console.log(`bundle ID set to ${id}, iOS minimum 16.0`);
  if (route === 'store') template('flutter/codemagic.yaml');
  else freeRelease();
}

function freeRelease() {
  const out = '.github/workflows/free-release.yml';
  if (exists(out)) return console.log(`kept your existing ${out}`);
  // owner/repo from the GitHub remote, for the icon link
  const repo = (git('remote get-url origin').match(/github\.com[:/](.+?)(\.git)?$/) ?? [])[1];
  const icon = 'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png';
  const iconUrl = repo && exists(icon) ? `https://raw.githubusercontent.com/${repo}/HEAD/${icon}` : '';
  const fill = (k, v) => (y) => (v ? y.replace(new RegExp(`(${k}: )".*"`), `$1${JSON.stringify(v)}`) : y);
  let y = read(path.join(here, 'flutter/free-release.yml'));
  for (const f of [fill('APP_NAME', appName), fill('BUNDLE_ID', id), fill('DEVELOPER', dev), fill('ICON_URL', iconUrl)]) y = f(y);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, y);
  console.log(`wrote ${out}`);
  if (y.includes('CHANGE_ME')) console.log('Fill the CHANGE_ME values left in it (no GitHub remote or app icon found).');
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
  template('swift/codemagic.yaml', (y) => y.replace('CHANGE_ME.xcodeproj', proj).replace('XCODE_SCHEME: "CHANGE_ME"', `XCODE_SCHEME: "${scheme}"`)
    .replace(/XCODE_PROJECT:/, ws ? 'XCODE_WORKSPACE:' : 'XCODE_PROJECT:')
    .replace('--project "$XCODE_PROJECT"', ws ? '--workspace "$XCODE_WORKSPACE"' : '--project "$XCODE_PROJECT"'));
  console.log('Check the scheme name in codemagic.yaml; I guessed:', scheme);
  console.log('Set the bundle ID to', id, 'in Xcode (target > Signing & Capabilities).');
}

if (route === 'free') {
  console.log(`
Next (free, no Apple account):
  1. Commit and push to a PUBLIC GitHub repo (free macOS builds).
  2. git tag v1.0.0 && git push --tags
  3. Open the repo's Releases page: app.ipa (sideload), app-simulator.zip (appetize.io), source.json (AltStore/SideStore).
Full guide: README.md`);
  process.exit(0);
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
