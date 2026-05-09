# Team Chords Blog

This is the public Team Chords site built with Astro.

The homepage is the crawlable marketing surface, while the app domain handles authentication and the signed-in product experience.

## Local development

```bash
npm ci
npm run dev
```

For the Sanity Studio:

```bash
cd studio
npm ci
SANITY_PROJECT_ID=<your-project-id> SANITY_DATASET=<your-dataset> npm run dev
```

When running through Aspire/AppHost, the Studio is exposed separately on port `3002`.

To host the Studio for editors, deploy it with Sanity instead of Google Cloud:

```bash
cd studio
SANITY_PROJECT_ID=<your-project-id> \
SANITY_DATASET=<your-dataset> \
SANITY_API_VERSION=2025-05-08 \
npm run deploy
```

The Sanity CLI will prompt for a Studio hostname on the first deploy. After that, the Studio is served by Sanity and does not need Aspire or GCP.

## Runtime

The site runs in Astro server mode so the homepage and blog posts are rendered server-side for SEO and request-time Sanity fetching.

## Deployment

Blog deployment is handled manually. The checked-in `apphosting.yaml` documents the runtime env contract used by the deployment target.

The checked-in App Hosting config provides the non-secret Sanity settings that must exist at both build time and runtime:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_VERSION`
- `APP_SITE_URL`
- `PUBLIC_SITE_URL`

Set these separately in the deployment environment before rollout:

- `PUBLIC_SITE_URL` so canonical URLs match the real production domain
- `APP_SITE_URL` so public CTAs point at the app domain
- `SANITY_API_TOKEN` only if you want server-side draft or preview reads

After the backend is created, App Hosting will build the app with `npm run build` and start it with `node dist/server/entry.mjs`.

## Sanity setup

Set these environment variables before running the blog locally or in deployment:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_TOKEN` for preview or draft access
- `SANITY_API_VERSION` optionally overrides the API date

The public site uses `SANITY_API_TOKEN` only for server-side draft reads. The Studio uses Sanity user authentication and only needs the project, dataset, and API version settings to boot.

## Content model

Posts live in `src/content/blog/` and must include:

- `title`
- `description`
- `pubDate`
- `author`
- `tags`

Optional fields:

- `heroImage`
- `featured`

Sanity documents should mirror the same shape, with the same title, description, publish date, author, tags, hero image, featured flag, and body content.

The Studio schema lives in `sanity/schema.js` and is loaded by the standalone Studio package in `studio/`.

## Writing style

The first posts should feel launch-week, product-forward, and musician-focused. Lead with the Team Chords launch announcement, then follow with a supporting story about why it matters for teams.
