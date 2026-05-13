TeamChords Mobile (scaffold)
=================================

This `mobile` folder contains a lightweight Flutter scaffold implementing the Phase 1 foundation:

- `lib/main.dart` — app entry, `go_router` routing, bottom nav shell
- `lib/core/*` — `AuthService`, `ApiClient`, `SignalRService` (placeholders)
- `lib/features/*` — feature stubs for `auth`, `library`, and `setlists`
- `lib/utils/chord_parser.dart` — minimal chord parsing helpers and tests

Next steps:

1. Replace `AuthService.login()` placeholder with a real `auth0_flutter` WebAuth flow.
2. Implement `ApiClient` calls to the real backend and add models/providers.
3. Expand `chord_parser.dart` with full ChordPro parsing and transposition.
4. Wire `SignalRService` to the ASP.NET Core SignalR hubs for Live View updates.
# mobile

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

Manual Live View verification
-----------------------------

To manually verify the Live View (SignalR) integration you can run the backend locally and start the mobile app pointing at that backend. The app uses the API base URL configured in `mobile/lib/core/api_client.dart` (default: `http://localhost:5268`). You can override that at build/run time with `--dart-define=API_BASE_URL`.

1. Start the backend (API only):

```bash
cd tcv2.Api
dotnet watch run
```

Or run the full AppHost (includes additional services):

```bash
cd tcv2.AppHost
dotnet run
```

2. Run the mobile app from the `mobile` folder. Provide your Auth0 values (or leave them blank to use the dev-token fallback) and, if needed, override the API base URL:

```bash
cd mobile
flutter pub get
flutter run \
	--dart-define=AUTH0_DOMAIN=your-tenant.us.auth0.com \
	--dart-define=AUTH0_CLIENT_ID=your-client-id \
	--dart-define=AUTH0_AUDIENCE=https://api.example.com \
	--dart-define=API_BASE_URL=http://localhost:5268
```

3. In the app: sign in (or use the dev-token fallback), open the **Setlists → Live** tab and observe incoming events. When the backend broadcasts updates you should see items like `SetListUpdated` and `OutputUpdated` appear in the list.

4. To trigger events, use the backend admin UI, call the server APIs that modify setlists/outputs, or run test code on the server that invokes the SignalR hub. If no events appear, check backend logs for hub activity and ensure the hub path matches `<API_BASE_URL>/hubs/setlists`.

Notes
- The app's default API base URL is `http://localhost:5268`. If your backend listens on a different port (commonly `5000` in some local setups), pass that URL using `--dart-define=API_BASE_URL=http://localhost:5000`.
- The Auth0 callback scheme is read from `mobile/lib/core/auth_config.dart` (default: `teamchords`); ensure your `AUTH0_CALLBACK_SCHEME` matches the configured callback in your Auth0 application if you use real Auth0 credentials.

Android-specific notes
----------------------

The Auth0 Flutter plugin injects an intent-filter into the Android manifest using manifest placeholders. If you see build errors about missing `<auth0Domain>` or `<auth0Scheme>` placeholders, provide them via environment variables or Gradle properties before running the app.

Export environment variables (recommended for local runs):

```bash
export AUTH0_DOMAIN=teamchords.jp.auth0.com
export AUTH0_CALLBACK_SCHEME=teamchords
flutter run \
 	--dart-define=AUTH0_DOMAIN=$AUTH0_DOMAIN \
 	--dart-define=AUTH0_CLIENT_ID=your-client-id \
 	--dart-define=AUTH0_AUDIENCE=https://api.example.com \
 	--dart-define=AUTH0_CALLBACK_SCHEME=$AUTH0_CALLBACK_SCHEME \
 	--dart-define=API_BASE_URL=http://localhost:5268
```

Or pass Gradle properties (alternative):

```bash
./gradlew assembleDebug -Pauth0Domain=teamchords.jp.auth0.com -Pauth0Scheme=teamchords
```

The Android `build.gradle.kts` will read `auth0Domain` and `auth0Scheme` from Gradle properties or environment variables and fall back to empty strings for local development.

App Links / Universal Links (production)
--------------------------------------

If you want `https` callbacks to open your app (recommended for production), you must enable Android App Links and iOS Universal Links and host verification files on the domain used for callbacks.

1) Host verification files on your callback domain

- Android: publish a Digital Asset Links file at `https://<YOUR_DOMAIN>/.well-known/assetlinks.json` containing an entry like `mobile/assetlinks/assetlinks.json.example` in this repo. Replace `package_name` and the `sha256_cert_fingerprints` entry with your app's package and signing fingerprint (debug or release key as appropriate).
- iOS: publish an `apple-app-site-association` file at `https://<YOUR_DOMAIN>/.well-known/apple-app-site-association` (or at the root). Use the example in `mobile/apple-app-site-association.example.json` and replace `<TEAM_ID>` and bundle id.

2) Android: compute your app signing certificate SHA256 (debug example):

```bash
keytool -list -v -alias androiddebugkey -keystore $HOME/.android/debug.keystore \
	-storepass android -keypass android | sed -n 's/.*SHA256:\s*//p'
```

3) iOS: enable Associated Domains in Xcode for the Runner target and add an entitlement like `applinks:<YOUR_DOMAIN>` (we added `mobile/ios/Runner/Runner.entitlements` with an example entry). Replace the domain there or edit in Xcode.

4) Auth0 Allowed Callback URLs: add the https callback forms to your Auth0 application settings:

- Android: `https://<YOUR_DOMAIN>/android/<APPLICATION_ID>/callback` (e.g. `https://teamchords.jp.auth0.com/android/com.example.mobile/callback`)
- iOS: `https://<YOUR_DOMAIN>/ios/<BUNDLE_ID>/callback` (e.g. `https://teamchords.jp.auth0.com/ios/com.example.mobile/callback`)

Notes and gotchas
- The verification files must be served over HTTPS with the correct content-type (`application/json`).
- For Android `assetlinks.json` ensure the `sha256_cert_fingerprints` matches the signing key (debug vs release). For Play/App signing you may need the Play signing certificate.
- For iOS the `appID` must be `TEAMID.bundle.id` (get your Apple Team ID from the Apple Developer portal).

Files added to help:
- `mobile/assetlinks/assetlinks.json.example` — example Digital Asset Links JSON to host on your domain.
- `mobile/apple-app-site-association.example.json` — example app-site-association JSON for iOS.
- `mobile/ios/Runner/Runner.entitlements` — entitlements file with an Associated Domains example (edit in Xcode to set your domain).

If you'd like, I can also:
- Patch Gradle to print the current `auth0Domain` and `auth0Scheme` at build time for verification.
- Add a debug page in the app that displays the effective callback URIs for the current build (helpful for confirming values).

