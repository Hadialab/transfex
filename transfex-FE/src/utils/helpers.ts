import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { ShipmentStatus, Platform, Origin } from '../types';

export const statusConfig: Record<ShipmentStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', icon: 'Clock' },
  picked_up: { label: 'Picked Up', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: 'PackageCheck' },
  in_transit: { label: 'In Transit', color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20', icon: 'Truck' },
  customs: { label: 'Customs', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', icon: 'Shield' },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20', icon: 'MapPin' },
  delivered: { label: 'Delivered', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: 'CheckCircle' },
  flagged: { label: 'Flagged', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20', icon: 'AlertTriangle' },
};

export const platformConfig: Record<Platform, { label: string; color: string; logo: string }> = {
  trendyol: { label: 'Trendyol', color: '#FF6F00', logo: 'T' },
  shein: { label: 'SHEIN', color: '#000000', logo: 'S' },
  aliexpress: { label: 'AliExpress', color: '#E62E04', logo: 'AE' },
  alibaba: { label: 'Alibaba', color: '#FF6A00', logo: 'AB' },
  other: { label: 'Other', color: '#6366f1', logo: '?' },
};

export const originConfig: Record<Origin, { label: string; flag: string }> = {
  china: { label: 'China', flag: '🇨🇳' },
  dubai: { label: 'Dubai', flag: '🇦🇪' },
};

export function formatDate(date: string): string {
  return format(parseISO(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string): string {
  return format(parseISO(date), 'MMM dd, yyyy · h:mm a');
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(parseISO(date), { addSuffix: true });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function getEstimatedDays(origin: Origin): number {
  return origin === 'china' ? 18 : 10;
}

export const statusOrder: ShipmentStatus[] = [
  'pending',
  'picked_up',
  'in_transit',
  'customs',
  'out_for_delivery',
  'delivered',
];
