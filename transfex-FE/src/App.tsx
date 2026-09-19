import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { RequireAuth, RedirectIfAuthed } from './components/auth/RouteGuards';
import { useThemeStore } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';
import { useCustomerStore } from './stores/customerStore';
import { useShipmentStore } from './stores/shipmentStore';
import { useNotificationStore } from './stores/notificationStore';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Shipments = lazy(() => import('./pages/Shipments'));
const ShipmentDetail = lazy(() => import('./pages/ShipmentDetail'));
const NewShipment = lazy(() => import('./pages/NewShipment'));
const Customers = lazy(() => import('./pages/Customers'));
const Analytics = lazy(() => import('./pages/Analytics'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Settings = lazy(() => import('./pages/Settings'));
const AiAssistant = lazy(() => import('./pages/AiAssistant'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

/** Sidebar + header chrome. Only rendered for signed-in users. */
function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchCustomers = useCustomerStore((s) => s.fetchCustomers);
  const fetchShipments = useShipmentStore((s) => s.fetchShipments);
  const shipmentsLoaded = useShipmentStore((s) => s.loaded);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (!shipmentsLoaded) fetchShipments();
  }, [shipmentsLoaded, fetchShipments]);

  useEffect(() => {
    // No `loaded` guard - the bell should refresh on every layout mount so
    // notifications from another session don't linger.
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 mesh-bg">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const isDark = useThemeStore((s) => s.isDark);
  const initializing = useAuthStore((s) => s.initializing);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#020617' : '#ffffff');
  }, [isDark]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (initializing) {
    return (
      <div className="h-screen bg-slate-950 mesh-bg">
        <PageLoader />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="h-screen bg-slate-950 mesh-bg"><PageLoader /></div>}>
        <Routes>
          {/* Signed out */}
          <Route element={<RedirectIfAuthed />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Public - no auth, no dashboard chrome.
              Deliberately outside RequireAuth: a visitor with an order ID
              must be able to reach this without an account. */}
          <Route path="/track" element={<TrackOrder />} />

          {/* Signed in */}
          <Route element={<RequireAuth />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/shipments" element={<Shipments />} />
              <Route path="/shipments/new" element={<NewShipment />} />
              <Route path="/shipments/:id" element={<ShipmentDetail />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/ai" element={<AiAssistant />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}