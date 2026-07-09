const { withPodfile } = require('@expo/config-plugins');

const PODFILE_MARKER = '# @react-native-google-signin/google-signin modular headers';

const GOOGLE_POD_SNIPPET = `
  ${PODFILE_MARKER}
  pod 'GoogleUtilities', :modular_headers => true
  pod 'RecaptchaInterop', :modular_headers => true
`;

function withGoogleSignInPods(config) {
  return withPodfile(config, (podfile) => {
    if (podfile.modResults.contents.includes(PODFILE_MARKER)) {
      return podfile;
    }

    podfile.modResults.contents = podfile.modResults.contents.replace(
      /config = use_native_modules!\(config_command\)\n/,
      `config = use_native_modules!(config_command)\n${GOOGLE_POD_SNIPPET}\n`,
    );

    return podfile;
  });
}

module.exports = withGoogleSignInPods;
