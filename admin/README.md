# Platform Admin

This is the SSR admin frontend for TeamChords. It uses TanStack Start, React, TypeScript, Tailwind CSS, and shadcn/ui.

## Authentication

The admin portal uses Auth0 and requires a token that carries one of these roles in the `roles` claim:

- `platform-admin`
- `support`

On startup the app loads `/api/admin/config`, signs in with the returned Auth0 values, and then verifies access with `/api/admin/me` before rendering the admin routes.

Platform admin and support operators do not need a matching app database `User` row; `/api/admin/me` now returns the role-based admin session even when the backend has no stored user profile for that Auth0 subject.

The admin app serves `/api/admin/*` through a TanStack Start server route at `src/routes/api/admin/$.ts`, which forwards to `tcv2.Api` in both dev and production.

## URL rewriting

The admin router now uses TanStack Start `rewrite` rules in `src/router.tsx`.

- On an admin host like `admin.example.com`, routes stay unprefixed, e.g. `/dashboard`
- On a non-admin host, the public URL is prefixed, e.g. `/admin/dashboard`
- Internally the router still matches the root route tree, so links and navigation stay consistent

When configuring Auth0, allow the public callback/logout URLs that match the deployment mode.
The logout flow returns to the admin dashboard with `?logged_out=1`, which shows a signed-out screen instead of immediately logging back in.

## Run locally

```bash
cd admin
npm install
npm run dev
```

## What’s included

- dashboard shell
- organization list/detail/members views
- analytics placeholder
- support handoff into the existing customer workflow
- Auth0-backed admin bootstrap and role-aware sign-out state
- Auth0-backed admin bootstrap and role-aware sign-out state, with no dependency on a stored customer `User` record
- TanStack Start URL rewrite support for admin host and `/admin` prefix deployments
- TanStack Start server-side proxying for `/api/admin/*`

## Adding UI components

Use shadcn/ui as usual:

```bash
npx shadcn@latest add button
```

Import with the `@/` alias:

```tsx
import { Button } from "@/components/ui/button"
```
