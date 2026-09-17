import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Scale,
  DollarSign,
  Calendar,
  Clock,
  MessageSquare,
  Send,
  Phone,
  ExternalLink,
  Ruler,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PlatformLogo } from '../components/ui/PlatformLogo';
import { Timeline } from '../components/shipments/Timeline';
import { useShipmentStore } from '../stores/shipmentStore';
import { useCustomerStore } from '../stores/customerStore';
import { cn } from '../utils/cn';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  originConfig,
  platformConfig,
  statusConfig,
  statusOrder,
} from '../utils/helpers';
import type { ShipmentStatus } from '../types';

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shipment = useShipmentStore((s) => s.getShipment(id || ''));
  const updateStatus = useShipmentStore((s) => s.updateShipmentStatus);
  const addNote = useShipmentStore((s) => s.addNote);
  const customer = useCustomerStore((s) => s.getCustomer(shipment?.customerId || ''));
  const [noteText, setNoteText] = useState('');
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  if (!shipment) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Shipment Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">The shipment you're looking for doesn't exist.</p>
          <Link to="/shipments" className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm hover:bg-brand-500 transition-colors">
            Back to Shipments
          </Link>
        </div>
      </PageContainer>
    );
  }

  function handleAddNote() {
    if (!noteText.trim()) return;
    addNote(shipment!.id, noteText, 'Admin');
    setNoteText('');
  }

  function handleStatusUpdate(newStatus: ShipmentStatus) {
    updateStatus(shipment!.id, newStatus, undefined, 'Updated manually');
    setShowStatusUpdate(false);
  }

  const nextStatuses = statusOrder.filter((s) => {
    const currentIdx = statusOrder.indexOf(shipment.status);
    const targetIdx = statusOrder.indexOf(s);
    return targetIdx > currentIdx;
  });

  return (
    <PageContainer>
      {/* Back + Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{shipment.orderId}</h1>
            <StatusBadge status={shipment.status} size="md" />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {shipment.trackingNumber && <span>Tracking: {shipment.trackingNumber} · </span>}
            Created {formatDate(shipment.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowStatusUpdate(!showStatusUpdate)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-sm font-medium text-white hover:shadow-lg hover:shadow-brand-500/25 transition-all"
            >
              Update Status
            </button>
            {showStatusUpdate && nextStatuses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-10"
              >
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusUpdate(s)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                  >
                    <div className={cn('w-2 h-2 rounded-full', statusConfig[s].color.replace('text-', 'bg-'))} />
                    {statusConfig[s].label}
                  </button>
                ))}
                <button
                  onClick={() => handleStatusUpdate('flagged')}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-rose-500/10 transition-colors flex items-center gap-2 text-rose-400 border-t border-slate-700/50"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  Flag Issue
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Timeline */}
        <div className="lg:col-span-1 glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-6">Shipment Journey</h2>
          <Timeline events={shipment.statusHistory} currentStatus={shipment.status} />
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Order Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" /> Order Info
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <PlatformLogo platform={shipment.platform} size="md" />
                  <div>
                    <p className="text-sm font-medium text-white">{platformConfig[shipment.platform].label}</p>
                    <p className="text-xs text-slate-400">{originConfig[shipment.origin].flag} {originConfig[shipment.origin].label}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Scale className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">{shipment.weight} kg</span>
                  </div>
                  {shipment.dimensions && (
                    <div className="flex items-center gap-2 text-sm">
                      <Ruler className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-300">{shipment.dimensions}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">{formatCurrency(shipment.declaredValue)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">ETA {formatDate(shipment.estimatedDelivery)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Customer Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Customer
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-base font-medium text-white">{shipment.customerName}</p>
                  {customer && (
                    <>
                      <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </p>
                      <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3" /> {customer.address}
                      </p>
                    </>
                  )}
                </div>
                {customer && (
                  <div className="flex gap-2 pt-2">
                    <a
                      href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> WhatsApp
                    </a>
                    <Link
                      to={`/customers`}
                      className="px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Items */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" /> Items ({shipment.items.length})
            </h3>
            <div className="space-y-2">
              {shipment.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-300">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-slate-700/50 mt-2">
                <span className="text-sm font-medium text-slate-400">Total</span>
                <span className="text-sm font-bold text-white">
                  {formatCurrency(shipment.items.reduce((acc, i) => acc + i.price * i.quantity, 0))}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Notes ({shipment.notes.length})
            </h3>
            <div className="space-y-3 mb-4">
              {shipment.notes.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No notes yet</p>
              )}
              {shipment.notes.map((note) => (
                <div key={note.id} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <p className="text-sm text-slate-300">{note.text}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                    <span className="font-medium">{note.author}</span>
                    <span>·</span>
                    <span>{formatDateTime(note.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/50 transition-colors"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageContainer>
  );
}
