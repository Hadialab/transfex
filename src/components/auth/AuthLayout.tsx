import { Link } from 'react-router-dom';
import { Package, ShieldCheck, Globe2, Truck } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const highlights = [
  { icon: Truck, title: 'Every shipment, one board', body: 'Aramex, DHL, local couriers — tracked side by side.' },
  { icon: Globe2, title: 'Origin to doorstep', body: 'Customs, transit and last-mile status without the spreadsheet.' },
  { icon: ShieldCheck, title: 'Your team, your access', body: 'Accounts for the people who handle the freight.' },
];

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-slate-950 mesh-bg text-white">
      {/* Brand panel */}
      <aside className="hidden lg:flex flex-col justify-between w-[44%] max-w-2xl p-12 border-r border-slate-800/60">
        <Link to="/login" className="flex items-center gap-3 w-fit">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Package className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Transfex</span>
        </Link>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-balance">
            Shipping operations that stay <span className="gradient-text">in one place</span>
          </h2>
          <ul className="mt-10 space-y-7">
            {highlights.map(({ icon: Icon, title: t, body }) => (
              <li key={t} className="flex gap-4">
                <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-100">{t}</p>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-600">© {new Date().getFullYear()} Transfex</p>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link to="/login" className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Transfex</span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-8 text-sm text-slate-400">{footer}</div>
        </div>
      </main>
    </div>
  );
}
