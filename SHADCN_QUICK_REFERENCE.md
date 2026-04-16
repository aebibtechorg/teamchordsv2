# shadcn/ui Quick Reference Guide

## Common Usage Examples

### Button
```tsx
import { Button } from "@/components/ui/button";

// Default button
<Button>Click me</Button>

// With icon
<Button><Plus size={16} className="mr-2" />Add</Button>

// Variants
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Input & Label
```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="your@email.com"
  />
</div>
```

### Card
```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)} variant="outline">
        Cancel
      </Button>
      <Button onClick={handleConfirm} variant="destructive">
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Select (Searchable)
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={selectedValue} onValueChange={setSelectedValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select an option..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

### Dropdown Menu
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Action 1</DropdownMenuItem>
    <DropdownMenuItem>Action 2</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Alert
```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong. Please try again.
  </AlertDescription>
</Alert>
```

### Badge
```tsx
import { Badge } from "@/components/ui/badge";

<Badge>New</Badge>
<Badge variant="secondary">Info</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Tabs
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

## Dark Mode

All shadcn components automatically support dark mode. Components use Tailwind's `dark:` prefix:

```tsx
// Example - already built into shadcn components
<div className="bg-white dark:bg-neutral-950">
  Light mode background | Dark mode background
</div>
```

No additional work needed! Dark mode is handled automatically via CSS variables.

## Button Variants Explained

| Variant | Use Case |
|---------|----------|
| `default` | Primary actions (Submit, Save, Create) |
| `outline` | Secondary actions (Cancel, Clear) |
| `secondary` | Alternative primary (less prominent) |
| `ghost` | Tertiary actions (Hide, Collapse) |
| `destructive` | Dangerous actions (Delete, Remove) |
| `link` | Navigation-like buttons (embedded in text) |

## Common Patterns

### Form with Validation
```tsx
const [email, setEmail] = useState("");
const [error, setError] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!email.includes("@")) {
    setError("Invalid email");
    return;
  }
  // Submit...
};

<form onSubmit={handleSubmit} className="space-y-4">
  <div>
    <Label htmlFor="email">Email</Label>
    <Input
      id="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
    {error && <p className="text-red-600 text-sm">{error}</p>}
  </div>
  <Button type="submit">Submit</Button>
</form>
```

### Confirm Action Dialog
```tsx
const [isOpen, setIsOpen] = useState(false);

<>
  <Button onClick={() => setIsOpen(true)} variant="destructive">
    Delete
  </Button>

  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirm Delete</DialogTitle>
      </DialogHeader>
      <p>Are you sure you want to delete this item?</p>
      <DialogFooter>
        <Button onClick={() => setIsOpen(false)} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="destructive">
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</>
```

### Mobile Responsive Menu
```tsx
// Desktop: Full buttons
<div className="hidden sm:flex gap-2">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>

// Mobile: Dropdown menu
<div className="sm:hidden">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        <Menu size={20} />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Action 1</DropdownMenuItem>
      <DropdownMenuItem>Action 2</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

## Tips & Tricks

1. **Always import from `@/components/ui/`** - Not from `node_modules`
2. **Use `asChild` prop** - To compose components: `<Button asChild><Link>Link</Link></Button>`
3. **Combine with Tailwind** - shadcn components are just Tailwind, extend freely
4. **Use `cn()` utility** - For conditional class merging: `className={cn("base-class", isActive && "active-class")}`
5. **Dark mode by default** - Don't need to do anything special, it's automatic
6. **Icons from lucide-react** - Already installed and used throughout

## When to Add More Components

Consider adding from shadcn when needed:
- **Popover** - For tooltips and popovers
- **Scroll Area** - For custom scrolling
- **Slider** - For numeric input
- **Toggle** - For on/off states
- **Checkbox/Radio** - For form selections
- **Command** - For search/filtering
- **Calendar** - For date picking
- **Pagination** - For table pagination

Just run: `npx shadcn@latest add <component-name>`

## Troubleshooting

**Q: Component not styling correctly?**
- Check that Tailwind is running (`npm run dev`)
- Verify import path is `@/components/ui/`
- Make sure dark mode class is on root element

**Q: Dialog not closing?**
- Pass `onOpenChange` handler to Dialog
- Don't forget the state setter: `onOpenChange={setIsOpen}`

**Q: Select search not working?**
- It's built-in to Radix Select, type to filter
- No special configuration needed

**Q: Dark mode not applying?**
- Add `dark` class to html/body element
- Or use class-based theme toggle (already set up)

---

For more examples, visit: https://ui.shadcn.com/

