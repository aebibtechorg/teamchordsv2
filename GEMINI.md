# Team Chords v2

## Project Overview
Team Chords v2 is a multi-platform application for managing chord sheets and music libraries. It uses .NET Aspire for orchestration and local development.

## Repository Structure
- `tcv2.AppHost`: .NET Aspire orchestrator.
- `tcv2.Api`: ASP.NET Core backend API.
- `web`: Primary React web application for customers.
- `admin`: React-based administration dashboard.
- `blog`: Astro-based blog with Sanity integration.
- `help`: Docusaurus-based help center.
- `mobile`: Flutter-based mobile application.
- `infra`: Infrastructure as Code (GCP, Auth0).

## Technical Standards
- **Orchestration:** .NET Aspire is the primary tool for running the entire stack locally.
- **Backend:** .NET 9 with Minimal APIs.
- **Frontend:** React 19 with Vite 7 and Tailwind CSS 4.
- **Mobile:** Flutter.
- **Documentation:** Docusaurus for help center, Astro for blog.

## Subdirectory Instructions
- [Admin Instructions](./admin/GEMINI.md)
- [Web App Instructions](./web/GEMINI.md)
- [Blog Instructions](./blog/GEMINI.md)
- [Mobile Instructions](./mobile/GEMINI.md)
- [API Instructions](./tcv2.Api/GEMINI.md)
- [Help Center Instructions](./help/GEMINI.md)
