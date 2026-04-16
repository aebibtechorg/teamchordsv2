# shadcn/ui Migration - Verification & Testing Checklist

## Pre-Test Setup
- [ ] Navigate to `/Users/paul/Desktop/teamchordsv2/web` directory
- [ ] Run `npm install` (to ensure all dependencies are correct)
- [ ] Run `npm run dev` and verify no build errors
- [ ] Open browser to `http://localhost:5173` (or configured port)

## Landing Page (App.tsx)
- [ ] Page loads without errors
- [ ] Navbar displays correctly with Theme Toggle and Sign In button
- [ ] Hero section has proper spacing and "Get Started" button is clickable
- [ ] Feature cards display in grid layout
- [ ] Pricing cards render correctly with "Most Popular" badge on middle card
- [ ] All buttons have proper hover states
- [ ] Dark mode toggle works (click Theme Toggle)
  - [ ] Text colors invert properly
  - [ ] Background colors change from white to dark neutral
  - [ ] Cards have proper contrast

## Navigation
- [ ] Desktop Sidebar (md+ screens)
  - [ ] Sidebar expands/collapses when clicking logo
  - [ ] Navigation items (Library, Set Lists, Profile) are clickable
  - [ ] Hover states work correctly
  - [ ] Logout button functions

- [ ] Mobile Sidebar (below md)
  - [ ] Bottom navigation bar visible
  - [ ] All menu items accessible
  - [ ] No layout shift when interacting

## Chord Library Page
- [ ] Page loads and displays list of songs
- [ ] Desktop buttons (New Song, Upload, Backup) display correctly
- [ ] Buttons have proper styling and hover states
- [ ] Mobile dropdown menu appears on small screens
  - [ ] Menu items are accessible
  - [ ] Menu closes after selection
- [ ] Search bar is functional
- [ ] Table displays properly with dark/light mode

## Set Lists Page
- [ ] Page loads and displays list of set lists
- [ ] "New Set List" button is styled correctly
- [ ] Button is clickable and navigates properly
- [ ] Table displays properly

## Set List Form (SetListForm.tsx)
- [ ] Page loads without errors
- [ ] Input field for "Set List Name" displays correctly
- [ ] Save, Add Song, Copy Link, Preview buttons work
- [ ] Add Song button opens Dialog (not Modal)
  - [ ] Dialog has proper title and footer
  - [ ] Cancel and Add buttons are styled correctly
  
- [ ] Song Selection Dialog
  - [ ] Song Select dropdown is searchable
    - [ ] Type in dropdown to filter songs
    - [ ] Options appear and scroll properly
  - [ ] Key Select dropdown works
  - [ ] Capo Select dropdown works
  - [ ] All selects properly close after selection
  - [ ] Form validation works (Add disabled until selections made)
  
- [ ] Song List Items
  - [ ] Songs display with title, artist, key, capo
  - [ ] Drag handles visible (for reordering)
  - [ ] Desktop action buttons visible (sm+ screens):
    - [ ] Duplicate button (Plus icon)
    - [ ] Move up button
    - [ ] Move down button
    - [ ] Edit button
    - [ ] Delete button
  
  - [ ] Mobile menu visible (below sm)
    - [ ] More menu button appears
    - [ ] Menu shows all actions
    - [ ] Actions work correctly

## Dialogs & Modals
- [ ] Confirm Dialog appears when deleting
  - [ ] Title and message display correctly
  - [ ] Cancel button closes dialog
  - [ ] Confirm button performs action
  - [ ] Background darkens properly
  - [ ] Can close by clicking outside (if enabled)

## Forms & Inputs
- [ ] InviteUser component displays
  - [ ] Card styling is correct
  - [ ] Email input field is properly styled
  - [ ] Label is associated with input
  - [ ] Send Invite button works
  - [ ] Success/error alert displays with correct colors

