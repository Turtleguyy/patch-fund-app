const { withPodfile } = require('@expo/config-plugins');

const MARKER = '# bump pod deployment targets for current Xcode';

/**
 * Newer Xcode only allows IPHONEOS_DEPLOYMENT_TARGET >= 15.0.
 * Some third-party pods still declare 9–13 and fail the build.
 */
function withIosMinDeploymentTarget(config, { minVersion = '15.0' } = {}) {
  return withPodfile(config, (podfile) => {
    if (podfile.modResults.contents.includes(MARKER)) {
      return podfile;
    }

    const snippet = `
    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current_target = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current_target.nil? || Gem::Version.new(current_target.to_s) < Gem::Version.new('${minVersion}')
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${minVersion}'
        end
      end
    end
`;

    const contents = podfile.modResults.contents;
    const anchor = 'react_native_post_install(\n      installer,\n      config[:reactNativePath],\n      :mac_catalyst_enabled => false,\n      :ccache_enabled => ccache_enabled?(podfile_properties),\n    )';

    if (!contents.includes(anchor)) {
      throw new Error(
        'withIosMinDeploymentTarget: could not find react_native_post_install block in Podfile',
      );
    }

    podfile.modResults.contents = contents.replace(anchor, `${anchor}\n${snippet}`);
    return podfile;
  });
}

module.exports = withIosMinDeploymentTarget;
