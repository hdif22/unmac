// Fixes the usual first-time iOS blockers in a Flutter project.
// Run from your app folder:  dart run path/to/ios_prep.dart com.yourname.app
import 'dart:io';

const plugins = {
  'NSCameraUsageDescription': (['camera', 'cunning_document_scanner', 'mobile_scanner'], 'This app uses the camera.'),
  'NSPhotoLibraryUsageDescription': (['image_picker', 'file_picker', 'photo_manager'], 'This app reads photos you choose.'),
  'NSFaceIDUsageDescription': (['local_auth'], 'This app unlocks with Face ID.'),
  'NSMicrophoneUsageDescription': (['record', 'speech_to_text'], 'This app uses the microphone.'),
  'NSLocationWhenInUseUsageDescription': (['geolocator', 'location'], 'This app uses your location.'),
};

void main(List<String> args) {
  if (args.isEmpty || !args.first.contains('.')) {
    stderr.writeln('Usage: dart run ios_prep.dart com.yourname.app');
    exit(64);
  }
  final id = args.first;
  final pbx = File('ios/Runner.xcodeproj/project.pbxproj');
  final plist = File('ios/Runner/Info.plist');
  final pub = File('pubspec.yaml');
  if (!pbx.existsSync() || !plist.existsSync() || !pub.existsSync()) {
    stderr.writeln('Run this inside a Flutter app folder (needs ios/ and pubspec.yaml).');
    exit(66);
  }

  var p = pbx.readAsStringSync();
  p = p.replaceAllMapped(RegExp(r'PRODUCT_BUNDLE_IDENTIFIER = [^;]*?(\.RunnerTests)?;'),
      (m) => 'PRODUCT_BUNDLE_IDENTIFIER = $id${m[1] ?? ''};');
  p = p.replaceAllMapped(RegExp(r'IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);'), (m) {
    final v = double.tryParse(m[1]!) ?? 0;
    return 'IPHONEOS_DEPLOYMENT_TARGET = ${v < 15.5 ? '16.0' : m[1]};';
  });
  pbx.writeAsStringSync(p);
  print('bundle id -> $id, iOS target >= 16.0 (safe for ML Kit and most plugins)');

  final deps = pub.readAsStringSync();
  var s = plist.readAsStringSync();
  var add = '';
  plugins.forEach((key, v) {
    final used = v.$1.any((n) => RegExp(r'^\s+' + n + ':', multiLine: true).hasMatch(deps));
    if (used && !s.contains(key)) {
      add += '\t<key>$key</key>\n\t<string>${v.$2}</string>\n';
      print('added $key (edit the text to say why YOUR app needs it)');
    }
  });
  if (add.isNotEmpty) {
    final i = s.lastIndexOf('</dict>');
    plist.writeAsStringSync(s.substring(0, i) + add + s.substring(i));
  }
  print('Done. Next: copy codemagic.yaml next to pubspec.yaml and fill the CHANGE values.');
}
