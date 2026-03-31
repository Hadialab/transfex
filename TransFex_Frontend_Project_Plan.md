# TransFex — Shipment Tracking Dashboard

A React-based web dashboard for managing and tracking international shipments from suppliers in China and Dubai. Built to reflect real workflows from the TransFex shipping business.

---

## Concept

TransFex customers place orders from platforms like Trendyol, Shein, AliExpress, and Alibaba. This dashboard gives both the business operator and customers a clean interface to track shipments end-to-end — from supplier pickup to final delivery in Lebanon.

---

## Core Features

### Phase 1 — Shipment Tracker (MVP)

**1. Dashboard Home**
- Summary cards: total active shipments, pending, in-transit, delivered, flagged
- Recent activity feed (e.g., "Order #1042 cleared customs")
- Quick-search bar to find shipments by order ID, customer name, or tracking number

**2. Shipment List View**
- Filterable/sortable table of all shipments
- Columns: Order ID, Customer, Source Platform (Trendyol/Shein/AliExpress/Alibaba), Origin (China/Dubai), Status, ETA, Last Updated
- Status badges with color coding: Pending, Picked Up, In Transit, Customs, Out for Delivery, Delivered
- Pagination and bulk actions (mark as delivered, export CSV)

**3. Shipment Detail Page**
- Timeline/stepper showing the shipment journey: Ordered → Picked Up → In Transit → Customs → Out for Delivery → Delivered
- Order info: items, weight, dimensions, declared value
- Customer info: name, phone, delivery address
- Supplier info: platform, supplier name, origin country
- Notes section for internal comments (e.g., "Customer requested evening delivery")
- Action buttons: Update Status, Contact Customer, Flag Issue

**4. Add New Shipment Form**
- Multi-step form: Customer Details → Order Details → Shipping Info → Review & Submit
- Platform selector with logos (Trendyol, Shein, AliExpress, Alibaba, Other)
- Auto-calculated estimated delivery based on origin country
- Form validation with helpful error messages

### Phase 2 — Customer & Business Tools

**5. Customer Portal (separate view)**
- Customer enters their order ID or phone number to track their shipment
- Public-facing, minimal UI — just the timeline and ETA
- No login required (lookup by order ID + phone)

**6. Analytics Page**
- Shipments by platform (bar chart)
- Shipments by status (donut chart)
- Monthly volume trends (line chart)
- Average delivery time by origin (China vs. Dubai)
- Revenue summary (if pricing data is available)

**7. Customer Management**
- List of all customers with order history
- Contact info, total orders, lifetime value
- Quick action: send WhatsApp message (link integration)

### Phase 3 — Polish & Extras

**8. Notifications Panel**
- In-app notification bell with dropdown
- Alerts for: shipment status changes, customs delays, delivery confirmations
- Mark as read / clear all

**9. Settings Page**
- Business profile (name, logo, contact)
- Default shipping rates by origin
- Status workflow customization
- User management (admin vs. staff roles)

**10. Dark Mode & Responsive Design**
- Full mobile responsiveness (customers will check on phones)
- Dark/light theme toggle
- PWA-ready for mobile home screen install

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React 18 + TypeScript | Matches Hadi's existing skills (React Native + TS) |
| Routing | React Router v6 | Standard for SPAs |
| Styling | Tailwind CSS | Fast prototyping, utility-first, great docs |
| State Management | Zustand | Lightweight, minimal boilerplate |
| Data Fetching | TanStack Query (React Query) | Caching, loading states, error handling |
| Forms | React Hook Form + Zod | Validation with TypeScript integration |
| Charts | Recharts | Simple, React-native charting |
| Icons | Lucide React | Clean, consistent icon set |
| Mock API | MSW (Mock Service Worker) | Realistic API mocking during development |
| Build Tool | Vite | Fast dev server, quick builds |

---

## Project Structure

