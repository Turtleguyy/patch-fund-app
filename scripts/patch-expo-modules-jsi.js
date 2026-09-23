/**
 * Xcode 26+/27 Swift rejects forming a C function pointer from a ternary
 * (`set == nil ? nil : setter`) in expo-modules-jsi. Upstream workaround:
 * https://github.com/expo/expo/issues/46876
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI/Runtime/JavaScriptRuntime.swift',
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const original = fs.readFileSync(target, 'utf8');
const needle =
  '    let callbacks = expo.HostObjectCallbacks(\n' +
  '      context, getter, set == nil ? nil : setter, propertyNamesGetter, deallocate)';

const replacement =
  '    // Fix: C function pointers cannot be formed from a conditional expression (Xcode 26+/27).\n' +
  '    let callbacks = set == nil\n' +
  '      ? expo.HostObjectCallbacks(context, getter, nil, propertyNamesGetter, deallocate)\n' +
  '      : expo.HostObjectCallbacks(context, getter, setter, propertyNamesGetter, deallocate)';

if (original.includes('let callbacks = set == nil')) {
  console.log('expo-modules-jsi: Xcode HostObjectCallbacks patch already applied');
  process.exit(0);
}

if (!original.includes(needle)) {
  console.warn(
    'expo-modules-jsi: expected HostObjectCallbacks ternary not found; skip patch (package may have fixed upstream)',
  );
  process.exit(0);
}

fs.writeFileSync(target, original.replace(needle, replacement));
console.log('expo-modules-jsi: applied Xcode HostObjectCallbacks patch');
