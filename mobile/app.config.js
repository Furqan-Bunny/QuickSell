export default {
  expo: {
    name: "Quicksell",
    slug: "quicksell",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#667eea"
    },
    updates: {
      enabled: false,
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.quicksell.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#667eea"
      },
      package: "com.quicksell.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    // Development settings
    developmentClient: {
      silentLaunch: true
    },
    // Disable all update mechanisms
    runtimeVersion: {
      policy: "nativeVersion"
    },
    // EAS Configuration
    extra: {
      eas: {
        projectId: "164551f1-9453-4990-9b33-b4bea1444d08"
      }
    },
    owner: "furqansaify"
  }
};