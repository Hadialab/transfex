import type { Platform } from '../../types';
import { platformConfig } from '../../utils/helpers';

export function PlatformLogo({ platform, size = 'sm' }: { platform: Platform; size?: 'sm' | 'md' | 'lg' }) {
  const config = platformConfig[platform];
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: config.color }}
      title={config.label}
    >
      {config.logo}
    </div>
  );
}
