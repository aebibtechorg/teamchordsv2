# Team Chords — Help Center

This folder contains a standalone Docusaurus site used as the Team Chords public help center.

Run locally:

```bash
cd help
npm install
npm run start
```

The site will run on http://localhost:3000 by default.

Notes:
- The Support page loads Chatwoot configuration from `/api/config` on the main backend so chat settings stay consistent with the app.
- Styling is intentionally minimal but uses the same Inter font and gray palette as the main site.
- CI deploys the help center to a dedicated Firebase Hosting site in the same Firebase project as the main frontend.
- The Hosting site is created by Terraform in `infra/gcp/` and defaults to `<project-id>-help` unless `HELP_FIREBASE_SITE` overrides it.

