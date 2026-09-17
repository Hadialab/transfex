import { motion } from 'framer-motion';
import { Check, MapPin } from 'lucide-react';
import type { StatusEvent, ShipmentStatus } from '../../types';
import { statusConfig, statusOrder, formatDateTime } from '../../utils/helpers';
import { cn } from '../../utils/cn';

export function Timeline({ events, currentStatus }: { events: StatusEvent[]; currentStatus: ShipmentStatus }) {
  const currentIdx = statusOrder.indexOf(currentStatus);
  const isFlagged = currentStatus === 'flagged';

  return (
    <div className="relative">
      {statusOrder.map((status, idx) => {
        const event = events.find((e) => e.status === status);
        const isCompleted = idx < currentIdx || currentStatus === 'delivered';
        const isCurrent = status === currentStatus;
        const isPending = idx > currentIdx;
        const config = statusConfig[status];

        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex gap-4 pb-8 last:pb-0"
          >
            {/* Line + Dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-500',
                  isCompleted && 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
                  isCurrent && !isFlagged && 'bg-brand-500/20 border-brand-500 text-brand-400 shadow-lg shadow-brand-500/20',
                  isCurrent && isFlagged && 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/20',
                  isPending && 'bg-slate-800/50 border-slate-700 text-slate-600'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-3 h-3 rounded-full bg-current"
                  />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-current opacity-30" />
                )}
              </div>
              {idx < statusOrder.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[24px] transition-colors duration-500',
                    isCompleted ? 'bg-emerald-500/40' : 'bg-slate-700/50'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('pt-1.5 pb-2 flex-1', isPending && 'opacity-40')}>
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  'text-sm font-semibold',
                  isCompleted && 'text-emerald-400',
                  isCurrent && !isFlagged && 'text-brand-400',
                  isCurrent && isFlagged && 'text-rose-400',
                  isPending && 'text-slate-500'
                )}>
                  {config.label}
                </h4>
                {isCurrent && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-medium">
                    Current
                  </span>
                )}
              </div>
              {event && (
                <div className="mt-1.5 space-y-1">
                  <p className="text-xs text-slate-400">{formatDateTime(event.timestamp)}</p>
                  {event.location && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </p>
                  )}
                  {event.note && (
                    <p className="text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg mt-2 border border-slate-700/50">
                      {event.note}
                    </p>
                  )}
                </div>
              )}
              {!event && isPending && (
                <p className="text-xs text-slate-600 mt-1">Awaiting...</p>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Flagged status */}
      {isFlagged && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4 mt-2 pt-4 border-t border-rose-500/20"
        >
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-rose-500/20 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/20">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-3 h-3 rounded-full bg-current"
              />
            </div>
          </div>
          <div className="pt-1.5">
            <h4 className="text-sm font-semibold text-rose-400">Flagged</h4>
            {events.find((e) => e.status === 'flagged') && (
              <div className="mt-1.5 space-y-1">
                <p className="text-xs text-slate-400">
                  {formatDateTime(events.find((e) => e.status === 'flagged')!.timestamp)}
                </p>
                {events.find((e) => e.status === 'flagged')!.note && (
                  <p className="text-xs text-rose-300/80 bg-rose-500/10 px-3 py-2 rounded-lg mt-2 border border-rose-500/20">
                    {events.find((e) => e.status === 'flagged')!.note}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
