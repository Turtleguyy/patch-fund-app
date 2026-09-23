const {
  withAppDelegate,
  withInfoPlist,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const MARKER = '// withIosSceneLifecycle: scene-based window bootstrap';

const SCENE_DELEGATE_SWIFT = `
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory
    else { return }

    let window = UIWindow(windowScene: windowScene)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptions)
    // Expo modules / RN internals resolve the window via the app delegate.
    appDelegate.window = window
    self.window = window

    for context in connectionOptions.urlContexts {
      _ = RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
    for activity in connectionOptions.userActivities {
      _ = RCTLinkingManager.application(
        UIApplication.shared, continue: activity, restorationHandler: { _ in })
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      _ = RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = RCTLinkingManager.application(
      UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }
}
`;

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return config;
  });
}

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes(MARKER)) {
      return config;
    }

    if (!contents.includes('var reactNativeFactory: RCTReactNativeFactory?')) {
      throw new Error(
        'withIosSceneLifecycle: unexpected AppDelegate.swift — missing reactNativeFactory property',
      );
    }

    contents = contents.replace(
      '  var reactNativeFactory: RCTReactNativeFactory?\n',
      '  var reactNativeFactory: RCTReactNativeFactory?\n  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?\n',
    );

    const windowBootstrap = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif`;

    if (!contents.includes(windowBootstrap)) {
      throw new Error(
        'withIosSceneLifecycle: could not find AppDelegate window bootstrap block to relocate',
      );
    }

    contents = contents.replace(
      windowBootstrap,
      `${MARKER}
    self.launchOptions = launchOptions
    // Window creation moved to SceneDelegate (required by the iOS 27 SDK).`,
    );

    // Ensure launchOptions is assigned even if the replace already includes it once.
    if (!contents.includes('self.launchOptions = launchOptions')) {
      contents = contents.replace(
        'reactNativeFactory = factory\n',
        'reactNativeFactory = factory\n    self.launchOptions = launchOptions\n',
      );
    }

    if (!contents.includes('class SceneDelegate:')) {
      contents = contents.replace(
        /\nclass ReactNativeDelegate:/,
        `\n${SCENE_DELEGATE_SWIFT}\nclass ReactNativeDelegate:`,
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

function withIosSceneLifecycle(config) {
  config = withSceneManifest(config);
  config = withSceneAppDelegate(config);
  return config;
}

module.exports = createRunOncePlugin(withIosSceneLifecycle, 'withIosSceneLifecycle', '1.0.0');
