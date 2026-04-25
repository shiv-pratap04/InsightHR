import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const schema = z.object({
  w1: z.coerce.number().min(0).max(1),
  w2: z.coerce.number().min(0).max(1),
  w3: z.coerce.number().min(0).max(1),
  w4: z.coerce.number().min(0).max(1),
});

export function SettingsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [meta, setMeta] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get('/api/settings/weights');
        if (!alive) return;
        const w = data.data?.raw || data.data?.normalized;
        reset({
          w1: w.w1,
          w2: w.w2,
          w3: w.w3,
          w4: w.w4,
        });
        setMeta(data.explanation || '');
      } catch {
        /* */
      }
    })();
    return () => {
      alive = false;
    };
  }, [reset]);

  async function onSubmit(values) {
    try {
      const { data } = await api.put('/api/settings/weights', values);
      toast.success(data.explanation || 'Saved');
      const w = data.data?.raw;
      reset(w);
    } catch {
      /* */
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Performance scoring weights (w1–w4). Values are renormalized to sum to 1 on the server.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Performance weights</CardTitle>
        </CardHeader>
        <CardContent>
          {role !== 'admin' && (
            <p className="text-sm text-amber-700 mb-4">
              View-only: only administrators can update weights. You can still inspect current values.
            </p>
          )}
          <p className="text-xs text-muted-foreground mb-4">{meta}</p>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <Field label="w1 — Attendance" name="w1" register={register} error={errors.w1} />
            <Field label="w2 — Task completion" name="w2" register={register} error={errors.w2} />
            <Field label="w3 — Deadline adherence" name="w3" register={register} error={errors.w3} />
            <Field label="w4 — Peer feedback" name="w4" register={register} error={errors.w4} />
            {role === 'admin' && (
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save weights'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, name, register, error }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type="number" step="0.01" {...register(name)} />
      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
