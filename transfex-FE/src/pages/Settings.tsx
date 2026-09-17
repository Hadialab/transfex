import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building,
  Palette,
  Bell,
  Shield,
  Save,
  Sun,
  Moon,
  Globe,
  Truck,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { useThemeStore } from '../stores/themeStore';
import { cn } from '../utils/cn';

const tabs = [
  { id: 'general', label: 'General', icon: Building },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'shipping', label: 'Shipping', icon: Truck },
];

export default function Settings() {
  const { isDark, toggle } = useThemeStore();
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    businessName: 'TransFex',
    email: 'info@transfex.com',
    phone: '+961 71 000 000',
    address: 'Beirut, Lebanon',
    currency: 'USD',
    language: 'en',
    chinaRate: '8',
    dubaiRate: '5',
    notifyStatusChange: true,
    notifyCustomsAlert: true,
    notifyDelivery: true,
    notifyNewOrder: true,
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <PageContainer title="Settings" subtitle="Manage your dashboard preferences">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="glass-card p-2 h-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 glass-card p-6">
          {activeTab === 'general' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Business Profile</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Business Name</label>
                  <input
                    type="text"
                    value={settings.businessName}
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-white outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-white outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Phone</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-white outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-white outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 outline-none focus:border-brand-500/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="LBP">LBP (ل.ل)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 outline-none focus:border-brand-500/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Appearance</h2>
              <div>
                <label className="text-xs text-slate-400 mb-3 block">Theme</label>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <button
                    onClick={() => isDark && toggle()}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all flex items-center gap-3',
                      !isDark ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700/50 hover:border-slate-600'
                    )}
                  >
                    <Sun className="w-5 h-5 text-amber-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">Light</p>
                      <p className="text-xs text-slate-400">Clean and bright</p>
                    </div>
                  </button>
                  <button
                    onClick={() => !isDark && toggle()}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all flex items-center gap-3',
                      isDark ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700/50 hover:border-slate-600'
                    )}
                  >
                    <Moon className="w-5 h-5 text-brand-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">Dark</p>
                      <p className="text-xs text-slate-400">Easy on the eyes</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
              {[
                { key: 'notifyStatusChange', label: 'Status Changes', desc: 'When a shipment status is updated' },
                { key: 'notifyCustomsAlert', label: 'Customs Alerts', desc: 'When a shipment arrives at customs' },
                { key: 'notifyDelivery', label: 'Delivery Confirmations', desc: 'When a shipment is delivered' },
                { key: 'notifyNewOrder', label: 'New Orders', desc: 'When a new shipment is created' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative',
                      settings[item.key as keyof typeof settings] ? 'bg-brand-600' : 'bg-slate-700'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
                      settings[item.key as keyof typeof settings] ? 'translate-x-[22px]' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'shipping' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Shipping Rates</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🇨🇳</span>
                    <span className="text-sm font-medium text-white">China Route</span>
                  </div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Rate per kg (USD)</label>
                  <input
                    type="number"
                    value={settings.chinaRate}
                    onChange={(e) => setSettings({ ...settings, chinaRate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-white outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🇦🇪</span>
                    <span className="text-sm font-medium text-white">Dubai Route</span>
                  </div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Rate per kg (USD)</label>
                  <input
                    type="number"
                    value={settings.dubaiRate}
                    onChange={(e) => setSettings({ ...settings, dubaiRate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-white outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-8 pt-6 border-t border-slate-700/50">
            <button
              onClick={handleSave}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                saved
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-gradient-to-r from-brand-600 to-violet-600 text-white hover:shadow-lg hover:shadow-brand-500/25'
              )}
            >
              <Save className="w-4 h-4" />
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
