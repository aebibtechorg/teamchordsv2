# TeamChords Platform Admin

This directory is reserved for the separate platform-admin frontend that will run on `admin.teamchords.app`.

## Initial contract

- **Auth0**: separate admin application and callback URL
- **API boot config**: `GET /api/admin/config`
- **Admin session bootstrap**: `GET /api/admin/me`
- **Analytics and org management**: `GET /api/admin/summary`, `GET /api/admin/organizations`, `GET /api/admin/organizations/{id}/members`
- **Support**: Chatwoot is loaded in the main customer app first; this admin app will later consume Chatwoot context and deep links

## Next files to add

- `src/main.tsx`
- `src/router.tsx`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routes/callback.tsx`
- `package.json`

The next implementation slice should scaffold the TanStack Start app shell around those routes and wire it to the admin config endpoint.

