# St. Kizito Sanctuary Portal

The administrative backbone and public face of St. Kizito Parish. A high-performance web platform built with Next.js 16, featuring a premium landing page and a secure, enterprise-grade administrative dashboard.

## 🌐 Overview

The Web application serves two distinct purposes:
1. **Public Engagement**: A high-conversion landing page that showcases the digital features of the parish and drives mobile app downloads.
2. **Parish Management**: A secure, module-based dashboard where administrators manage the liturgical and operational data that powers the entire ecosystem.

## ✨ Features (Web-Only)

- **Premium Landing Page**: Interactive hero sections, feature showcases, and mission-driven storytelling with smooth animations.
- **Admin Dashboard**: Real-time metrics and activity logs for parish operations.
- **Management Modules**:
    - **Mass Bookings**: Approval workflow for intentions and seating.
    - **Events Management**: Capacity tracking and registration oversight.
    - **Announcement Portal**: Multi-channel communication manager.
    - **Mass Times**: Dynamic scheduling of liturgical celebrations.
    - **User Management**: Role-based access control (RBAC) for parish staff.

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (PostCSS integration)
- **UI Components**: Radix UI Primitives (Headless)
- **Icons**: Lucide React
- **Authentication**: Supabase Auth (`@supabase/ssr`)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion (Landing page)
- **Analytics**: Vercel Analytics

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in `apps/web/`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 3. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

## 📁 Project Structure (Local)

```text
apps/web/
├── app/
│   ├── (public)/       # Landing page and public routes
│   ├── admin/          # Admin dashboard (Announcements, Events, etc.)
│   └── api/            # Server-side API routes
├── components/
│   ├── ui/             # Radix-based UI system
│   ├── dashboard/      # Admin-specific modules
│   └── landing/        # Landing page sections
├── lib/                # Shared utilities and Supabase client
└── styles/             # Global CSS with Tailwind v4 tokens
```

## 🚀 Deployment

The application is optimized for **Vercel**.
- **Edge Runtime**: Used for API routes where possible for minimal latency.
- **ISR (Incremental Static Regeneration)**: Applied to the landing page and public schedules for maximum performance while maintaining data freshness.

## 🔍 SEO & Routing

- **Semantic HTML5**: Native use of `<section>`, `<article>`, and `<nav>` for accessibility and search ranking.
- **Metadata API**: Dynamic meta tag generation for every administrative and public route.
- **App Router**: Optimized routing with layouts that prevent unnecessary re-renders during dashboard navigation.
