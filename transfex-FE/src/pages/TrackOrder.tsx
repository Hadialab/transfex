import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, MapPin, Calendar, Clock, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Timeline } from '../components/shipments/Timeline';
import { api, ApiError } from '../lib/apiClient';
import { formatDate } from '../utils/helpers';
import type { ShipmentStatus, StatusEvent } from '../types';

interface PublicTracking {
  orderId: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
  actualDelivery?: string;
  statusHistory: StatusEvent[];
}

export default function TrackOrder() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<PublicTracking | null | 'not_found'>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const code = query.trim();
    if (!code || loading) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await api.getPublic<PublicTracking>(
        `/api/track/${encodeURIComponent(code)}`
      );
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setResult('not_found');
      } else {
        // Network or 5xx - show a generic error rather than a false "not found".
        setResult('not_found');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen mesh-bg">
      <div className="max-w-3xl mx-auto px-4 py-12 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-brand-500/30">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            Track Your <span className="gradient-text">Shipment</span>
          </h1>
          <p className="text-slate-400 text-sm lg:text-base max-w-md mx-auto">
            Enter your order ID or tracking number to see your shipment status.
            Look for it in your confirmation message.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Enter order ID (e.g., TFX-1001)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/80 border border-slate-700/50 text-base text-white placeholder:text-slate-500 outline-none focus:border-brand-500/50 focus:shadow-lg focus:shadow-brand-500/10 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-violet-600 text-base font-medium text-white hover:shadow-lg hover:shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                'Track'
              )}
            </button>
          </div>
        </motion.form>

        <AnimatePresence mode="wait">
          {result === 'not_found' && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <Package className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Order Not Found</h2>
              <p className="text-sm text-slate-400">
                We couldn't find an order with ID "{query}". Please double-check and try again.
              </p>
            </motion.div>
          )}

          {result && result !== 'not_found' && (
            <motion.div
              key="found"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">{result.orderId}</h2>
                    <p className="text-sm text-slate-400 mt-1">Order status</p>
                  </div>
                  <StatusBadge status={result.status} size="lg" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-800/30">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-wider">
                        {result.actualDelivery ? 'Delivered' : 'Estimated Delivery'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {formatDate(result.actualDelivery ?? result.estimatedDelivery)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/30">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-wider">Last Update</span>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {result.statusHistory.length > 0
                        ? formatDate(
                            result.statusHistory[result.statusHistory.length - 1].timestamp
                          )
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-white mb-6">Shipment Journey</h3>
                <Timeline events={result.statusHistory} currentStatus={result.status} />
              </div>

              <div className="glass-card p-6 text-center">
                <p className="text-sm text-slate-400 mb-3">Need help with your order?</p>
                <a
                  href="https://wa.me/96171000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Contact TransFex on WhatsApp
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}