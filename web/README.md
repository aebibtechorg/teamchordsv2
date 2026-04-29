# teamchords
Team Chords is a web app for creating and sharing set lists for live music. Uses the ChordPro format for chord sheets.

## Dependencies
- Node.js
- Auth0
- ChordPro
- ChordSheetJS

## Setup

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev`

## Onboarding

- New users are guided with separate Driver.js tours for the Library and Set Lists pages.
- The Library tour starts after organization creation or on first login when the user already belongs to an organization.
- The Set Lists tour starts the first time the user visits the Set Lists page.
- Both tours can be replayed from the Profile page.
