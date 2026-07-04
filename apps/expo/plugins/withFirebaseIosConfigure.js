const { withAppDelegate } = require('@expo/config-plugins');

/** Inject FirebaseApp.configure() for Expo 57 Swift AppDelegate (RN Firebase plugin skips it). */
function withFirebaseIosConfigure(config) {
  return withAppDelegate(config, (config) => {
    const { modResults } = config;
    if (modResults.language !== 'swift') {
      return config;
    }

    if (!modResults.contents.includes('import FirebaseCore')) {
      modResults.contents = modResults.contents.replace(
        /import ReactAppDependencyProvider\n/,
        'import ReactAppDependencyProvider\nimport FirebaseCore\n'
      );
    }

    if (!modResults.contents.includes('FirebaseApp.configure()')) {
      modResults.contents = modResults.contents.replace(
        /factory\.startReactNative\(/,
        'FirebaseApp.configure()\n    factory.startReactNative('
      );
    }

    return config;
  });
}

module.exports = withFirebaseIosConfigure;
