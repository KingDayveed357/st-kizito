# St. Kizito Parish App - Quick Start Guide

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will start at `http://localhost:3000`

## Exploring the Application

### 1. Public Landing Page (Route: `/`)

Visit the home page to see:
- Hero section with app download CTAs
- Features overview with 6 key capabilities
- How it works (3-step process)
- Mission statement and values
- Call-to-action sections
- Footer with links

**Key Components:**
- `components/landing/hero.tsx`
- `components/landing/features.tsx`
- `components/landing/how-it-works.tsx`
- `components/landing/mission.tsx`
- `components/landing/cta.tsx`
- `components/landing/footer.tsx`

### 2. Admin Login (Route: `/admin/login`)

Secure login page with demo credentials:

```
Email:    admin@stkizito.com
Password: demo123
```

**Features:**
- Email and password validation
- Error handling
- Loading states
- Demo credentials display
- Remember me checkbox
- Forgot password link (UI only)

### 3. Admin Dashboard (Route: `/admin`)

The main dashboard after login with:

**Summary Cards:**
- Total Announcements (with trend)
- Upcoming Events (with trend)
- Pending Mass Bookings (warning state)
- Approved Intentions (success state)

**Sections:**
- Recent Activity log (last 5 actions)
- Quick Actions sidebar (4 buttons)

### 4. Announcements Module (Route: `/admin/announcements`)

Manage parish announcements:

**Features:**
- List view with filter tabs (All, Liturgical, Parish)
- Create new announcement button
- Edit/Delete actions
- Display type badge
- Author and creation date
- Modal form for create/edit

**Try it:**
1. Click "New Announcement"
2. Fill in title, type, and content
3. Click Create
4. Filter by type using tabs
5. Edit or delete existing items

### 5. Events Module (Route: `/admin/events`)

Manage parish events:

**Features:**
- Create new events
- Display capacity and attendance
- Progress bar showing capacity %
- Warning badges for near-capacity events
- Modal form with all event details

**Try it:**
1. Click "New Event"
2. Enter event details (title, location, date, capacity)
3. Events show attendance progress
4. Edit or delete as needed

### 6. Mass Times Module (Route: `/admin/mass-times`)

Manage weekly mass schedule:

**Features:**
- Organized by day of week
- Time displayed in 12-hour format
- Mass types (Low Mass, High Mass, Sung Mass)
- Add, edit, delete times
- Grid layout for visual organization

**Try it:**
1. Click "Add Mass Time"
2. Select day and time
3. Enter mass type
4. View schedule organized by day

### 7. Mass Bookings Module (Route: `/admin/mass-bookings`)

Manage mass intentions:

**Features:**
- Table view of all bookings
- Filter by status (All, Pending, Approved, Rejected)
- Approve/Reject pending bookings
- Display booking amounts
- Summary stats at bottom

**Try it:**
1. View pending bookings
2. Click "Approve" or "Reject"
3. Filter by status
4. See updated stats

### 8. Users & Admins Module (Route: `/admin/users`)

Manage parish members:

**Features:**
- List all users
- Filter by role (Admin, Staff, Parishioner)
- Add new users
- Edit/Delete existing users
- Role badges with different colors
- Join dates

**Try it:**
1. Click "Add User"
2. Enter name, email, and role
3. Click "Add User"
4. Filter by role
5. Edit or delete users

### 9. Settings Module (Route: `/admin/settings`)

Configure parish settings:

**Features:**
- Parish information (name, email, phone, address)
- Security settings (2FA option)
- Email notification preferences
- API & Integrations
- Backup & Data management
- Danger zone actions

## Design System

### Colors

- **Primary Blue** (`#1e3a5f`): Main brand color
- **Gold Accent** (`#d4a574`): Premium accents
- **Dark Navy** (`#0f1f35`): Sidebar background
- **Light Background** (`#fafaf9`): Page background
- **Gray Neutrals**: Muted text and borders

### Responsive Breakpoints

- `sm`: 640px (mobile)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)

All pages are mobile-first responsive.

## Key Components

### UI Components (in `/components/ui/`)

- **Button**: Variants, sizes, loading states
- **Input**: Labels, validation, icons, helper text
- **Badge**: Status indicators
- **Card**: Containers with header/content/footer
- **Modal**: Dialogs for forms
- **Table**: Data tables

### Layout Components (in `/components/layout/`)

- **Sidebar**: Navigation (collapsible)
- **Navbar**: Top bar with title and actions
- **AdminLayout**: Main wrapper for admin pages

## Demo Workflows

### Complete Announcement Creation

1. Go to `/admin/announcements`
2. Click "New Announcement"
3. Enter:
   - Title: "Easter Vigil Celebration"
   - Type: "Liturgical"
   - Content: "Join us for the solemn Easter Vigil..."
4. Click "Create"
5. See new announcement in the list
6. Try editing and deleting it

### Managing Mass Bookings

1. Go to `/admin/mass-bookings`
2. View pending bookings
3. Click "Approve" on a booking
4. Watch status change and total updated
5. Filter by different statuses
6. Check stats at bottom

### Event Capacity Tracking

1. Go to `/admin/events`
2. View events with attendance bars
3. Create a new event
4. See it appear with 0% capacity
5. Edit to adjust capacity
6. Notice badge color changes based on percentage

## Mock Data

All modules come pre-populated with sample data:

- **3 announcements**: Mix of liturgical and parish
- **3 events**: Different types with various capacities
- **16 mass times**: Full weekly schedule
- **4 bookings**: Different statuses
- **5 users**: Mix of roles
- **5 activity logs**: Recent actions

## Sidebar Navigation

The sidebar is **collapsible** and shows:

- Dashboard
- Announcements
- Events
- Mass Times
- Mass Bookings
- Users & Admins
- Settings

On mobile, the sidebar automatically adapts.

## Features Showcase

### Form Validation

- Input validation with error messages
- Required fields checking
- Email format validation
- Helper text for clarity

### Status Management

- Pending (warning badge)
- Approved (success badge)
- Rejected (destructive badge)

### Responsive Tables

- Horizontal scrolling on mobile
- Proper spacing on desktop
- Action buttons aligned right

### Loading States

- Buttons show spinner during submission
- Disabled state while loading
- Smooth transitions

## Code Quality

The application demonstrates:

- **TypeScript**: Full type safety
- **Component Composition**: Modular, reusable components
- **Semantic HTML**: Accessible, proper structure
- **Tailwind CSS**: Consistent, responsive styling
- **Clean Architecture**: Separation of concerns
- **No Hardcoded Values**: Configurable theme, mock data

## Next Steps for Production

1. **Connect Backend**: Replace mock data with API calls
2. **Setup Authentication**: Implement real auth (Auth.js, Supabase)
3. **Database**: Connect to Supabase, Neon, or other DB
4. **Email Integration**: Setup email notifications
5. **Deployment**: Deploy to Vercel
6. **Custom Domain**: Configure domain
7. **SSL Certificates**: Already included with Vercel

## Troubleshooting

### "Not authenticated" after login

Clear localStorage and try again:
```javascript
localStorage.clear()
```

### Changes not showing

The app uses React state, not backend persistence. Refresh to reset.

### Sidebar not collapsing on mobile

Check browser width - should collapse at `md` breakpoint (768px).

## Support

For questions or issues, refer to:
- `ARCHITECTURE.md` - Detailed project structure
- Component files - Well-commented code
- `lib/mock-data.ts` - Data structure examples
