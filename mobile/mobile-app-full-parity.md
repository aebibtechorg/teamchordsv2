# Flutter Mobile App Implementation Plan (Full Feature Parity)

## Background & Motivation
Team Chords currently has a feature-rich React web application. To provide a native mobile experience for musicians on the go and during live performances, we are building a Flutter application in the `mobile` directory. The goal is to achieve full feature parity with the web app, allowing users to manage their library, build set lists, collaborate with their team, and use the real-time live view natively on their devices.

## Scope & Impact
This plan covers the end-to-end development of the Flutter application. It will heavily impact the `mobile` directory and will rely on the existing `.NET` API and SignalR hubs.
**Key Technical Choices:**
*   **Routing:** `go_router` (parallels React Router).
*   **State Management:** `flutter_riverpod` (parallels Zustand / Context).
*   **Authentication:** `auth0_flutter` for seamless Auth0 integration.
*   **Real-time:** `signalr_netcore` to connect to the existing ASP.NET Core SignalR hubs.
*   **Networking:** `http` or `dio` with interceptors for attaching the Auth0 Bearer token.
*   **Chord Rendering:** A native Dart implementation or adaptation for parsing and rendering ChordPro format (since the web uses `chordsheetjs`).

## Proposed Solution
We will structure the Flutter app to mirror the domain-driven layout of the web app:
*   `lib/core/` (API client, Auth, Constants, Routing)
*   `lib/features/auth/` (Login/Signup flows)
*   `lib/features/library/` (Chord sheet list, creation, and editor)
*   `lib/features/setlists/` (Set list management, drag-and-drop ordering, Live View)
*   `lib/features/team/` (Team management)
*   `lib/features/profile/` (User settings and billing info)

## Alternatives Considered
*   **Core Performance Focus (MVP):** Building only the Live View and read-only library first. The user explicitly chose Full Feature Parity instead.
*   **WebView Wrapping:** Wrapping the existing React app in a Flutter WebView. Rejected because it does not provide the performance and feel of a true native mobile application, especially for live performance use cases.

## Implementation Plan

### Phase 1: Foundation & Authentication
1.  Add necessary dependencies to `pubspec.yaml` (`go_router`, `flutter_riverpod`, `auth0_flutter`, `http`, `signalr_netcore`, `shared_preferences`).
2.  Configure `auth0_flutter` with the existing Auth0 tenant details.
3.  Implement the `go_router` configuration with a shell route for the main navigation (bottom tab bar for mobile).
4.  Create the Sign In / Landing screens.

### Phase 2: Core Data & API Client
1.  Implement an API client wrapper that automatically attaches the Auth0 access token.
2.  Implement Riverpod providers for the User Profile and active Organization state.
3.  Build the Organization selector and Onboarding flow for users without an organization.

### Phase 3: Library & Chord Sheets
1.  Build the Library list screen with pagination and search.
2.  Implement the Chord Sheet editor screen (Title, Artist, Key, ChordPro text input).
3.  Develop a Flutter widget to parse and render ChordPro text natively, supporting transposition and capo adjustments.
You can use the `chordify_lyrics` Dart package to easily parse ChordPro.


### Phase 4: Set Lists & Live View
1.  Build the Set Lists screen (list view, creation).
2.  Implement the Set List detail screen with drag-and-drop reordering of songs (using `reorderables` or Flutter's built-in `ReorderableListView`).
3.  Integrate `signalr_netcore` to connect to the `/hubs/setlists` hub.
4.  Build the Live View screen that listens to SignalR events (SetListUpdated, OutputUpdated, etc.) and renders the scaled chord sheets.

### Phase 5: Team & Profile
1.  Build the Team Management screen (list members, invite user, change roles, remove members).
2.  Build the Profile screen (update musician details, instruments, preferred key).

## Verification
*   **Unit Tests:** Write tests for the ChordPro parsing and transposition logic in Dart.
*   **Integration Tests:** Verify API client token injection and SignalR connection handling.
*   **Manual Testing:** Run the Flutter app on iOS/Android simulators against the local `.NET Aspire` backend to ensure full end-to-end functionality matches the web app.

## Migration & Rollback
As this is a new application scaffolding, there are no existing mobile users to migrate. Rollback consists of reverting commits to the `mobile` directory via Git if critical architectural flaws are discovered during implementation.
