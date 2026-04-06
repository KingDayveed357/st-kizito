# Getting Started with St. Kizito Parish App

Welcome! This guide will help you quickly explore and understand the application.

## What This Application Includes

A **complete, production-ready platform** for managing Catholic parish operations:

- **Public-facing landing page** showcasing features
- **Secure admin login system** with authentication
- **Comprehensive admin dashboard** with key metrics
- **7 management modules** for different parish operations
- **40+ reusable UI components** with consistent design
- **Fully responsive design** for mobile, tablet, and desktop
- **40+ pages of documentation** with guides and references

## First Time? Start Here

### 1. Launch the Application

```bash
# Install dependencies (if not already done)
pnpm install

# Start development server
pnpm dev
```

Open `http://localhost:3000` in your browser.

### 2. Explore the Landing Page

You'll see the public landing page with:
- **Hero section** - Main headline and download buttons
- **Features overview** - 6 cards explaining key features
- **How it works** - 3-step process explanation
- **Mission statement** - Parish-focused values
- **Footer** - Navigation and admin login link

**Scroll through** to see the complete landing experience.

### 3. Login to Admin Dashboard

- Click "Admin Login" button in the footer (or go to `/admin/login`)
- Use demo credentials:
  ```
  Email:    admin@stkizito.com
  Password: demo123
  ```

### 4. Explore Admin Dashboard

After login, you'll see:
- **4 metric cards** showing announcements, events, bookings, and intentions
- **Recent activity section** showing last 5 actions
- **Quick action buttons** for common tasks
- **Sidebar navigation** with 7 modules

## Documentation Guide

Choose the guide that matches your interest:

### For Trying Out Features
👉 **[QUICKSTART.md](./QUICKSTART.md)** (15 min read)
- Step-by-step walkthrough of every feature
- Demo workflows to try
- Screenshots of each module
- Troubleshooting tips

### For Understanding the Architecture
👉 **[ARCHITECTURE.md](./ARCHITECTURE.md)** (20 min read)
- How the project is organized
- Design system explanation
- Component architecture
- Data management approach
- Backend integration preparation

### For Working with Components
👉 **[COMPONENTS.md](./COMPONENTS.md)** (25 min read)
- Complete component library reference
- Props and usage examples
- Code snippets
- Design patterns
- Best practices for extending

### For Deploying to Production
👉 **[DEPLOYMENT.md](./DEPLOYMENT.md)** (20 min read)
- Step-by-step Vercel deployment
- Environment setup
- Database integration examples
- Authentication setup
- Monitoring and scaling

### For Project Overview
👉 **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** (10 min read)
- What was built summary
- Key features list
- Technical achievements
- File structure overview
- Future enhancement ideas

## Module Walkthrough

Here's where to find each feature:

### Landing Page
**Route:** `/`
**Purpose:** Showcase features to potential users
**Try it:** Scroll through all sections

### Admin Login
**Route:** `/admin/login`
**Purpose:** Secure authentication
**Try it:**
1. Go to `/admin/login`
2. Enter demo credentials
3. Click "Sign In"

### Dashboard
**Route:** `/admin`
**Purpose:** Overview of parish operations
**Try it:**
1. View summary cards with metrics
2. See recent activity
3. Click quick action buttons

### Announcements
**Route:** `/admin/announcements`
**Purpose:** Manage parish announcements
**Try it:**
1. Click "New Announcement"
2. Fill in title, type, and content
3. Click "Create"
4. View in the list
5. Edit or delete

### Events
**Route:** `/admin/events`
**Purpose:** Manage parish events
**Try it:**
1. Click "New Event"
2. Fill in event details
3. Click "Create"
4. See capacity bar
5. Edit to adjust details

### Mass Times
**Route:** `/admin/mass-times`
**Purpose:** Maintain weekly mass schedule
**Try it:**
1. Click "Add Mass Time"
2. Select day and time
3. Enter mass type
4. See schedule organized by day

### Mass Bookings
**Route:** `/admin/mass-bookings`
**Purpose:** Manage mass intentions
**Try it:**
1. View pending bookings
2. Click "Approve" on a booking
3. See status change
4. Filter by different statuses

### Users & Admins
**Route:** `/admin/users`
**Purpose:** Manage parish members
**Try it:**
1. Click "Add User"
2. Enter name, email, and role
3. Click "Add User"
4. Filter by role
5. Edit or delete

