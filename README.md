# St. Kizito Parish: Digital Sanctuary

A production-grade, enterprise-scale platform designed to digitalize Catholic parish operations and deepen parishioner engagement. This monorepo contains a premium mobile application for parishioners and a robust web-based sanctuary portal for administrative management.

## 🚀 Overview

The St. Kizito Parish system bridge the gap between tradition and technology, providing a unified digital experience for modern spiritual communities.

- **Problem:** Many parishes struggle with fragmented communication, manual mass booking processes, and providing accessible liturgical content to parishioners on the go.
- **Solution:** A centralized ecosystem where parishioners access daily liturgy and bookings via mobile, while administrators manage the entire parish lifecycle through a high-performance web dashboard.
- **Target Users:** Catholic parishioners, parish administrators, and church leadership.

## 🧩 System Architecture

The project is structured as a **Turborepo-ready Monorepo** using NPM Workspaces to manage shared dependencies and distinct applications.

- **Mobile Client (`/apps/mobile`)**: A high-performance Expo application serving as the primary touchpoint for parishioners. It features deep offline-first capabilities using SQLite for liturgical content.
- **Web Portal (`/apps/web`)**: A Next.js 16 application containing both a high-conversion landing page and a comprehensive administrative dashboard for data management.
- **Backend Infrastructure (`/infra`)**: Centralized Supabase integration (Database, Auth, and Storage) shared across both applications to ensure real-time synchronization.

## 📦 Applications

| Application | Path | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **Mobile App** | [`/apps/mobile`](./apps/mobile) | Expo, React Native | Parishioner engagement & Liturgy |
| **Web App** | [`/apps/web`](./apps/web) | Next.js 16, Tailwind v4 | Admin dashboard & Landing page |

## ✨ Key Features

- **Daily Liturgy & Readings**: Full access to daily Gospel and scripture readings.
- **Divine Office**: Digital implementation of the Liturgy of the Hours.
- **Mass Bookings**: Secure system for parishioners to book mass intentions and seats.
- **Offline-First Excellence**: Critical liturgical data is seeded and cached locally on mobile devices.
- **Admin Command Center**: Centralized management for announcements, events, and parish schedules.
- **Real-time Sync**: Bi-directional synchronization between the parish database and user devices.

## 🏗️ Tech Stack (High-Level)

- **Monorepo Manager**: NPM Workspaces
- **Backend-as-a-Service**: Supabase (PostgreSQL, Auth, Edge Functions)
- **UI & Logic**: TypeScript, React, Next.js, React Native
- **Styling**: Tailwind CSS (v4 for Web, NativeWind v4 for Mobile)
- **State & Data**: Zustand, TanStack Query v5

## ⚙️ Getting Started

### Prerequisites
- Node.js 20+
- NPM 10+
- Expo CLI (`npm install -g expo-cli`)

### Installation
From the root directory:
```bash
npm install
```

### Development
The root `package.json` provides convenience scripts to run the entire stack:
```bash
# Start Web development
npm run web:dev

# Start Mobile development (Metro)
npm run mobile:start
```

## 📁 Project Structure (Top-Level)

```text
.
├── apps/
│   ├── mobile/         # Parishioner Mobile App (Expo/React Native)
│   └── web/            # Admin Portal & Landing Page (Next.js 16)
├── infra/
│   └── supabase/       # SQL Schema & Backend configurations
├── design/             # Shared design assets and specifications
├── package.json        # Workspace configuration & scripts
└── tsconfig.json       # Base TypeScript configuration
```

## 🤝 Contributing

This project follows strict architectural patterns (see application-specific READMEs for domain-driven design details). Please ensure all new features include appropriate TypeScript interfaces and follow the established service-layer pattern.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.
