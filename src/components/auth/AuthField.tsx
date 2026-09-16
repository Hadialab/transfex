import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ElementType;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, error, icon: Icon, type = 'text', id, className, ...props },
  ref
) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${inputId}-error`;

  return (
    <div>
      <label htmlFor={inputId} className="block text-[13px] font-medium text-slate-300 mb-1.5">
        {label}
      </label>

      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border bg-slate-900/60 transition-colors duration-200',
          'focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20',
          error ? 'border-rose-500/50' : 'border-slate-700/60 hover:border-slate-600'
        )}
      >
        {Icon && <Icon className="w-4 h-4 text-slate-500 ml-3 shrink-0" />}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'flex-1 min-w-0 bg-transparent py-2.5 text-sm text-white placeholder:text-slate-600 outline-none',
            Icon ? 'pl-0' : 'pl-3',
            isPassword ? 'pr-0' : 'pr-3',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            className="p-2 mr-1 rounded-lg text-slate-500 hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
});
