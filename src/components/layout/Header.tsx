import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Sun, Moon, Menu, X, Check, CheckCheck } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useShipmentStore } from '../../stores/shipmentStore';
import { cn } from '../../utils/cn';
import { timeAgo } from '../../utils/helpers';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const navigate = useNavigate();
  const { isDark, toggle } = useThemeStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const shipments = useShipmentStore((s) => s.shipments);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unread = unreadCount();

  const searchResults = searchQuery.length >= 2
    ? shipments.filter(
        (s) =>
          s.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.trackingNumber && s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const notifColors = {
    info: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
  };

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center gap-4 px-4 lg:px-6 border-b border-slate-700/50 bg-slate-950/80 backdrop-blur-xl">
      <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-xl">
        <div className={cn(
          'flex items-center gap-2 rounded-xl border transition-all duration-300',
          searchOpen
            ? 'bg-slate-800 border-brand-500/50 shadow-lg shadow-brand-500/10'
            : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
        )}>
          <Search className="w-4 h-4 text-slate-400 ml-3" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search orders, customers, tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => { setSearchOpen(false); setSearchQuery(''); }, 200)}
            className="flex-1 bg-transparent py-2.5 pr-3 text-sm text-white placeholder:text-slate-500 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 mr-2 hover:bg-slate-700 rounded">
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
        <AnimatePresence>
          {searchOpen && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
            >
              {searchResults.map((s) => (
                <button
                  key={s.id}
                  onMouseDown={() => navigate(`/shipments/${s.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors text-left"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{s.orderId}</div>
                    <div className="text-xs text-slate-400">{s.customerName} · {s.trackingNumber}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto shrink-0">
        <button onClick={toggle} className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg"
              >
                {unread}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unread > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">No notifications</div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.shipmentId) { navigate(`/shipments/${n.shipmentId}`); setShowNotifs(false); }
                        }}
                        className={cn(
                          'flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-700/50 transition-colors',
                          !n.read && 'bg-brand-500/5'
                        )}
                      >
                        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', notifColors[n.type])} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{n.title}</span>
                            {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                            className="p-1 rounded hover:bg-slate-600 text-slate-500 self-start"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm ml-2 shadow-lg shadow-brand-500/20">
          H
        </div>
      </div>
    </header>
  );
}
