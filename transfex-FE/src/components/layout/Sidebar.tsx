import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Plus,
  Users,
  BarChart3,
  Search,
  Settings,
  Sparkles,
  X,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const mainNav = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/shipments', icon: Package, label: 'Shipments' },
  { path: '/shipments/new', icon: Plus, label: 'New Shipment' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const bottomNav = [
  { path: '/track', icon: Search, label: 'Track Order' },
  { path: '/ai', icon: Sparkles, label: 'AI Assistant', badge: 'AI' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/';
    if (path === '/shipments') return location.pathname === '/shipments' || (location.pathname.startsWith('/shipments/') && !location.pathname.startsWith('/shipments/new'));
    return location.pathname === path;
  }

  function NavItem({ path, icon: Icon, label, badge }: { path: string; icon: React.ElementType; label: string; badge?: string }) {
    const active = isActive(path);
    return (
      <NavLink
        to={path}
        onClick={onMobileClose}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative group',
          active
            ? 'text-white bg-white/[0.06]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
        )}
      >
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand-400"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
        <Icon className={cn(
          'w-[18px] h-[18px] shrink-0',
          active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-400'
        )} />
        {!collapsed && (
          <>
            <span>{label}</span>
            {badge && (
              <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-brand-500/15 text-brand-400 tracking-wide">
                {badge}
              </span>
            )}
          </>
        )}
        {collapsed && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700/50 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
            {label}
          </div>
        )}
      </NavLink>
    );
  }

  const sidebarContent = (
    <div className={cn(
      'flex flex-col h-full bg-slate-900/90 backdrop-blur-xl border-r border-white/[0.06]',
      collapsed ? 'w-[68px]' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="text-sm font-bold text-white tracking-tight">TransFex</span>
            <span className="text-[10px] text-slate-500 -mt-0.5 font-medium">Shipment Tracker</span>
          </motion.div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors hidden lg:flex"
        >
          <ChevronLeft className={cn('w-3.5 h-3.5 transition-transform', collapsed && 'rotate-180')} />
        </button>
        <button
          onClick={onMobileClose}
          className="ml-auto p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors lg:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pt-1 pb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
            Main
          </p>
        )}
        {mainNav.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-2.5 pb-3 space-y-0.5 border-t border-white/[0.06] pt-3">
        {!collapsed && (
          <p className="px-3 pt-0.5 pb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
            Tools
          </p>
        )}
        {bottomNav.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0 z-30 transition-all duration-300">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative h-full w-60"
          >
            {sidebarContent}
          </motion.div>
        </div>
      )}
    </>
  );
}