```
transfex-dashboard/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/              # Logos, images
│   ├── components/
│   │   ├── ui/              # Reusable: Button, Badge, Card, Modal, Input
│   │   ├── layout/          # Sidebar, Header, PageContainer
│   │   ├── shipments/       # ShipmentCard, ShipmentTable, StatusBadge, Timeline
│   │   ├── forms/           # NewShipmentForm, CustomerForm
│   │   └── charts/          # PlatformChart, StatusDonut, VolumeLineChart
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Shipments.tsx
│   │   ├── ShipmentDetail.tsx
│   │   ├── NewShipment.tsx
│   │   ├── Customers.tsx
│   │   ├── Analytics.tsx
│   │   ├── TrackOrder.tsx    # Public customer portal
│   │   └── Settings.tsx
│   ├── hooks/               # useShipments, useCustomers, useAnalytics
│   ├── stores/              # Zustand stores
│   ├── services/            # API service layer
│   ├── mocks/               # MSW handlers + seed data
│   ├── types/               # TypeScript interfaces
│   ├── utils/               # Helpers (date formatting, status colors, ETA calc)
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## Data Models

### Shipment
```typescript
interface Shipment {
  id: string;
  orderId: string;
  customerId: string;
  platform: "trendyol" | "shein" | "aliexpress" | "alibaba" | "other";
  origin: "china" | "dubai";
  status: ShipmentStatus;
  items: OrderItem[];
  weight: number;           // kg
  declaredValue: number;    // USD
  trackingNumber?: string;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
  statusHistory: StatusEvent[];
}

type ShipmentStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "customs"
  | "out_for_delivery"
  | "delivered"
  | "flagged";

interface StatusEvent {
  status: ShipmentStatus;
  timestamp: Date;
  note?: string;
}
```

### Customer
```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  totalOrders: number;
  createdAt: Date;
}
```

### OrderItem
```typescript
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  url?: string;
}
```

---

## Implementation Roadmap

### Week 1 — Foundation
- [ ] Scaffold project with Vite + React + TypeScript + Tailwind
- [ ] Set up project structure, routing, and layout components (Sidebar, Header)
- [ ] Build reusable UI components: Button, Badge, Card, Input, Modal
- [ ] Define TypeScript interfaces for all data models
- [ ] Set up MSW with mock data (15-20 sample shipments, 8-10 customers)

### Week 2 — Core Shipment Features
- [ ] Dashboard page with summary cards and activity feed
- [ ] Shipment list page with filtering, sorting, and search
- [ ] StatusBadge component with color coding
- [ ] Shipment detail page with timeline stepper
- [ ] Status update functionality from the detail page

### Week 3 — Forms & Customer Portal
- [ ] Multi-step "Add New Shipment" form with validation
- [ ] Platform selector with brand logos
- [ ] Customer portal (TrackOrder page) — public tracking by order ID
- [ ] Customer list page with order history

### Week 4 — Analytics & Polish
- [ ] Analytics page with Recharts (platform breakdown, status donut, volume trend)
- [ ] Notifications panel
- [ ] Dark mode toggle
- [ ] Mobile responsive pass on all pages
- [ ] Final cleanup, code review, README with screenshots

---

## Mock Data Strategy

Since this is a frontend project, all data is mocked with MSW. This means:
- The app behaves like it has a real API (fetch calls, loading states, error handling)
- Switching to a real backend later requires only changing the API base URL
- Demo-ready at any time without a server

Sample seed data should include realistic scenarios: shipments in various statuses, a few flagged with customs issues, mix of platforms and origins, customers with varying order counts.

---

## Stretch Goals (if time allows)
- WhatsApp deep-link integration for customer messaging
- PDF export for shipment receipts
- Drag-and-drop Kanban board view for shipments by status
- Arabic language toggle (RTL support)
- Barcode/QR code generation for each shipment

---

## Portfolio Value

This project demonstrates:
- **Real-world domain knowledge** from running TransFex
- **React + TypeScript** proficiency
- **State management** and **data fetching** patterns
- **Form handling** with validation
- **Data visualization** with charts
- **Responsive design** and **UI/UX** sensibility
- **Clean architecture** with separation of concerns
