# Light Mode Color Fixes - Implementation Summary

## Overview
Fixed light mode color inconsistencies by replacing hardcoded Tailwind colors (gray-*, white, blue-*) with shadcn-style CSS custom properties that automatically adapt to both light and dark modes.

## Changes Made

### 1. **tailwind.config.js** - Added Theme Color Mappings
Extended Tailwind configuration with shadcn design system colors using CSS custom properties:
- `background`, `foreground`, `card`, `card-foreground`
- `popover`, `popover-foreground`, `muted`, `muted-foreground`
- `accent`, `accent-foreground`, `destructive`, `destructive-foreground`
- `border`, `input`, `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`, `ring`

Each color maps to HSL CSS variables that are defined in `index.css` and automatically switch based on theme.

### 2. **web/src/index.css** - Fixed Input Hardcoded Colors
**Before:**
```css
input, select {
    background-color: white;
}
```
**After:**
```css
input, select {
    background-color: var(--background);
    color: var(--foreground);
}
```
Inputs and selects now respect the active theme.

### 3. **web/src/main.tsx** - Enhanced Theme Initialization
Improved `initTheme()` function to explicitly manage both `.dark` and `.light` classes:
- When dark mode: adds `dark`, removes `light`
- When light mode: adds `light`, removes `dark`
- Falls back to system preference via `prefers-color-scheme` media query
- Defaults to light mode if no system preference detected

### 4. **web/src/components/ui/theme-toggle.tsx** - Explicit Class Management
Updated theme toggle to manage both classes:
```typescript
if (isDark) {
  document.documentElement.classList.add("dark");
  document.documentElement.classList.remove("light");
} else {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("light");
}
```

### 5. **Component Color Replacements**

#### Pages Updated:
- **Pricing.tsx**: All `bg-white`, `bg-gray-*`, `text-gray-*`, `border-blue-*` → shadcn variables
  - `bg-gray-100` → `bg-muted`
  - `bg-white` → `bg-card`
  - `text-gray-*` → `text-foreground` or `text-muted-foreground`
  - `bg-blue-500` → `bg-primary`
  - `text-blue-*` → `text-primary`
  - `border-blue-*` → `border-primary`

- **SetListView.tsx**:
  - `bg-gray-100` → `bg-muted`
  - `bg-white` → `bg-card`
  - `bg-gray-700` → `bg-primary`
  - `text-white` → `text-primary-foreground`
  - `border-gray-200` → `border-border`

- **ChordProSheet.tsx**:
  - `bg-gray-50` → `bg-muted`
  - `text-gray-800` → `text-foreground`
  - `border-gray-300` → `border-border`
  - `text-blue-500` → `text-primary`

- **Signup.tsx**:
  - `bg-gray-700` → `bg-primary`
  - `bg-gray-100` → `bg-card`
  - `text-blue-500` → `text-primary`
  - `bg-gray-500` → `bg-primary`

- **Profile.tsx**:
  - `bg-white` → `bg-card`
  - `text-gray-700` → `text-foreground`
  - `text-gray-500` → `text-muted-foreground`
  - `bg-gray-500` → `bg-primary`

- **UpdatePassword.tsx**:
  - `bg-white` → `bg-card`
  - `bg-gray-500` → `bg-primary`
  - `text-white` → `text-primary-foreground`

- **Onboarding.tsx**:
  - `text-gray-500` → `text-muted-foreground`
  - `bg-gray-500` → `bg-primary`

- **AcceptInvite.tsx**:
  - `bg-gray-50` → `bg-background`
  - `text-gray-600` → `text-muted-foreground`

- **Signin.tsx**:
  - `bg-gray-700` → `bg-primary`

## CSS Variable Hierarchy (index.css)

The CSS system uses a cascade that ensures consistent theme switching:

1. **:root** - Default light mode (fallback)
   - `--background: 0 0% 100%` (white)
   - `--foreground: 222.2 47.4% 11.2%` (dark gray)

2. **@media (prefers-color-scheme: dark)** - System preference dark mode
   - Applied if user has OS dark mode enabled AND no localStorage override
   - `--background: 222.2 84% 4.9%` (dark blue)
   - `--foreground: 210 40% 98%` (light)

3. **.dark class** - Explicit dark mode override
   - Applied when user toggles dark mode in app
   - Same values as media query above

4. **.light class** - Explicit light mode override
   - Applied when user toggles light mode in app
   - Same values as :root

## Theme Flow

```
User opens app
    ↓
initTheme() reads localStorage and system preference
    ↓
Adds .dark or .light class to <html>
    ↓
CSS variables adjust automatically
    ↓
User clicks theme toggle
    ↓
ThemeToggle swaps classes and saves preference
    ↓
All colors update instantly (no hard refresh needed)
```

## Testing

✅ Build succeeds with all changes
✅ TypeScript compilation clean
✅ All hardcoded colors replaced with theme variables
✅ System preference respected by default
✅ Theme toggle works in both directions

## Remaining Notes

- Green colors for table checkmarks (`text-green-500`) kept as-is since they're accent colors not affected by theme
- Red colors for error states kept as-is for consistency with destructive patterns
- All Tailwind classes now use shadcn design system tokens for consistency

