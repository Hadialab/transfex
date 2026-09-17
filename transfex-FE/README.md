# TransFex — Shipment Tracking Dashboard

A full-featured shipment tracking dashboard built for managing international orders from China and Dubai to Lebanon. Built with React, TypeScript, and modern tooling.

![TransFex Dashboard](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss) ![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat&logo=vite)

---

## Features

- **Dashboard** — Live summary cards, activity feed, shipment overview with animated counters
- **Shipment Management** — Filterable/sortable table, status badges, CSV export, pagination
- **Shipment Detail** — Animated timeline stepper, notes system, status updates, WhatsApp customer link
- **New Shipment Form** — 4-step multi-page form with validation and platform selector
- **Customer Portal** — Public order tracking page (no login required)
- **Analytics** — Platform breakdown, status donut chart, volume trends, delivery time metrics
- **Customer Management** — Master-detail layout with order history
- **AI Assistant** — Powered by Groq (Llama 3.3 70B), has full context on all shipments
- **Dark / Light Mode** — Smooth theme toggle, dark by default
- **Fully Responsive** — Works on mobile and desktop

---

## Tech Stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + Framer Motion |
| State | Zustand (with localStorage persistence) |
| Charts | Recharts |
| Icons | Lucide React |
| AI | Groq API (Llama 3.3 70B) |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |

---

## Getting Started

```bash
# Install dependencies
npm install

# Add your Groq API key
echo "VITE_GROQ_API_KEY=your_key_here" > .env

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Project Structure

```
src/
├── components/
│   ├── layout/        # Sidebar, Header, PageContainer
│   ├── shipments/     # Timeline, StatusBadge
│   └── ui/            # AnimatedCounter, PlatformLogo, Skeleton
├── pages/             # Dashboard, Shipments, Analytics, etc.
├── stores/            # Zustand stores (shipments, customers, theme)
├── services/          # Groq AI service
├── data/              # Mock seed data
├── types/             # TypeScript interfaces
└── utils/             # Helpers, date formatting, cn()
```

---

## Deployment

Deploy free on Vercel:

```bash
npx vercel
```

No backend required — data persists in localStorage.
