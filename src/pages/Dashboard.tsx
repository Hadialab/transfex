import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  MapPin,
  Activity,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { PlatformLogo } from '../components/ui/PlatformLogo';
import { useShipmentStore } from '../stores/shipmentStore';
import { mockActivities } from '../data/mockData';
import { cn } from '../utils/cn';
import { timeAgo, formatCurrency, originConfig } from '../utils/helpers';
import type { ShipmentStatus } from '../types';

const statCards = [
  { key: 'total', label: 'Total Active', icon: Package, gradient: 'from-brand-500 to-violet-500', shadow: 'shadow-brand-500/20' },
  { key: 'pending', label: 'Pending', icon: Clock, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
  { key: 'in_transit', label: 'In Transit', icon: Truck, gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
  { key: 'flagged', label: 'Flagged', icon: AlertTriangle, gradient: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/20' },
] as const;

const activityIcons = {
  status_change: Activity,
  new_order: Package,
  delivery: CheckCircle,
  customs: MapPin,
  flagged: AlertTriangle,
};

const activityColors = {
  status_change: 'text-blue-400 bg-blue-400/10',
  new_order: 'text-brand-400 bg-brand-400/10',
  delivery: 'text-emerald-400 bg-emerald-400/10',
  customs: 'text-orange-400 bg-orange-400/10',
  flagged: 'text-rose-400 bg-rose-400/10',
};

export default function Dashboard() {
  const shipments = useShipmentStore((s) => s.shipments);

  const stats = useMemo(() => {
    const active = shipments.filter((s) => s.status !== 'delivered');
    return {
      total: active.length,
      pending: shipments.filter((s) => s.status === 'pending').length,
      in_transit: shipments.filter((s) => s.status === 'in_transit').length,
      delivered: shipments.filter((s) => s.status === 'delivered').length,
      flagged: shipments.filter((s) => s.status === 'flagged').length,
      totalValue: shipments.reduce((acc, s) => acc + s.declaredValue, 0),
      chinaCount: shipments.filter((s) => s.origin === 'china').length,
      dubaiCount: shipments.filter((s) => s.origin === 'dubai').length,
    };
  }, [shipments]);

  const recentShipments = useMemo(
    () => [...shipments].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5),
    [shipments]
  );

  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="relative mb-8 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-violet-600/10 to-purple-600/20" />
        <div className="absolute inset-0 mesh-bg" />
        <div className="relative px-6 py-8 lg:px-8 lg:py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              Welcome back, <span className="gradient-text">Hadi</span>
            </h1>
            <p className="text-slate-400 text-sm lg:text-base max-w-lg">
              Here's your shipment overview. You have{' '}
              <span className="text-brand-400 font-semibold">{stats.total} active shipments</span>{' '}
              and{' '}
              <span className="text-rose-400 font-semibold">{stats.flagged} flagged</span> items needing attention.
            </p>
          </motion.div>

          <div className="flex items-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Total Value: <span className="text-white font-semibold">{formatCurrency(stats.totalValue)}</span></span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>{originConfig.china.flag} China: <span className="text-white font-medium">{stats.chinaCount}</span></span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>{originConfig.dubai.flag} Dubai: <span className="text-white font-medium">{stats.dubaiCount}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof typeof stats] as number;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="glass-card-hover p-5 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                  card.gradient, card.shadow
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
              </div>
              <AnimatedCounter
                value={value}
                className="text-2xl lg:text-3xl font-bold text-white block"
              />
              <p className="text-xs text-slate-500 mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Shipments */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Recent Shipments</h2>
            <Link
              to="/shipments"
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentShipments.map((shipment, idx) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/shipments/${shipment.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/50 transition-all group"
                >
                  <PlatformLogo platform={shipment.platform} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{shipment.orderId}</span>
                      <span className="text-xs text-slate-500">{originConfig[shipment.origin].flag}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{shipment.customerName} · {shipment.items.length} item{shipment.items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={shipment.status} />
                    <p className="text-[10px] text-slate-500 mt-1">{timeAgo(shipment.updatedAt)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-5">Activity Feed</h2>
          <div className="space-y-4">
            {mockActivities.slice(0, 8).map((activity, idx) => {
              const Icon = activityIcons[activity.type];
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={`/shipments/${activity.shipmentId}`}
                    className="flex gap-3 group"
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      activityColors[activity.type]
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                        {activity.message}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">{timeAgo(activity.timestamp)}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
