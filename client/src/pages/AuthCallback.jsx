import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/auth/me');
        if (!cancelled) {
          setUser(data.user);
          if (data.user.role === 'admin') navigate('/admin/dashboard', { replace: true });
          else if (data.user.role === 'manager') navigate('/manager/dashboard', { replace: true });
          else navigate('/employee/dashboard', { replace: true });
        }
      } catch {
        if (!cancelled) navigate('/login?error=oauth', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="space-y-3 w-full max-w-sm">
        <p className="text-sm text-muted-foreground text-center">Completing Google sign-in…</p>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
