# Monaco Editor Theme Support - Complete ✅

## Update
The Monaco editor in ChordProSheet.tsx now automatically follows the light/dark color scheme.

## Changes Made

### ChordProSheet.tsx

**1. Added theme state tracking (line 39)**
```typescript
const [editorTheme, setEditorTheme] = useState<"vs" | "vs-dark">("vs");
```

**2. Added theme change monitoring (lines 63-78)**
```typescript
useEffect(() => {
  const updateEditorTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    setEditorTheme(isDark ? "vs-dark" : "vs");
  };
  
  // Set initial theme
  updateEditorTheme();
  
  // Listen for theme changes
  const observer = new MutationObserver(updateEditorTheme);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  
  return () => observer.disconnect();
}, []);
```

**3. Added theme prop to Editor component (line 279)**
```typescript
<Editor
  height="64vh"
  defaultLanguage="plaintext"
  value={content}
  onChange={(value) => setContent(value)}
  theme={editorTheme}  // ← Added this
  options={{ minimap: { enabled: false }, wordWrap: "on" }}
/>
```

## How It Works

1. **Initial Load**: The component checks if `.dark` class is on `document.documentElement`
2. **Sets Editor Theme**: 
   - If dark mode: uses `"vs-dark"` theme (Monaco's dark theme)
   - If light mode: uses `"vs"` theme (Monaco's light theme)
3. **Monitors Changes**: Uses MutationObserver to watch for class changes on the root element
4. **Updates in Real-time**: When user toggles theme, editor automatically switches themes

## Monaco Editor Themes

- `"vs"` - Light theme (white background, dark text)
- `"vs-dark"` - Dark theme (dark background, light text)

## Testing

✅ Build succeeds with changes
✅ Editor displays in light mode theme
✅ Editor displays in dark mode theme
✅ Theme switches instantly when toggling
✅ No TypeScript errors related to changes

## Files Modified

- ✅ `web/src/pages/ChordProSheet.tsx` - Added theme monitoring and applied to Editor component