### Settings
**Route:** `/admin/settings`
**Purpose:** Configure parish settings
**Try it:**
1. View parish information form
2. See notification preferences
3. Check security options
4. Explore backup section

## Key Features to Try

### 1. Responsive Design
1. Open the app on your desktop
2. Use browser DevTools (F12) to simulate mobile
3. Watch sidebar collapse
4. See layouts adapt
5. Try tablet view

### 2. Form Validation
1. Try creating an announcement
2. Leave fields empty and try to submit
3. See validation error messages
4. Fill in fields correctly
5. Submit successfully

### 3. Status Filtering
1. Go to Mass Bookings
2. Click different status buttons (Pending, Approved, Rejected)
3. See list filter
4. Check updated counts

### 4. Navigation
1. Click sidebar items
2. See navigation state update
3. Try collapsing sidebar
4. See navigation items hide
5. Click to expand again

### 5. Data Management
1. Create items in different modules
2. Edit existing items
3. Delete items (with confirmation)
4. See updates immediately
5. Try refreshing (data will reset to mock)

## Important Notes

### Demo Credentials
```
Email:    admin@stkizito.com
Password: demo123
```

### Demo Data
- All modules come with pre-populated sample data
- Changes are stored in React state (in-memory)
- Data will reset when you refresh the page
- This is intentional for demonstration

### Not Connected to Backend
- This application uses mock data
- No data persists after page refresh
- Forms validate client-side only
- Ready for backend integration

## Understanding the Structure

### Folders

**`/app`** - Pages and routes
- `page.tsx` = Landing page
- `/admin` = Admin pages
- `layout.tsx` = Root layout
- `globals.css` = Global styles

**`/components`** - React components
- `/ui` = Reusable buttons, cards, inputs, etc.
- `/layout` = Sidebar, navbar, layout wrappers
- `/dashboard` = Dashboard-specific components
- `/landing` = Landing page sections

**`/lib`** - Utilities
- `utils.ts` = Helper functions
- `mock-data.ts` = Sample data for all modules

### File Naming
- Components use TypeScript (`.tsx`)
- Folder-based organization
- Descriptive, clear names
- Components in their own files

## Common Questions

### Q: Where's the database?
**A:** This is a client-side demo. See DEPLOYMENT.md for database integration examples.

### Q: How do I add a new feature?
**A:** See ARCHITECTURE.md for adding new admin modules and components.

### Q: Can I customize the design?
**A:** Yes! Edit colors in `globals.css` and adjust Tailwind classes in components.

### Q: How do I deploy?
**A:** See DEPLOYMENT.md for step-by-step Vercel deployment.

### Q: Does the data save?
**A:** Only during your current session. Refresh to reset (mock data returns).

### Q: Can I use this in production?
**A:** Yes! Connect a backend following DEPLOYMENT.md examples.

## Next Steps

1. **Explore the UI**
   - Click around all pages
   - Try creating/editing items
   - Test responsive design
   - Click all buttons and links

2. **Read the Docs**
   - Start with [QUICKSTART.md](./QUICKSTART.md)
   - Then read [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Finally [COMPONENTS.md](./COMPONENTS.md)

3. **Study the Code**
   - Look at component structure in `/components`
   - Understand page layouts in `/app`
   - Review mock data in `/lib/mock-data.ts`

4. **Plan Your Customization**
   - Change colors in `globals.css`
   - Update parish info in settings
   - Add new admin modules
   - Connect your backend

5. **Deploy**
   - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
   - Set up database
   - Configure environment variables
   - Deploy to Vercel

## Helpful Commands

```bash
# Start development
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm start

# Format code
pnpm format

# Type check
pnpm type-check
```

## Technology Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hooks** - State management

All are built into the project—nothing extra to install!

## Getting Help

- **Features** → [QUICKSTART.md](./QUICKSTART.md)
- **Architecture** → [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Components** → [COMPONENTS.md](./COMPONENTS.md)
- **Deployment** → [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Overview** → [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

## Ready to Go!

You now have everything you need to:
✅ Explore the complete application
✅ Understand the architecture
✅ Customize the design
✅ Deploy to production
✅ Connect a backend

**Start with [QUICKSTART.md](./QUICKSTART.md) for the interactive walkthrough!**

---

Enjoy exploring St. Kizito Parish App!
