module.exports = {
    project: {
        android: {
            sourceDir: './android',
            manifestPath: 'app/src/main/AndroidManifest.xml',
            buildGradlePath: 'app/build.gradle',
            settingsGradlePath: 'settings.gradle',
            gradlePropertiesPath: 'gradle.properties',
            mainActivityPath: 'app/src/main/java/com/finalpoint/mobile/MainActivity.kt',
            mainApplicationPath: 'app/src/main/java/com/finalpoint/mobile/MainApplication.kt',
        },
    },
    dependencies: {
        'react-native-vector-icons': {
            platforms: {
                android: {
                    sourceDir: '../node_modules/react-native-vector-icons/android',
                    packageImportPath: 'import com.oblador.vectoricons.VectorIconsPackage;',
                    packageImportPath: 'new VectorIconsPackage()',
                },
            },
        },
    },
};
