import { motion } from 'framer-motion';
import { Clock, PackageCheck, Truck, Shield, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ShipmentStatus } from '../../types';
import { statusConfig } from '../../utils/helpers';
import { cn } from '../../utils/cn';

const iconMap = {
  Clock, PackageCheck, Truck, Shield, MapPin, CheckCircle, AlertTriangle,
};

export function StatusBadge({ status, size = 'sm' }: { status: ShipmentStatus; size?: 'sm' | 'md' | 'lg' }) {
  const config = statusConfig[status];
  const Icon = iconMap[config.icon as keyof typeof iconMap];
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2',
  };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.bg,
        config.color,
        sizeClasses[size]
      )}
    >
      <Icon className={cn(size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5')} />
      {config.label}
    </motion.span>
  );
}
