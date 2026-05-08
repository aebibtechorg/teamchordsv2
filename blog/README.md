# Team Chords Blog

This is the standalone Team Chords blog built with Astro.

The production deployment target is Firebase App Hosting.

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

The blog runs in Astro server mode and is intended to be deployed on Firebase App Hosting. That keeps request-time Sanity fetching available without rebuilding the site for every post update.

## Deployment

Firebase App Hosting should point its app root at `blog/` and use `apphosting.yaml` from this directory.

The checked-in App Hosting config provides the non-secret Sanity settings that must exist at both build time and runtime:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_VERSION`

Set these separately in the Firebase App Hosting console or secret manager integration before rollout:

- `BLOG_SITE_URL` so canonical URLs match the real production domain
- `SANITY_API_TOKEN` only if you want server-side draft or preview reads

After the backend is created, App Hosting will build the app with `npm run build` and start it with `node dist/server/entry.mjs`.

## Sanity setup

Set these environment variables before running the blog locally or in deployment:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_TOKEN` for preview or draft access
- `SANITY_API_VERSION` optionally overrides the API date

The public blog uses `SANITY_API_TOKEN` only for server-side draft reads. The Studio uses Sanity user authentication and only needs the project, dataset, and API version settings to boot.

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
