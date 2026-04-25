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
  fullName: z.string().min(2),
  email: z.string().email(),
  department: z.string().min(1),
  designation: z.string().min(1),
  skills: z.string(),
  experienceYears: z.coerce.number().min(0),
  salary: z.coerce.number().min(0),
  joiningDate: z.string().min(1),
  reportingManager: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  currentWorkload: z.coerce.number().min(0).max(100),
  attendanceRate: z.coerce.number().min(0).max(100),
  taskCompletionRate: z.coerce.number().min(0).max(100),
  deadlineAdherenceRate: z.coerce.number().min(0).max(100),
  peerFeedbackScore: z.coerce.number().min(0).max(100),
  engagementScore: z.coerce.number().min(0).max(100).optional(),
});

export function EmployeeForm() {
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
        status: 'active',
        experienceYears: 0,
        salary: 0,
        currentWorkload: 50,
        attendanceRate: 85,
        taskCompletionRate: 80,
        deadlineAdherenceRate: 80,
        peerFeedbackScore: 80,
        engagementScore: 60,
        joiningDate: new Date().toISOString().slice(0, 10),
      });
      return;
    }
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/api/employees/${id}`);
        const e = data.data;
        if (!alive || !e) return;
        reset({
          fullName: e.fullName,
          email: e.email,
          department: e.department,
          designation: e.designation,
          skills: (e.skills || []).join(', '),
          experienceYears: e.experienceYears,
          salary: e.salary,
          joiningDate: e.joiningDate?.slice?.(0, 10) || '',
          reportingManager: e.reportingManager || '',
          status: e.status,
          currentWorkload: e.currentWorkload,
          attendanceRate: e.attendanceRate,
          taskCompletionRate: e.taskCompletionRate,
          deadlineAdherenceRate: e.deadlineAdherenceRate,
          peerFeedbackScore: e.peerFeedbackScore,
          engagementScore: e.engagementScore ?? 60,
        });
      } catch {
        toast.error('Failed to load employee');
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isEdit, reset]);

  async function onSubmit(values) {
    const payload = {
      ...values,
      skills: values.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      joiningDate: new Date(values.joiningDate).toISOString(),
    };
    try {
      if (isEdit) {
        const { data } = await api.put(`/api/employees/${id}`, payload);
        toast.success(data.explanation || 'Saved');
        navigate(`/employees/${id}`);
      } else {
        const { data } = await api.post('/api/employees', payload);
        toast.success(data.explanation || 'Created');
        navigate(`/employees/${data.data._id}`);
      }
    } catch {
      /* */
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">{isEdit ? 'Edit employee' : 'Add employee'}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.fullName}>
              <Input {...register('fullName')} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" {...register('email')} />
            </Field>
            <Field label="Department" error={errors.department}>
              <Input {...register('department')} />
            </Field>
            <Field label="Designation" error={errors.designation}>
              <Input {...register('designation')} />
            </Field>
            <Field label="Skills (comma-separated)" error={errors.skills} className="sm:col-span-2">
              <Textarea rows={2} {...register('skills')} />
            </Field>
            <Field label="Experience years" error={errors.experienceYears}>
              <Input type="number" step="0.1" {...register('experienceYears')} />
            </Field>
            <Field label="Salary" error={errors.salary}>
              <Input type="number" {...register('salary')} />
            </Field>
            <Field label="Joining date" error={errors.joiningDate}>
              <Input type="date" {...register('joiningDate')} />
            </Field>
            <Field label="Reporting manager" error={errors.reportingManager}>
              <Input {...register('reportingManager')} />
            </Field>
            <Field label="Status" error={errors.status}>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('status')}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </Field>
            <Field label="Current workload %" error={errors.currentWorkload}>
              <Input type="number" {...register('currentWorkload')} />
            </Field>
            <Field label="Attendance %" error={errors.attendanceRate}>
              <Input type="number" {...register('attendanceRate')} />
            </Field>
            <Field label="Task completion %" error={errors.taskCompletionRate}>
              <Input type="number" {...register('taskCompletionRate')} />
            </Field>
            <Field label="Deadline adherence %" error={errors.deadlineAdherenceRate}>
              <Input type="number" {...register('deadlineAdherenceRate')} />
            </Field>
            <Field label="Peer feedback" error={errors.peerFeedbackScore}>
              <Input type="number" {...register('peerFeedbackScore')} />
            </Field>
            <Field label="Engagement score" error={errors.engagementScore}>
              <Input type="number" {...register('engagementScore')} />
            </Field>
            <div className="sm:col-span-2 flex gap-2 pt-2">
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

function Field({ label, error, children, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
