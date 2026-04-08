# St. Kizito Mobile: The Parishioner App

A premium, offline-first mobile experience built with Expo and React Native, designed to bring the liturgical life of St. Kizito Parish into the pockets of its parishioners.

## 📱 Overview

The mobile application serves as the "Digital Sanctuary" for the faithful. It emphasizes speed, reverence, and reliability, ensuring that daily prayers and parish updates are accessible even without an active internet connection.

## ✨ Features (Mobile-Only)

- **Daily Readings**: Beautifully typeset Gospel and scripture readings synchronized with the liturgical calendar.
- **Divine Office**: Structured prayer experience for Morning, Midday, Evening, and Night prayers.
- **Offline-First Architecture**: Uses SQLite to store liturgical data locally, ensuring 100% availability for prayer.
- **Smart Mass Bookings**: Integrated flow for requesting mass intentions with real-time status updates.
- **Parish Announcements**: Push-notification-enabled updates on parish life and community events.
- **Liturgical Calendar**: Interactive calendar highlighting feast days, seasons, and parish-specific events.

## 🏗️ Tech Stack

- **Framework**: Expo 55 (Managed Workflow)
- **Navigation**: Expo Router (File-based routing)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query v5
- **Local Database**: `expo-sqlite`
- **Backend**: Supabase (`@supabase/supabase-js`)
- **Animation**: React Native Reanimated

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in `apps/mobile/`:
```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Locally
```bash
# Start Metro bundler
npm run start

# Open in simulator
# Press 'i' for iOS or 'a' for Android
```

### 4. Development Builds (EAS)
For physical device testing with custom native modules:
```bash
eas build -p android --profile development
eas build -p ios --profile development
```

## 📁 Project Structure (Local)

```text
apps/mobile/
├── app/                # Expo Router screens (Tabs, Modals, Stacks)
├── src/
│   ├── components/     # UI Primitives & Domain components
│   ├── services/       # API (Supabase) and Offline (SQLite) layers
│   ├── hooks/          # Custom hooks for data and theme logic
│   ├── types/          # Centralized TypeScript interfaces
│   └── theme/          # Design system tokens (colors.ts, etc.)
├── data/               # Static JSON seed data for offline use
└── assets/             # Images, fonts, and splash screens
```

## 🧱 Architecture Notes

- **Service Layer Pattern**: All network requests must occur within `/src/services/api/`.
- **Theme Consistency**: UI components must use `useTheme()` for semantic color mapping to support system-wide dark/light mode transitions.
- **Data Seeding**: First launch triggers an automated SQLite seeding process from `/data/` to ensure immediate offline availability.