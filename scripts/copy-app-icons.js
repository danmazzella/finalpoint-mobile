#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Copying app icons...');

// Copy notification icon (required for expo-notifications)
const notificationSource = path.join(__dirname, '../assets/images/icon.png');
const notificationDest = path.join(__dirname, '../assets/images/notification-icon.png');

if (fs.existsSync(notificationSource)) {
    try {
        fs.copyFileSync(notificationSource, notificationDest);
        console.log('✅ Notification icon created/updated');
    } catch (error) {
        console.error('❌ Error copying notification icon:', error.message);
    }
} else {
    console.log('⚠️  Source icon not found, skipping notification icon');
}

// Copy iOS icon to assets folder for prebuild access
const iosIconSource = path.join(__dirname, '../../fp/ios/AppIcon.appiconset/ItunesArtwork@2x.png');
const iosIconDest = path.join(__dirname, '../assets/images/Icon-App-1024x1024@1x.png');

if (fs.existsSync(iosIconSource)) {
    try {
        // Ensure ios-icons directory exists
        const iosIconDir = path.dirname(iosIconDest);
        if (!fs.existsSync(iosIconDir)) {
            fs.mkdirSync(iosIconDir, { recursive: true });
        }

        fs.copyFileSync(iosIconSource, iosIconDest);
        console.log('✅ iOS icon copied to assets');
    } catch (error) {
        console.error('❌ Error copying iOS icon to assets:', error.message);
    }
} else {
    console.log('⚠️  iOS icon source not found, skipping iOS icon copy to assets');
}

// Copy iOS icons
const iosSourceDir = path.join(__dirname, '../../fp/ios/AppIcon.appiconset');
const iosDestDir = path.join(__dirname, '../ios/FinalPoint/Images.xcassets/AppIcon.appiconset');

if (fs.existsSync(iosSourceDir) && fs.existsSync(iosDestDir)) {
    try {
        const files = fs.readdirSync(iosSourceDir);
        files.forEach(file => {
            const sourcePath = path.join(iosSourceDir, file);
            const destPath = path.join(iosDestDir, file);
            fs.copyFileSync(sourcePath, destPath);
            console.log(`✅ Copied iOS icon: ${file}`);
        });
        console.log('✅ iOS icons copied successfully');

        // Also copy the renamed 1024x1024 icon to assets/images for app.json
        const mainIconSource = path.join(iosSourceDir, 'ItunesArtwork@2x.png');
        const mainIconDest = path.join(__dirname, '../assets/images/Icon-App-1024x1024@1x.png');

        if (fs.existsSync(mainIconSource)) {
            try {
                fs.copyFileSync(mainIconSource, mainIconDest);
                console.log('✅ Main iOS icon copied to assets/images');
            } catch (error) {
                console.error('❌ Error copying main iOS icon:', error.message);
            }
        }
    } catch (error) {
        console.error('❌ Error copying iOS icons:', error.message);
    }
} else {
    console.log('⚠️  iOS directories not found, skipping iOS icon copy');
}

// Copy Android icons to assets folder for prebuild access
const androidSourceDir = path.join(__dirname, '../../fp/android');
const androidAssetsDir = path.join(__dirname, '../assets/android-icons');

if (fs.existsSync(androidSourceDir)) {
    try {
        // Ensure assets directory exists
        if (!fs.existsSync(androidAssetsDir)) {
            fs.mkdirSync(androidAssetsDir, { recursive: true });
        }

        // Copy playstore icon
        const playstoreSource = path.join(androidSourceDir, 'playstore-icon.png');
        const playstoreDest = path.join(androidAssetsDir, 'playstore-icon.png');

        if (fs.existsSync(playstoreSource)) {
            fs.copyFileSync(playstoreSource, playstoreDest);
            console.log('✅ Copied Android playstore icon to assets');
        }

        console.log('✅ Android icons copied to assets successfully');
    } catch (error) {
        console.error('❌ Error copying Android icons to assets:', error.message);
    }
} else {
    console.log('⚠️  Android source directory not found, skipping Android icon copy');
}

// Copy Android icons to native android directory (if it exists)
const androidDestDir = path.join(__dirname, '../android/app/src/main/res');

if (fs.existsSync(androidSourceDir) && fs.existsSync(androidDestDir)) {
    try {
        // Copy mipmap directories
        const mipmapDirs = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
        mipmapDirs.forEach(dir => {
            const sourcePath = path.join(androidSourceDir, dir);
            const destPath = path.join(androidDestDir, dir);

            if (fs.existsSync(sourcePath)) {
                if (!fs.existsSync(destPath)) {
                    fs.mkdirSync(destPath, { recursive: true });
                }

                const files = fs.readdirSync(sourcePath);
                files.forEach(file => {
                    const fileSourcePath = path.join(sourcePath, file);
                    const fileDestPath = path.join(destPath, file);
                    fs.copyFileSync(fileSourcePath, fileDestPath);
                    console.log(`✅ Copied Android icon: ${dir}/${file}`);
                });
            }
        });

        // Copy mipmap-anydpi-v26 directory
        const anydpiDir = 'mipmap-anydpi-v26';
        const anydpiSource = path.join(androidSourceDir, anydpiDir);
        const anydpiDest = path.join(androidDestDir, anydpiDir);

        if (fs.existsSync(anydpiSource)) {
            if (!fs.existsSync(anydpiDest)) {
                fs.mkdirSync(anydpiDest, { recursive: true });
            }

            const files = fs.readdirSync(anydpiSource);
            files.forEach(file => {
                const fileSourcePath = path.join(anydpiSource, file);
                const fileDestPath = path.join(anydpiDest, file);
                fs.copyFileSync(fileSourcePath, fileDestPath);
                console.log(`✅ Copied Android icon: ${anydpiDir}/${file}`);
            });
        }

        console.log('✅ Android icons copied to native directory successfully');
    } catch (error) {
        console.error('❌ Error copying Android icons to native directory:', error.message);
    }
} else {
    console.log('⚠️  Android native directory not found, skipping native Android icon copy');
}

console.log('🎉 App icon copy process completed!');
console.log('');
console.log('📱 Next steps:');
console.log('1. For iOS: The icons are ready for EAS build');
console.log('2. For Android: Icons are now in assets folder and ready for prebuild');
console.log('3. Run "npm run copy-icons" anytime to refresh icons');
console.log('4. For native Android builds, run this script after "expo prebuild"');
