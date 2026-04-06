# St. Kizito Parish App - Component Library

## Overview

This document describes all custom components created for the St. Kizito Parish App. Components are organized into three categories: UI Components, Layout Components, and Feature Components.

## UI Components

All UI components are in `/components/ui/` and are fully reusable across the application.

### Button Component

**File:** `components/ui/button-custom.tsx`

Enhanced button with multiple variants and sizes.

**Props:**
- `variant`: 'default' | 'secondary' | 'destructive' | 'accent' | 'outline' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'xl' | 'icon' | 'icon-sm'
- `isLoading`: boolean (shows spinner)
- `disabled`: boolean

**Usage:**
```tsx
<Button variant="default" size="lg" isLoading={false}>
  Click Me
</Button>

<Button variant="outline" size="sm">
  Secondary Action
</Button>

<Button variant="ghost" size="icon-sm">
  <IconComponent />
</Button>
```

### Input Component

**File:** `components/ui/input-custom.tsx`

Flexible input with labels, validation, icons, and helper text.

**Props:**
- `label`: string (optional)
- `type`: 'text' | 'email' | 'password' | 'number' | 'date' | etc.
- `placeholder`: string
- `isInvalid`: boolean (shows error state)
- `helperText`: string (optional)
- `icon`: React.ReactNode (optional)

**Usage:**
```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="user@example.com"
  isInvalid={emailError}
  helperText="Enter a valid email"
/>

<Input
  label="Amount"
  type="number"
  icon={<DollarIcon />}
/>
```

### Badge Component

**File:** `components/ui/badge-custom.tsx`

Status indicator component.

**Props:**
- `variant`: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' | 'accent'

**Usage:**
```tsx
<Badge variant="success">Approved</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Rejected</Badge>
```

### Card Components

**File:** `components/ui/card-custom.tsx`

Container components for content organization.

**Components:**
- `Card`: Main container with border and shadow
- `CardHeader`: Header section with bottom border
- `CardTitle`: Card heading
- `CardDescription`: Subtitle text
- `CardContent`: Main content area
- `CardFooter`: Footer section with top border

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Modal Components

**File:** `components/ui/modal-custom.tsx`

Dialog/overlay components for forms and confirmations.

**Components:**
- `Modal`: Main modal container with backdrop
- `ModalHeader`: Header section
- `ModalTitle`: Modal heading
- `ModalBody`: Content area
- `ModalFooter`: Action buttons section

**Props (Modal):**
- `open`: boolean
- `onOpenChange`: (open: boolean) => void
- `children`: React.ReactNode

**Usage:**
```tsx
<Modal open={isOpen} onOpenChange={setIsOpen}>
  <ModalHeader>
    <ModalTitle>Create New Item</ModalTitle>
    <button onClick={() => setIsOpen(false)}>×</button>
  </ModalHeader>
  <ModalBody>
    <Input label="Title" />
  </ModalBody>
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button onClick={handleCreate}>Create</Button>
  </ModalFooter>
</Modal>
```

### Table Components

**File:** `components/ui/table-custom.tsx`

Data table components with proper structure and styling.

**Components:**
- `Table`: Main table wrapper
- `TableHeader`: Header section
- `TableBody`: Body section
- `TableFooter`: Footer section
- `TableRow`: Row element
- `TableHead`: Header cell
- `TableCell`: Data cell
- `TableCaption`: Caption element

**Usage:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
        <TableCell className="text-right">
          <Button>Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Layout Components

### Sidebar Component

**File:** `components/layout/sidebar.tsx`

Collapsible sidebar navigation.

**Props:**
- `items`: SidebarItem[] - Navigation items
- `isCollapsed`: boolean - Initial collapse state
- `onCollapsedChange`: (collapsed: boolean) => void - Collapse callback

**SidebarItem Interface:**
```tsx
interface SidebarItem {
  label: string
  href: string
  icon?: React.ReactNode
  children?: SidebarItem[]
}
```

**Features:**
- Icon + label display
- Active state styling
- Collapsible with smooth transition
- Logout button in footer
- Logo header

### Navbar Component

**File:** `components/layout/navbar.tsx`

Top navigation bar.

**Props:**
- `title`: string (optional)
- `subtitle`: string (optional)
- `actions`: React.ReactNode (optional - right side buttons)
- `className`: string (optional)

**Usage:**
```tsx
<Navbar
  title="Dashboard"
  subtitle="Welcome back"
  actions={
    <div className="flex gap-3">
      <Button>Notifications</Button>
      <Button>Profile</Button>
    </div>
  }
/>
```

### AdminLayout Component

**File:** `components/layout/admin-layout.tsx`

