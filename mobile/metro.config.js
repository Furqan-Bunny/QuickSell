const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Firebase and other modules
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;