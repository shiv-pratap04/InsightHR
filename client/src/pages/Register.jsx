import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Minimum 8 characters'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export function Register() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [otpRequested, setOtpRequested] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function requestOtp() {
    try {
      const values = getValues();
      const { data } = await api.post('/api/auth/register/request-otp', {
        name: values.name,
        email: values.email,
        password: values.password,
      });
      setOtpRequested(true);
      if (data.devOtp) {
        toast.info(`Dev OTP: ${data.devOtp}`);
      }
      toast.success(data.explanation || 'OTP sent');
    } catch {
      /* interceptor */
    }
  }

  async function onSubmit(values) {
    try {
      const { data } = await api.post('/api/auth/register/verify-otp', {
        email: values.email,
        otp: values.otp,
      });
      setUser(data.user);
      toast.success(data.explanation || 'Account created');
      navigate('/employee/dashboard');
    } catch {
      /* interceptor */
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>New users default to the employee role for the demo portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>
            {otpRequested && (
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input id="otp" placeholder="Enter 6-digit OTP" {...register('otp')} />
                {errors.otp && <p className="text-sm text-red-600">{errors.otp.message}</p>}
              </div>
            )}
            {!otpRequested ? (
              <Button type="button" className="w-full" disabled={isSubmitting} onClick={requestOtp}>
                Send OTP
              </Button>
            ) : null}
            {otpRequested ? (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Verifying…' : 'Verify OTP & Register'}
              </Button>
            ) : null}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link className="text-primary underline" to="/login">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
