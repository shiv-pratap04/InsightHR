import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  requiredSkills: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  deadline: z.string().min(1),
  estimatedHours: z.coerce.number().min(0),
  status: z.enum(['pending', 'assigned', 'in-progress', 'completed']).optional(),
});

export function TaskForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!isEdit) {
      reset({
        priority: 'medium',
        estimatedHours: 8,
        deadline: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
      });
      return;
    }
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/api/tasks/${id}`);
        const t = data.data;
        if (!alive || !t) return;
        reset({
          title: t.title,
          description: t.description || '',
          requiredSkills: (t.requiredSkills || []).join(', '),
          priority: t.priority,
          deadline: t.deadline ? new Date(t.deadline).toISOString().slice(0, 16) : '',
          estimatedHours: t.estimatedHours,
          status: t.status,
        });
      } catch {
        toast.error('Failed to load task');
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isEdit, reset]);

  async function onSubmit(values) {
    const payload = {
      title: values.title,
      description: values.description || '',
      requiredSkills: values.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      priority: values.priority,
      deadline: new Date(values.deadline).toISOString(),
      estimatedHours: values.estimatedHours,
    };
    if (isEdit && values.status) payload.status = values.status;
    try {
      if (isEdit) {
        const { data } = await api.put(`/api/tasks/${id}`, payload);
        toast.success(data.explanation || 'Updated');
        navigate('/tasks');
      } else {
        const { data } = await api.post('/api/tasks', payload);
        toast.success(data.explanation || 'Created');
        navigate('/tasks');
      }
    } catch {
      /* */
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{isEdit ? 'Edit task' : 'New task'}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Title" error={errors.title}>
              <Input {...register('title')} />
            </Field>
            <Field label="Description" error={errors.description}>
              <Textarea rows={3} {...register('description')} />
            </Field>
            <Field label="Required skills (comma-separated)" error={errors.requiredSkills}>
              <Input {...register('requiredSkills')} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Priority" error={errors.priority}>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('priority')}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </Field>
              <Field label="Estimated hours" error={errors.estimatedHours}>
                <Input type="number" step="0.5" {...register('estimatedHours')} />
              </Field>
            </div>
            <Field label="Deadline" error={errors.deadline}>
              <Input type="datetime-local" {...register('deadline')} />
            </Field>
            {isEdit && (
              <Field label="Status" error={errors.status}>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('status')}>
                  <option value="pending">pending</option>
                  <option value="assigned">assigned</option>
                  <option value="in-progress">in-progress</option>
                  <option value="completed">completed</option>
                </select>
              </Field>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
