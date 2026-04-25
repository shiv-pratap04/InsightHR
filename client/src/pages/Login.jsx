import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api, API_BASE } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Required'),
});

export function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [params] = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  if (params.get('error') === 'oauth') {
    toast.error('Google sign-in failed or was cancelled.');
  }

  async function onSubmit(values) {
    try {
      const { data } = await api.post('/api/auth/login', values);
      setUser(data.user);
      toast.success(data.explanation || 'Welcome back');
      navigate(dashFor(data.user.role));
    } catch {
      /* toast via interceptor */
    }
  }

  function googleLogin() {
    window.location.href = `${API_BASE}/api/auth/google`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Email/password or Google OAuth (if configured on the server).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
              <span className="bg-card px-2">Or continue with</span>
            </div>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={googleLogin}>
            Login with Google
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link className="text-primary underline" to="/register">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function dashFor(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'manager') return '/manager/dashboard';
  return '/employee/dashboard';
}
