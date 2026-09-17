import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthField } from '../components/auth/AuthField';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../utils/cn';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name'),
    email: z.string().min(1, 'Enter your email').email('That email address looks incomplete'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirm: z.string().min(1, 'Type the password again'),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

function strengthOf(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

const strengthMeta = [
  { label: 'Too short', color: 'bg-rose-500' },
  { label: 'Weak', color: 'bg-rose-500' },
  { label: 'Fair', color: 'bg-amber-500' },
  { label: 'Good', color: 'bg-emerald-500' },
  { label: 'Strong', color: 'bg-emerald-400' },
];

export default function Register() {
  const navigate = useNavigate();
  const { register: createAccount, loading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onBlur' });

  const password = watch('password') ?? '';
  const score = strengthOf(password);

  useEffect(() => {
    clearError();
  }, [clearError]);

  async function onSubmit(values: FormValues) {
    const ok = await createAccount({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (ok) navigate('/', { replace: true });
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up access for handling shipments and customers."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-sm text-rose-200">{error}</p>
          </div>
        )}

        <AuthField
          label="Full name"
          icon={User}
          autoComplete="name"
          placeholder="Hadi Alabdallah"
          error={errors.name?.message}
          {...register('name')}
        />

        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <AuthField
            label="Password"
            icon={Lock}
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          {password && !errors.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i < score ? strengthMeta[score].color : 'bg-slate-700'
                    )}
                  />
                ))}
              </div>
              <span className="text-[11px] text-slate-400 w-12 text-right">{strengthMeta[score].label}</span>
            </div>
          )}
        </div>

        <AuthField
          label="Confirm password"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder="Type it again"
          error={errors.confirm?.message}
          {...register('confirm')}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-opacity hover:opacity-95 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
