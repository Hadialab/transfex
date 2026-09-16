import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/** Wraps the dashboard. Sends signed-out visitors to /login and remembers where they were headed. */
export function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Wraps /login and /register so a signed-in user doesn't land back on them. */
export function RedirectIfAuthed() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
