---
title: Chord Library
---

# Chord Library

The Library is your team's central catalog of chord sheets.

Use it to:

- create new songs
- upload chord files
- search by title or artist
- download backups
- delete old or duplicate songs

## What you can do in the Library

On the Library page, you can:

- click **New Song** to create a chord sheet manually
- click **Upload** to import one or more files
- click **Backup** to download your library backup
- use the search bar to find songs by title or artist
- move through the list with next/previous pagination

## Supported upload formats

The upload dialog supports:

- `.chordpro`
- `.cho`
- `.crd`
- `.json`

### File behavior

- Text-based chord files are parsed and turned into chord sheets
- `.json` files are treated as backup imports
- JSON bulk upload may depend on the library’s live connection being ready before import starts

If the app tells you to wait for the library connection before uploading JSON backups, give it a moment and try again.

## Search behavior

The search field is optimized for quick filtering:

- it searches by **title** or **artist**
- it uses a short debounce, so results refresh after you pause typing
- changing the search resets paging back to the first page

## Backups

The **Backup** button downloads a JSON export of your chord sheets.

Use backups to:

- archive your library
- migrate content
- preserve data before major cleanup
- restore bulk content later through upload

## Delete behavior

You can delete chord sheets from the library.

Before deleting:

- confirm the song is not needed in active set lists
- verify you have a backup if you might need it later

Deletion is destructive and should be treated as permanent.

## Real-time behavior

The library initializes a live connection in the background so certain workflows, especially bulk imports, can report progress and finish cleanly.

If bulk upload progress appears delayed:

- wait until the app is fully loaded
- avoid closing the upload dialog mid-import
- refresh after the import completes if needed

## Recommended library organization habits

To keep your library clean:

- use consistent song titles
- include artist names when possible
- avoid duplicate versions unless they serve a clear purpose
- keep ChordPro metadata accurate
- remove abandoned test songs after setup

## Good workflow for new teams

A simple, reliable sequence is:

1. upload existing songs
2. search for duplicates
3. clean titles/artists
4. open songs and verify rendering
5. start building set lists

## Related guides

- [Chord Sheets](./chord-sheets)
- [Set Lists](./setlists)
- [Troubleshooting](./troubleshooting)
