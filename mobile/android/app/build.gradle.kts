import java.util.Base64

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        @Suppress("DEPRECATION")
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName

        // --- Auth0 Configuration ---
        // Provide manifest placeholders for Auth0 plugin. These can be passed
        // via Gradle properties (e.g. -Pauth0Domain=...) or environment
        // variables `AUTH0_DOMAIN` and `AUTH0_CALLBACK_SCHEME`.
        
        var auth0Domain = (project.findProperty("auth0Domain") as? String)
            ?: System.getenv("AUTH0_DOMAIN") ?: ""
        var auth0Scheme = (project.findProperty("auth0Scheme") as? String)
            ?: System.getenv("AUTH0_CALLBACK_SCHEME") ?: System.getenv("AUTH0_SCHEME") ?: "teamchords"

        // Try to parse dart-defines if provided by flutter run (standard since Flutter 3.7)
        // This allows 'flutter run --dart-define=AUTH0_DOMAIN=...' to automatically configure Android.
        val dartDefinesRaw = (project.findProperty("dart-defines") as? String)
        if (dartDefinesRaw != null) {
            val decoded = try {
                String(Base64.getDecoder().decode(dartDefinesRaw))
            } catch (e: Exception) {
                dartDefinesRaw
            }
            decoded.split(",").forEach { define ->
                val parts = define.split("=", limit = 2)
                if (parts.size == 2) {
                    val (key, value) = parts
                    if (key == "AUTH0_DOMAIN") auth0Domain = value
                    if (key == "AUTH0_CALLBACK_SCHEME") auth0Scheme = value
                }
            }
        }

        manifestPlaceholders["auth0Domain"] = auth0Domain
        manifestPlaceholders["auth0Scheme"] = auth0Scheme
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}