## Dark Mode Testing
- [ ] Toggle dark mode from Theme Toggle
- [ ] Verify ALL pages in both light and dark modes:
  - [ ] Text has sufficient contrast
  - [ ] Borders are visible
  - [ ] Buttons are clearly visible
  - [ ] Cards have proper depth
  - [ ] Input fields are distinguishable
  - [ ] Dialogs don't appear dark on dark background

## Color Palette Verification
### Light Mode
- [ ] Background: white
- [ ] Text: dark neutral (#1f2937 or similar)
- [ ] Borders: light neutral (#e5e7eb or similar)
- [ ] Buttons primary: dark primary color

### Dark Mode
- [ ] Background: very dark (#050505-#1a1a1a)
- [ ] Text: light neutral (#f5f5f5 or similar)
- [ ] Borders: dark neutral (#404040 or similar)
- [ ] Buttons primary: lighter blue

## Button Variants Verification
- [ ] Default variant (filled background)
- [ ] Outline variant (border only)
- [ ] Secondary variant (alternative color)
- [ ] Destructive variant (red for delete actions)
- [ ] All buttons have hover states
- [ ] Disabled buttons appear grayed out

## Select/Dropdown Verification
- [ ] Select components are clickable
- [ ] Options appear in dropdown
- [ ] Search/filter works in Select (type to filter)
- [ ] Keyboard navigation works (up/down arrows, Enter)
- [ ] Escape key closes dropdowns
- [ ] Click outside closes dropdowns

## Accessibility Checks
- [ ] All inputs have associated labels
- [ ] Tab order makes sense
- [ ] Buttons are keyboard accessible (Space/Enter)
- [ ] Dialogs are properly focused
- [ ] Close buttons are visible and accessible

## Performance Checks
- [ ] Pages load quickly (no noticeable lag)
- [ ] No console errors
- [ ] No console warnings about missing dependencies
- [ ] Dialog animations are smooth
- [ ] Dropdown animations are smooth

## Cross-Browser Testing (if applicable)
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browser (iOS Safari/Chrome)

## Responsive Design
- [ ] Test at various screen sizes:
  - [ ] Mobile (320px - 640px)
  - [ ] Tablet (641px - 1024px)
  - [ ] Desktop (1025px+)
- [ ] Sidebars collapse/expand correctly
- [ ] Buttons stack properly on mobile
- [ ] Dropdowns position correctly on edge of screen

## SignalR Real-time Features
- [ ] Open Set List in two windows/tabs
- [ ] Verify real-time updates still work
- [ ] No errors in console related to SignalR

## Drag & Drop (SetListForm)
- [ ] Songs can be dragged to reorder
- [ ] Visual feedback during drag
- [ ] Drop in correct position

## Known Issues to Check
- [ ] ~~react-select is removed~~ ✓ Replaced with shadcn Select
- [ ] ~~Gray color palette~~ ✓ Changed to neutral with dark mode
- [ ] Modal styling ✓ Changed to Dialog
- [ ] Button consistency ✓ All using shadcn Button

## Final Sign-Off
- [ ] All visual elements match design
- [ ] All interactive elements work
- [ ] Dark mode works perfectly
- [ ] Mobile responsive design works
- [ ] No broken layouts or styling
- [ ] No console errors
- [ ] Ready for production

---

## Quick Test Flow

1. **Home/Landing** → Check design, theme toggle
2. **Sign In** → Navigate to Chord Library
3. **Chord Library** → Test buttons, desktop/mobile
4. **Create New Song** → Check form, buttons
5. **Set Lists** → Navigate to set lists
6. **Create Set List** → Test dialog, selects
7. **Add Songs** → Test Select dropdowns (search!)
8. **Dark Mode** → Toggle and verify all pages

---

## Notes

- If you encounter any styling issues, clear browser cache (Ctrl+Shift+R)
- shadcn components use CSS variables, ensure `src/index.css` is being imported
- If dropdowns don't open, check z-index conflicts with other elements
- Select search is built-in to Radix UI - no special config needed

---

**After verification passes all checks, the migration is complete!** ✅

