---
title: Troubleshooting
---

# Troubleshooting

This page covers common problems and the fastest things to check first.

## I can’t see my organization

Check these possibilities:

- you have not created one yet
- your invite was not accepted successfully
- you are signed into a different account
- your profile data needs to refresh after a recent change

Try signing out and back in if the organization context looks incorrect.

## My invite link didn’t work

Possible causes:

- the invite was already used
- the invite URL was copied incorrectly
- you opened an old invite
- you need to sign in instead of sign up, or vice versa

Ask the admin to send a new invite if needed.

## My library upload failed

Check:

- the file extension is supported
- the file is valid text data
- the JSON upload is actually a Team Chords backup
- the page was fully loaded before starting a JSON bulk import

For JSON backups specifically, wait until the library connection is ready before retrying.

## Bulk JSON import says to wait

This usually means the live library connection has not finished initializing yet.

Try this:

1. wait a few seconds
2. keep the library page open
3. reopen the upload dialog
4. retry the import

## My chord sheet preview looks wrong

Look for:

- malformed ChordPro syntax
- unsupported source formatting
- a failed conversion from another format
- missing metadata or bad section markers

Try using the converter again or simplify the content until the preview renders cleanly.

## I saved a set list but something looks out of order

Check whether you:

- dragged songs into the intended order
- saved after reordering
- duplicated a song unintentionally
- edited the correct set list

Open preview again after saving.

## Live/shared set list is not updating

Possible causes include:

- temporary connection problems
- the browser tab lost connection
- the set list was changed after the view loaded and needs a refresh
- the underlying chord sheet was removed

Refreshing the set list view is the fastest first step.

## Printing doesn’t look right

Before printing:

- switch page size to Letter, A4, or Legal
- preview the set list view first
- check the browser’s print scale settings
- verify that the song content itself renders correctly on screen

## Billing page looks stale after checkout

Billing changes may take a moment to appear.

Try:

- switching tabs and returning
- refreshing the page
- waiting briefly after checkout completes

Team Chords already tries to refresh billing-related profile information after focus/visibility changes.

## I can’t manage billing

You may not be an admin for the active organization.

Check your role in:

- the Team page
- the Profile page
- the active organization context

## I can’t rename the organization

Only admins should expect to edit the organization name.

Also verify:

- the new name is not blank
- the new name is within the allowed length
- you waited for autosave to finish

## Support checklist before contacting us

To speed up support, gather:

- your organization name
- the exact page or feature involved
- the steps you took
- the error text you saw
- whether the issue affects one user or the whole team

Then open the [Support](/support) page and start a chat.
