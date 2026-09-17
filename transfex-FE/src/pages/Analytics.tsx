import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend,
} from 'recharts';
import { TrendingUp, Package, Clock, DollarSign, Truck } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { useShipmentStore } from '../stores/shipmentStore';
import { cn } from '../utils/cn';
import { platformConfig, statusConfig, formatCurrency } from '../utils/helpers';
import type { Platform, ShipmentStatus } from '../types';

const COLORS = ['#818cf8', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];
const STATUS_COLORS: Record<ShipmentStatus, string> = {
  pending: '#f59e0b',
  picked_up: '#3b82f6',
  in_transit: '#818cf8',
  customs: '#f97316',
  out_for_delivery: '#8b5cf6',
  delivered: '#10b981',
  flagged: '#f43f5e',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const shipments = useShipmentStore((s) => s.shipments);

  const platformData = useMemo(() => {
    const counts: Record<string, number> = {};
    shipments.forEach((s) => {
      const label = platformConfig[s.platform].label;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [shipments]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    shipments.forEach((s) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: statusConfig[status as ShipmentStatus].label,
      value,
      color: STATUS_COLORS[status as ShipmentStatus],
    }));
  }, [shipments]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; china: number; dubai: number; total: number }> = {};
    shipments.forEach((s) => {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      if (!months[key]) months[key] = { month: label, china: 0, dubai: 0, total: 0 };
      months[key][s.origin]++;
      months[key].total++;
    });
    return Object.values(months).slice(-6);
  }, [shipments]);

  const deliveryTimes = useMemo(() => {
    const delivered = shipments.filter((s) => s.actualDelivery);
    const chinaDelivered = delivered.filter((s) => s.origin === 'china');
    const dubaiDelivered = delivered.filter((s) => s.origin === 'dubai');

    const avgDays = (list: typeof delivered) => {
      if (!list.length) return 0;
      const total = list.reduce((acc, s) => {
        const created = new Date(s.createdAt).getTime();
        const delivered = new Date(s.actualDelivery!).getTime();
        return acc + (delivered - created) / (1000 * 60 * 60 * 24);
      }, 0);
      return Math.round(total / list.length);
    };

    return {
      overall: avgDays(delivered),
      china: avgDays(chinaDelivered),
      dubai: avgDays(dubaiDelivered),
    };
  }, [shipments]);

  const totalValue = shipments.reduce((acc, s) => acc + s.declaredValue, 0);
  const avgValue = Math.round(totalValue / shipments.length);

  return (
    <PageContainer title="Analytics" subtitle="Insights and performance metrics">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Shipments', value: shipments.length, icon: Package, gradient: 'from-brand-500 to-violet-500' },
          { label: 'Total Value', value: totalValue, icon: DollarSign, gradient: 'from-emerald-500 to-teal-500', prefix: '$' },
          { label: 'Avg Value', value: avgValue, icon: TrendingUp, gradient: 'from-blue-500 to-cyan-500', prefix: '$' },
          { label: 'Avg Delivery', value: deliveryTimes.overall, icon: Clock, gradient: 'from-amber-500 to-orange-500', suffix: ' days' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="glass-card-hover p-5"
          >
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', stat.gradient)}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} className="text-2xl font-bold text-white block" />
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Platform Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h3 className="text-base font-semibold text-white mb-4">Shipments by Platform</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={platformData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Shipments" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-base font-semibold text-white mb-4">Shipments by Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {statusData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-slate-400 ml-1">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Volume Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 glass-card p-5">
          <h3 className="text-base font-semibold text-white mb-4">Volume by Origin</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="chinaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dubaiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="china" name="China" stroke="#818cf8" fill="url(#chinaGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="dubai" name="Dubai" stroke="#f59e0b" fill="url(#dubaiGradient)" strokeWidth={2} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-slate-400 ml-1">{value}</span>}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Delivery Times */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <h3 className="text-base font-semibold text-white mb-4">Avg Delivery Time</h3>
          <div className="space-y-5">
            {[
              { label: 'China Route', value: deliveryTimes.china, max: 25, color: 'from-brand-500 to-violet-500', icon: '🇨🇳' },
              { label: 'Dubai Route', value: deliveryTimes.dubai, max: 25, color: 'from-amber-500 to-orange-500', icon: '🇦🇪' },
            ].map((route) => (
              <div key={route.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300 flex items-center gap-2">
                    <span>{route.icon}</span> {route.label}
                  </span>
                  <span className="text-lg font-bold text-white">{route.value} days</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(route.value / route.max) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={cn('h-full rounded-full bg-gradient-to-r', route.color)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-400" /> Quick Stats
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">On-time rate</span>
                <span className="text-emerald-400 font-medium">87%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Customs delay rate</span>
                <span className="text-amber-400 font-medium">12%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Flagged rate</span>
                <span className="text-rose-400 font-medium">6%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}
