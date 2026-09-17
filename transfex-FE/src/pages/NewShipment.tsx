import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Package,
  Truck,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { useShipmentStore } from '../stores/shipmentStore';
import { useCustomerStore } from '../stores/customerStore';
import { cn } from '../utils/cn';
import { platformConfig, getEstimatedDays, generateId } from '../utils/helpers';
import type { Platform, Origin, OrderItem } from '../types';

const steps = [
  { icon: User, label: 'Customer' },
  { icon: Package, label: 'Order' },
  { icon: Truck, label: 'Shipping' },
  { icon: Check, label: 'Review' },
];

export default function NewShipment() {
  const navigate = useNavigate();
  const addShipment = useShipmentStore((s) => s.addShipment);
  const customers = useCustomerStore((s) => s.customers);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    phone: '',
    address: '',
    city: '',
    platform: '' as Platform | '',
    origin: '' as Origin | '',
    trackingNumber: '',
    weight: '',
    dimensions: '',
    declaredValue: '',
    items: [{ name: '', quantity: 1, price: 0 }] as OrderItem[],
  });

  function updateForm(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function selectCustomer(id: string) {
    const c = customers.find((c) => c.id === id);
    if (c) {
      setForm((prev) => ({
        ...prev,
        customerId: c.id,
        customerName: c.name,
        phone: c.phone,
        address: c.address,
        city: c.city,
      }));
    }
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, { name: '', quantity: 1, price: 0 }] }));
  }

  function removeItem(idx: number) {
    if (form.items.length <= 1) return;
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  }

  function updateItem(idx: number, key: string, value: string | number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === idx ? { ...item, [key]: value } : item)),
    }));
  }

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!form.customerName) newErrors.customerName = 'Required';
      if (!form.phone) newErrors.phone = 'Required';
      if (!form.address) newErrors.address = 'Required';
      if (!form.city) newErrors.city = 'Required';
    } else if (step === 1) {
      if (form.items.some((i) => !i.name)) newErrors.items = 'All items need a name';
    } else if (step === 2) {
      if (!form.platform) newErrors.platform = 'Required';
      if (!form.origin) newErrors.origin = 'Required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function next() {
    if (validateStep()) setStep((s) => Math.min(s + 1, 3));
  }

  function submit() {
    const now = new Date();
    const eta = new Date(now);
    eta.setDate(eta.getDate() + getEstimatedDays(form.origin as Origin));

    addShipment({
      id: generateId(),
      orderId: `TFX-${1000 + Math.floor(Math.random() * 9000)}`,
      customerId: form.customerId || generateId(),
      customerName: form.customerName,
      platform: form.platform as Platform,
      origin: form.origin as Origin,
      status: 'pending',
      items: form.items,
      weight: parseFloat(form.weight) || 0,
      dimensions: form.dimensions || undefined,
      declaredValue: parseFloat(form.declaredValue) || form.items.reduce((a, i) => a + i.price * i.quantity, 0),
      trackingNumber: form.trackingNumber || undefined,
      estimatedDelivery: eta.toISOString(),
      notes: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      statusHistory: [{ status: 'pending', timestamp: now.toISOString(), location: form.origin === 'china' ? 'China' : 'Dubai' }],
    });

    navigate('/shipments');
  }

  const inputClass = (key: string) =>
    cn(
      'w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border text-sm text-white placeholder:text-slate-500 outline-none transition-colors',
      errors[key] ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-700/50 focus:border-brand-500/50'
    );

  return (
    <PageContainer title="New Shipment" subtitle="Create a new shipment order">
      {/* Step Indicator */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isComplete = idx < step;
            const isCurrent = idx === step;
            return (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all',
                    isComplete && 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
                    isCurrent && 'bg-brand-500/20 border-brand-500 text-brand-400 shadow-lg shadow-brand-500/20',
                    !isComplete && !isCurrent && 'bg-slate-800/50 border-slate-700 text-slate-600'
                  )}
                >
                  {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={cn(
                  'text-sm font-medium hidden sm:block',
                  isCurrent ? 'text-white' : 'text-slate-500'
                )}>
                  {s.label}
                </span>
                {idx < steps.length - 1 && (
                  <div className={cn(
                    'w-8 lg:w-16 h-0.5 mx-2',
                    isComplete ? 'bg-emerald-500/40' : 'bg-slate-700/50'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Steps */}
      <div className="glass-card p-6 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Customer Details</h2>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Select Existing Customer (optional)</label>
                <select
                  onChange={(e) => selectCustomer(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 outline-none focus:border-brand-500/50 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">New customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Full Name *</label>
                  <input type="text" placeholder="Customer name" value={form.customerName} onChange={(e) => updateForm('customerName', e.target.value)} className={inputClass('customerName')} />
                  {errors.customerName && <p className="text-xs text-rose-400 mt-1">{errors.customerName}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Phone *</label>
                  <input type="tel" placeholder="+961 XX XXX XXX" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className={inputClass('phone')} />
                  {errors.phone && <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Address *</label>
                <input type="text" placeholder="Street address" value={form.address} onChange={(e) => updateForm('address', e.target.value)} className={inputClass('address')} />
                {errors.address && <p className="text-xs text-rose-400 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">City *</label>
                <input type="text" placeholder="City" value={form.city} onChange={(e) => updateForm('city', e.target.value)} className={inputClass('city')} />
                {errors.city && <p className="text-xs text-rose-400 mt-1">{errors.city}</p>}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Order Items</h2>
              {errors.items && <p className="text-xs text-rose-400">{errors.items}</p>}

              <div className="space-y-3">
                {form.items.map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <div className="flex-1 grid sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="text-[10px] text-slate-500 mb-1 block">Item Name</label>
                        <input type="text" placeholder="Item name" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/50" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 mb-1 block">Qty</label>
                        <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white outline-none focus:border-brand-500/50" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 mb-1 block">Price (USD)</label>
                        <input type="number" min="0" step="0.01" value={item.price || ''} onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white outline-none focus:border-brand-500/50" />
                      </div>
                    </div>
                    <button onClick={() => removeItem(idx)} disabled={form.items.length <= 1} className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-30 mt-5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <button onClick={addItem} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-700 text-sm text-slate-400 hover:border-brand-500/50 hover:text-brand-400 transition-colors w-full justify-center">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Shipping Details</h2>

              <div>
                <label className="text-xs text-slate-400 mb-2 block">Platform *</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(Object.entries(platformConfig) as [Platform, typeof platformConfig.trendyol][]).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => updateForm('platform', key)}
                      className={cn(
                        'p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                        form.platform === key
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-slate-700/50 hover:border-slate-600 bg-slate-800/30'
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: config.color }}>
                        {config.logo}
                      </div>
                      <span className="text-xs text-slate-300">{config.label}</span>
                    </button>
                  ))}
                </div>
                {errors.platform && <p className="text-xs text-rose-400 mt-1">{errors.platform}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-2 block">Origin *</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['china', 'dubai'] as Origin[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => updateForm('origin', o)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all flex items-center gap-3',
                        form.origin === o
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-slate-700/50 hover:border-slate-600 bg-slate-800/30'
                      )}
                    >
                      <span className="text-2xl">{o === 'china' ? '🇨🇳' : '🇦🇪'}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">{o === 'china' ? 'China' : 'Dubai'}</p>
                        <p className="text-xs text-slate-400">~{getEstimatedDays(o)} days delivery</p>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.origin && <p className="text-xs text-rose-400 mt-1">{errors.origin}</p>}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Tracking #</label>
                  <input type="text" placeholder="Optional" value={form.trackingNumber} onChange={(e) => updateForm('trackingNumber', e.target.value)} className={inputClass('')} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Weight (kg)</label>
                  <input type="number" min="0" step="0.1" placeholder="0.0" value={form.weight} onChange={(e) => updateForm('weight', e.target.value)} className={inputClass('')} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Dimensions</label>
                  <input type="text" placeholder="LxWxH cm" value={form.dimensions} onChange={(e) => updateForm('dimensions', e.target.value)} className={inputClass('')} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Review & Submit</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <h3 className="text-xs font-medium text-slate-400 mb-2">Customer</h3>
                  <p className="text-sm text-white">{form.customerName}</p>
                  <p className="text-xs text-slate-400">{form.phone} · {form.address}, {form.city}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <h3 className="text-xs font-medium text-slate-400 mb-2">Items ({form.items.length})</h3>
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span className="text-slate-300">{item.name || 'Unnamed'} x{item.quantity}</span>
                      <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 mt-2 border-t border-slate-700/50 font-medium">
                    <span className="text-slate-300">Total</span>
                    <span className="text-white">${form.items.reduce((a, i) => a + i.price * i.quantity, 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <h3 className="text-xs font-medium text-slate-400 mb-2">Shipping</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-400">Platform</span>
                    <span className="text-white">{form.platform ? platformConfig[form.platform as Platform].label : '—'}</span>
                    <span className="text-slate-400">Origin</span>
                    <span className="text-white">{form.origin === 'china' ? '🇨🇳 China' : form.origin === 'dubai' ? '🇦🇪 Dubai' : '—'}</span>
                    <span className="text-slate-400">Est. Delivery</span>
                    <span className="text-white">{form.origin ? `~${getEstimatedDays(form.origin as Origin)} days` : '—'}</span>
                    {form.weight && <><span className="text-slate-400">Weight</span><span className="text-white">{form.weight} kg</span></>}
                    {form.trackingNumber && <><span className="text-slate-400">Tracking</span><span className="text-white">{form.trackingNumber}</span></>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700/50">
          <button
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < 3 ? (
            <button onClick={next} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-sm font-medium text-white hover:shadow-lg hover:shadow-brand-500/25 transition-all flex items-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submit} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-medium text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2">
              <Check className="w-4 h-4" /> Create Shipment
            </button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
