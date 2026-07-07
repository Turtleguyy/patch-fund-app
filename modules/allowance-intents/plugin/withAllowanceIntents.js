const fs = require('fs');
const path = require('path');
const {
  withEntitlementsPlist,
  withXcodeProject,
  withDangerousMod,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const SWIFT_FILES = [
  'SharedDataStore.swift',
  'LogAllowanceIntent.swift',
  'AllowanceShortcuts.swift',
];

function patchAppDelegate(appDelegatePath) {
  if (!fs.existsSync(appDelegatePath)) return;

  let contents = fs.readFileSync(appDelegatePath, 'utf8');
  if (contents.includes('AllowanceShortcuts.updateAppShortcutParameters')) return;

  if (!contents.includes('import AppIntents')) {
    contents = contents.replace('import React', 'import React\nimport AppIntents');
  }

  contents = contents.replace(
    'return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
    `if #available(iOS 17.0, *) {
      AllowanceShortcuts.updateAppShortcutParameters()
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`,
  );

  fs.writeFileSync(appDelegatePath, contents);
}

function withAllowanceIntents(config, props = {}) {
  const appGroup = props.appGroup ?? 'group.com.zach.patchfund';
  const siriDeepLink = props.siriDeepLink ?? 'patchfund://siri/log';

  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [appGroup];
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectName = config.modRequest.projectName;
      const projectRoot = config.modRequest.platformProjectRoot;
      const destDir = path.join(projectRoot, projectName, 'AppIntents');
      const sourceDir = path.join(__dirname, 'swift');

      fs.mkdirSync(destDir, { recursive: true });

      for (const fileName of SWIFT_FILES) {
        const sourcePath = path.join(sourceDir, fileName);
        let contents = fs.readFileSync(sourcePath, 'utf8');
        contents = contents
          .replace(/__APP_GROUP__/g, appGroup)
          .replace(/__SIRI_DEEP_LINK__/g, siriDeepLink);
        fs.writeFileSync(path.join(destDir, fileName), contents);
      }

      patchAppDelegate(path.join(projectRoot, projectName, 'AppDelegate.swift'));

      return config;
    },
  ]);

  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;
    const target = project.getFirstTarget().uuid;
    const groupKey = project.findPBXGroupKey({ name: projectName });

    for (const fileName of SWIFT_FILES) {
      const relativePath = `${projectName}/AppIntents/${fileName}`;
      if (!project.hasFile(relativePath)) {
        project.addSourceFile(relativePath, { target }, groupKey);
      }
    }

    return config;
  });

  return config;
}

module.exports = createRunOncePlugin(withAllowanceIntents, 'withAllowanceIntents', '1.1.0');