Complete admin page wrapper combining sidebar, navbar, and content area.

**Props:**
- `children`: React.ReactNode - Page content
- `title`: string (optional) - Page title
- `subtitle`: string (optional) - Page subtitle
- `navbarActions`: React.ReactNode (optional) - Navbar right side content

**Features:**
- Responsive sidebar (auto-collapses on mobile)
- Predefined navigation items
- Main content area with padding
- Scrollable body

**Usage:**
```tsx
<AdminLayout
  title="Announcements"
  subtitle="Manage parish announcements"
  navbarActions={<Button>New Announcement</Button>}
>
  {/* Page content */}
</AdminLayout>
```

## Dashboard Components

### SummaryCard

**File:** `components/dashboard/summary-card.tsx`

Metric display card for dashboard.

**Props:**
- `title`: string - Card title
- `value`: string | number - Main value
- `description`: string (optional)
- `icon`: React.ReactNode (optional)
- `trend`: { value: number; direction: 'up' | 'down' } (optional)

**Usage:**
```tsx
<SummaryCard
  title="Total Announcements"
  value={42}
  description="Active announcements"
  icon="📢"
  trend={{ value: 12, direction: "up" }}
/>
```

### RecentActivity

**File:** `components/dashboard/recent-activity.tsx`

Activity log component.

**Features:**
- Displays last 5 actions
- Shows actor, action, and timestamp
- Formats timestamps ("2m ago", "1h ago")
- Optional action details

## Feature Components

### Landing Page Sections

Located in `/components/landing/`:

#### HeroSection (`hero.tsx`)
- Main headline with description
- CTA buttons for app downloads
- Decorative background shapes

#### FeaturesSection (`features.tsx`)
- 6 feature cards
- Icons and descriptions
- Grid layout

#### HowItWorksSection (`how-it-works.tsx`)
- 3-step process
- Numbered steps
- Connecting lines on desktop

#### MissionSection (`mission.tsx`)
- Mission statement
- 3-column value propositions
- Quote section

#### CTASection (`cta.tsx`)
- Call-to-action heading
- Download buttons
- Admin login link

#### Footer (`footer.tsx`)
- 4-column footer layout
- Navigation links
- Social links
- Copyright info

## Styling Patterns

### Color Usage

**Semantic Color Classes:**
- `bg-primary text-primary-foreground` - Primary actions
- `bg-secondary text-secondary-foreground` - Secondary actions
- `bg-destructive text-destructive-foreground` - Dangerous actions
- `bg-success text-success-foreground` - Success states
- `bg-warning text-warning-foreground` - Warning states
- `bg-muted text-muted-foreground` - Muted/disabled states

### Spacing

All components use 4px-based spacing scale:
- `p-2`, `p-4`, `p-6`, `p-8` - Padding
- `m-2`, `m-4`, `m-6`, `m-8` - Margin
- `gap-2`, `gap-4`, `gap-6`, `gap-8` - Gaps

### Responsive Classes

- `md:grid-cols-2` - 2 columns on tablet+
- `lg:grid-cols-3` - 3 columns on desktop+
- `hidden md:flex` - Hidden on mobile, visible on tablet+

## Component Best Practices

### Creating New Components

1. **Type Safety**: Always use TypeScript interfaces for props
2. **Composition**: Break components into smaller, reusable pieces
3. **Consistency**: Use existing colors and spacing
4. **Accessibility**: Use semantic HTML and ARIA labels
5. **Documentation**: Add comments explaining complex logic

### Example New Component

```tsx
interface MyComponentProps {
  title: string
  description?: string
  onAction?: () => void
}

export function MyComponent({
  title,
  description,
  onAction,
}: MyComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
      <CardFooter>
        <Button onClick={onAction}>Action</Button>
      </CardFooter>
    </Card>
  )
}
```

### Component File Organization

```
components/
├── ui/                 # Base UI components
│   ├── button-custom.tsx
│   ├── input-custom.tsx
│   └── ...
├── layout/            # Layout components
│   ├── sidebar.tsx
│   ├── navbar.tsx
│   └── admin-layout.tsx
├── dashboard/         # Dashboard-specific
│   ├── summary-card.tsx
│   └── recent-activity.tsx
├── landing/           # Landing page sections
│   ├── hero.tsx
│   └── ...
└── [feature]/         # Feature-specific components
    └── my-component.tsx
```

## Accessibility

All components include:

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus visible states
- Color contrast compliance (WCAG AA)
- Screen reader friendly text

## Performance Considerations

- Components use React.forwardRef for ref forwarding
- No unnecessary re-renders with proper props
- SVG icons are inlined (no image requests)
- Minimal component nesting
- Proper event delegation
