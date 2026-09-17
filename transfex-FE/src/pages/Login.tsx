import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthField } from '../components/auth/AuthField';
import { useAuthStore } from '../stores/authStore';

const schema = z.object({
  email: z.string().min(1, 'Enter your email').email('That email address looks incomplete'),
  password: z.string().min(1, 'Enter your password'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError, seedDemoAccount } = useAuthStore();

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    clearError();
    seedDemoAccount();
  }, [clearError, seedDemoAccount]);

  async function onSubmit(values: FormValues) {
    const ok = await login(values);
    if (ok) navigate(from, { replace: true });
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Pick up where your shipments left off."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
            Create an account
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
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthField
          label="Password"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
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
              Sign in
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-xs text-slate-500 leading-relaxed">
        Demo account: admin@transfex.io / transfex123
      </p>
    </AuthLayout>
  );
}
