import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PlatformLogo } from '../components/ui/PlatformLogo';
import { useShipmentStore } from '../stores/shipmentStore';
import { cn } from '../utils/cn';
import { formatDate, formatCurrency, originConfig, statusConfig } from '../utils/helpers';
import type { ShipmentStatus, Platform, Origin } from '../types';

const ITEMS_PER_PAGE = 8;

type SortField = 'orderId' | 'customerName' | 'createdAt' | 'status' | 'declaredValue';
type SortDir = 'asc' | 'desc';

export default function Shipments() {
  const shipments = useShipmentStore((s) => s.shipments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | ''>('');
  const [platformFilter, setPlatformFilter] = useState<Platform | ''>('');
  const [originFilter, setOriginFilter] = useState<Origin | ''>('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...shipments];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.orderId.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q) ||
          (s.trackingNumber && s.trackingNumber.toLowerCase().includes(q))
      );
    }
    if (statusFilter) result = result.filter((s) => s.status === statusFilter);
    if (platformFilter) result = result.filter((s) => s.platform === platformFilter);
    if (originFilter) result = result.filter((s) => s.origin === originFilter);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'orderId') cmp = a.orderId.localeCompare(b.orderId);
      else if (sortField === 'customerName') cmp = a.customerName.localeCompare(b.customerName);
      else if (sortField === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortField === 'declaredValue') cmp = a.declaredValue - b.declaredValue;
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [shipments, search, statusFilter, platformFilter, originFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-600" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-400" /> : <ArrowDown className="w-3 h-3 text-brand-400" />;
  }

  function exportCSV() {
    const headers = ['Order ID', 'Customer', 'Platform', 'Origin', 'Status', 'Value', 'Created', 'ETA'];
    const rows = filtered.map((s) => [
      s.orderId, s.customerName, s.platform, s.origin, s.status,
      s.declaredValue, s.createdAt, s.estimatedDelivery,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transfex-shipments.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageContainer
      title="Shipments"
      subtitle={`${filtered.length} shipment${filtered.length !== 1 ? 's' : ''} found`}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/50 text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <Link to="/shipments/new" className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-sm font-medium text-white hover:shadow-lg hover:shadow-brand-500/25 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Shipment
          </Link>
        </div>
      }
    >
      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search orders, customers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ShipmentStatus | ''); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 outline-none focus:border-brand-500/50 transition-colors appearance-none cursor-pointer min-w-[130px]"
          >
            <option value="">All Status</option>
            {Object.entries(statusConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            value={platformFilter}
            onChange={(e) => { setPlatformFilter(e.target.value as Platform | ''); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 outline-none focus:border-brand-500/50 transition-colors appearance-none cursor-pointer min-w-[130px]"
          >
            <option value="">All Platforms</option>
            <option value="aliexpress">AliExpress</option>
            <option value="shein">SHEIN</option>
            <option value="trendyol">Trendyol</option>
            <option value="alibaba">Alibaba</option>
            <option value="other">Other</option>
          </select>
          <select
            value={originFilter}
            onChange={(e) => { setOriginFilter(e.target.value as Origin | ''); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 outline-none focus:border-brand-500/50 transition-colors appearance-none cursor-pointer min-w-[110px]"
          >
            <option value="">All Origins</option>
            <option value="china">China</option>
            <option value="dubai">Dubai</option>
          </select>
          {(search || statusFilter || platformFilter || originFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPlatformFilter(''); setOriginFilter(''); setPage(1); }}
              className="px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-400/10 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {[
                  { field: 'orderId' as SortField, label: 'Order' },
                  { field: 'customerName' as SortField, label: 'Customer' },
                  { field: null, label: 'Platform' },
                  { field: null, label: 'Origin' },
                  { field: 'status' as SortField, label: 'Status' },
                  { field: 'declaredValue' as SortField, label: 'Value' },
                  { field: 'createdAt' as SortField, label: 'Created' },
                  { field: null, label: '' },
                ].map((col, i) => (
                  <th
                    key={i}
                    onClick={() => col.field && toggleSort(col.field)}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider',
                      col.field && 'cursor-pointer hover:text-white transition-colors select-none'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.field && <SortIcon field={col.field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginated.map((shipment, idx) => (
                  <motion.tr
                    key={shipment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <Link to={`/shipments/${shipment.id}`} className="text-sm font-semibold text-brand-400 hover:text-brand-300">
                        {shipment.orderId}
                      </Link>
                      {shipment.trackingNumber && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{shipment.trackingNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-white">{shipment.customerName}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <PlatformLogo platform={shipment.platform} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm">{originConfig[shipment.origin].flag} {originConfig[shipment.origin].label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={shipment.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-300">{formatCurrency(shipment.declaredValue)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-400">{formatDate(shipment.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/shipments/${shipment.id}`}
                        className="p-2 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                    p === page
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {paginated.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No shipments found</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
