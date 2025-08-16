#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Version configuration file paths
const VERSION_TEMPLATE_PATH = path.join(process.cwd(), 'version-config.template.json');
const VERSION_CONFIG_PATH = path.join(process.cwd(), 'version-config.json');
const VERSION_LOCAL_PATH = path.join(process.cwd(), 'version-config.local.json');

// Default version configuration
const DEFAULT_VERSION_CONFIG = {
  development: {
    version: "1.0.8",
    androidVersionCode: 43,
    iosBuildNumber: 43,
    autoIncrement: true
  },
  staging: {
    version: "1.0.8",
    androidVersionCode: 43,
    iosBuildNumber: 43,
    autoIncrement: true
  },
  production: {
    version: "1.0.9",
    androidVersionCode: 15,
    iosBuildNumber: 43,
    autoIncrement: false
  },
  "production_apk": {
    version: "1.0.8",
    androidVersionCode: 15,
    iosBuildNumber: 43,
    autoIncrement: false
  }
};

class VersionManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    // Try to load local config first, then template, then defaults
    try {
      if (fs.existsSync(VERSION_LOCAL_PATH)) {
        console.log('📁 Using local version configuration');
        return JSON.parse(fs.readFileSync(VERSION_LOCAL_PATH, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load local version config');
    }

    try {
      if (fs.existsSync(VERSION_CONFIG_PATH)) {
        console.log('📁 Using version configuration');
        return JSON.parse(fs.readFileSync(VERSION_CONFIG_PATH, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load version config');
    }

    try {
      if (fs.existsSync(VERSION_TEMPLATE_PATH)) {
        console.log('📁 Using version template');
        return JSON.parse(fs.readFileSync(VERSION_TEMPLATE_PATH, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load version template');
    }

    console.log('📁 Using default version configuration');
    return DEFAULT_VERSION_CONFIG;
  }

  saveConfig() {
    try {
      // Always save to local config (gitignored)
      fs.writeFileSync(VERSION_LOCAL_PATH, JSON.stringify(this.config, null, 2));
      console.log('✅ Version configuration saved to version-config.local.json');
    } catch (error) {
      console.error('❌ Failed to save version configuration:', error.message);
    }
  }

  getVersionInfo(environment) {
    const envConfig = this.config[environment];
    if (!envConfig) {
      throw new Error(`Unknown environment: ${environment}`);
    }
    return { ...envConfig };
  }

  incrementVersion(environment, platform = 'all', type = 'build') {
    const envConfig = this.config[environment];
    if (!envConfig) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    if (!envConfig.autoIncrement) {
      console.log(`⚠️  Auto-increment disabled for ${environment} environment`);
      return envConfig;
    }

    // Handle semantic version increments (patch, minor, major)
    if (type === 'patch' || type === 'minor' || type === 'major') {
      envConfig.version = this.incrementSemver(envConfig.version, type);
      console.log(`✅ Incremented ${type} version for ${environment}: ${envConfig.version}`);
      return envConfig;
    }

    // Handle platform-specific build increments
    if (platform === 'android') {
      envConfig.androidVersionCode++;
      console.log(`✅ Incremented Android version code for ${environment}: ${envConfig.androidVersionCode}`);
    } else if (platform === 'ios') {
      envConfig.iosBuildNumber++;
      console.log(`✅ Incremented iOS build number for ${environment}: ${envConfig.iosBuildNumber}`);
    } else if (platform === 'all') {
      // Default behavior: increment both
      envConfig.androidVersionCode++;
      envConfig.iosBuildNumber++;
      console.log(`✅ Incremented both platforms for ${environment}: Android ${envConfig.androidVersionCode}, iOS ${envConfig.iosBuildNumber}`);
    } else {
      throw new Error(`Invalid platform: ${platform}. Use 'android', 'ios', or 'all'`);
    }

    return envConfig;
  }

  incrementSemver(version, type) {
    const parts = version.split('.').map(Number);
    switch (type) {
      case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
      case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
      case 'patch':
        parts[2]++;
        break;
    }
    return parts.join('.');
  }

  updateAppConfig(environment) {
    const versionInfo = this.getVersionInfo(environment);

    // Update app.config.js with version info
    const appConfigPath = path.join(process.cwd(), 'app.config.js');
    let appConfigContent = fs.readFileSync(appConfigPath, 'utf8');

    // Replace version placeholders
    appConfigContent = appConfigContent.replace(
      /version:\s*"[^"]*"/,
      `version: "${versionInfo.version}"`
    );

    // Replace build number placeholders
    appConfigContent = appConfigContent.replace(
      /buildNumber:\s*"[^"]*"/,
      `buildNumber: "${versionInfo.iosBuildNumber}"`
    );

    // Replace version code placeholders
    appConfigContent = appConfigContent.replace(
      /versionCode:\s*\d+/,
      `versionCode: ${versionInfo.androidVersionCode}`
    );

    fs.writeFileSync(appConfigPath, appConfigContent);
    console.log(`✅ Updated app.config.js with ${environment} version info`);
  }

  showStatus() {
    console.log('\n📱 Version Status for All Environments:\n');
    Object.entries(this.config).forEach(([env, config]) => {
      console.log(`${env.toUpperCase()}:`);
      console.log(`  Version: ${config.version}`);
      console.log(`  Android Version Code: ${config.androidVersionCode}`);
      console.log(`  iOS Build Number: ${config.iosBuildNumber}`);
      console.log(`  Auto-increment: ${config.autoIncrement ? '✅' : '❌'}`);
      console.log('');
    });

    console.log('📁 Configuration Source:');
    if (fs.existsSync(VERSION_LOCAL_PATH)) {
      console.log('  Local: version-config.local.json (gitignored)');
    }
    if (fs.existsSync(VERSION_CONFIG_PATH)) {
      console.log('  Project: version-config.json');
    }
    if (fs.existsSync(VERSION_TEMPLATE_PATH)) {
      console.log('  Template: version-config.template.json (committed)');
    }
    console.log('');
  }

  createInitialConfig() {
    if (!fs.existsSync(VERSION_LOCAL_PATH)) {
      this.saveConfig();
      console.log('✅ Created initial local version configuration');
      console.log('📝 Note: This creates version-config.local.json (gitignored)');
      console.log('📝 The template version-config.template.json is committed to git');
    } else {
      console.log('ℹ️  Local version configuration already exists');
    }
  }

  resetToTemplate() {
    try {
      if (fs.existsSync(VERSION_TEMPLATE_PATH)) {
        const templateConfig = JSON.parse(fs.readFileSync(VERSION_TEMPLATE_PATH, 'utf8'));
        this.config = templateConfig;
        this.saveConfig();
        console.log('✅ Reset version configuration to template values');
      } else {
        console.log('❌ Template file not found');
      }
    } catch (error) {
      console.error('❌ Failed to reset to template:', error.message);
    }
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1];
  const platform = args[2];
  const type = args[3];

  const versionManager = new VersionManager();

  switch (command) {
    case 'init':
      versionManager.createInitialConfig();
      break;

    case 'status':
      versionManager.showStatus();
      break;

    case 'increment':
      if (!environment) {
        console.error('❌ Please specify environment: npm run version:increment <environment> [platform] [type]');
        process.exit(1);
      }
      versionManager.incrementVersion(environment, platform, type);
      versionManager.saveConfig();
      break;

    case 'update-config':
      if (!environment) {
        console.error('❌ Please specify environment: npm run version:update-config <environment>');
        process.exit(1);
      }
      versionManager.updateAppConfig(environment);
      break;

    case 'reset':
      versionManager.resetToTemplate();
      break;

    case 'help':
    default:
      console.log(`
📱 Version Manager - Manage app versions across environments

Usage:
  npm run version:init                    # Create initial local version configuration
  npm run version:status                  # Show version status for all environments
  npm run version:increment <env> [platform] [type]  # Increment version for environment
  npm run version:update-config <env>     # Update app.config.js with environment versions
  npm run version:reset                   # Reset to template values

Environments: development, staging, production, production_apk, production_ipa
Platforms: android, ios, all (default: all)
Types: build (default), patch, minor, major

Examples:
  npm run version:increment development           # Increment both platforms (default)
  npm run version:increment development android  # Increment Android only
  npm run version:increment development ios      # Increment iOS only
  npm run version:increment staging patch        # Increment patch version
  npm run version:update-config production       # Update config with production versions
  npm run version:reset                          # Reset to template values

Configuration Files:
  version-config.template.json            # Template (committed to git)
  version-config.local.json               # Local config (gitignored)
  version-config.json                     # Project config (optional)
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = VersionManager;
