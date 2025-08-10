const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure resolver exists
if (!config.resolver) {
    config.resolver = {};
}

// Add support for path aliases
config.resolver.alias = {
    '@': path.resolve(__dirname),
};

// Ensure the alias is properly configured
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
