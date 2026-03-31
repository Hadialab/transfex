import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Phone,
  MapPin,
  Package,
  DollarSign,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { useCustomerStore } from '../stores/customerStore';
import { useShipmentStore } from '../stores/shipmentStore';
import { cn } from '../utils/cn';
import { formatDate, formatCurrency, timeAgo } from '../utils/helpers';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { StatusBadge } from '../components/ui/StatusBadge';

export default function Customers() {
  const customers = useCustomerStore((s) => s.customers);
  const shipments = useShipmentStore((s) => s.shipments);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const selected = selectedId ? customers.find((c) => c.id === selectedId) : null;
  const selectedShipments = selectedId ? shipments.filter((s) => s.customerId === selectedId) : [];

  const totalCustomerValue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const avgOrders = Math.round(customers.reduce((acc, c) => acc + c.totalOrders, 0) / customers.length);

  return (
    <PageContainer title="Customers" subtitle={`${customers.length} registered customers`}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Customers', value: customers.length, icon: Users, gradient: 'from-brand-500 to-violet-500' },
          { label: 'Total Revenue', value: totalCustomerValue, icon: DollarSign, gradient: 'from-emerald-500 to-teal-500', prefix: '$' },
          { label: 'Avg Orders', value: avgOrders, icon: Package, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Active Shipments', value: shipments.filter((s) => s.status !== 'delivered').length, icon: Package, gradient: 'from-amber-500 to-orange-500' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="glass-card-hover p-4"
          >
            <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', stat.gradient)}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <AnimatedCounter value={stat.value} prefix={stat.prefix} className="text-xl font-bold text-white block" />
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-800/50">
            {filtered.map((customer, idx) => (
              <motion.button
                key={customer.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setSelectedId(customer.id)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-slate-800/30',
                  selectedId === customer.id && 'bg-brand-500/5 border-l-2 border-l-brand-500'
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                  {customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{customer.name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {customer.city}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-white">{customer.totalOrders} orders</p>
                  <p className="text-xs text-slate-400">{formatCurrency(customer.totalSpent)}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Customer Detail Sidebar */}
        <div className="glass-card p-5 h-fit sticky top-20">
          {selected ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={selected.id}>
              <div className="text-center mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-lg shadow-brand-500/20">
                  {selected.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <h3 className="text-lg font-semibold text-white">{selected.name}</h3>
                <p className="text-sm text-slate-400">{selected.city}</p>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-300">{selected.phone}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-300">{selected.address}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30">
                  <Package className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-300">{selected.totalOrders} orders · {formatCurrency(selected.totalSpent)}</span>
                </div>
              </div>

              <a
                href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2 mb-5"
              >
                <ExternalLink className="w-4 h-4" /> WhatsApp
              </a>

              <h4 className="text-sm font-semibold text-slate-400 mb-3">Order History</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedShipments.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No shipments found</p>
                ) : (
                  selectedShipments.map((s) => (
                    <Link
                      key={s.id}
                      to={`/shipments/${s.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors group"
                    >
                      <div>
                        <p className="text-xs font-medium text-white group-hover:text-brand-400">{s.orderId}</p>
                        <p className="text-[10px] text-slate-500">{formatDate(s.createdAt)}</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Select a customer to view details</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
