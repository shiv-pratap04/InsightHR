import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: res } = await api.get(`/api/employees/${id}`);
        if (alive) setData(res.data);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function remove() {
    if (!confirm('Delete this employee?')) return;
    try {
      await api.delete(`/api/employees/${id}`);
      toast.success('Employee removed');
      navigate('/employees');
    } catch {
      /* */
    }
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (!data) {
    return <p className="text-muted-foreground">Not found or access denied.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{data.fullName}</h1>
          <p className="text-muted-foreground text-sm">{data.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/employees">Back</Link>
          </Button>
          {role !== 'employee' && (
            <>
              <Button asChild>
                <Link to={`/employees/${id}/edit`}>Edit</Link>
              </Button>
              {role === 'admin' && (
                <Button variant="destructive" onClick={remove}>
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row label="Department" value={data.department} />
            <Row label="Designation" value={data.designation} />
            <Row label="Manager" value={data.reportingManager || '—'} />
            <Row label="Experience (yrs)" value={data.experienceYears} />
            <Row label="Salary" value={data.salary} />
            <Row label="Workload %" value={data.currentWorkload} />
            <div className="flex gap-2 pt-2">
              <Badge>{data.status}</Badge>
              <Badge variant="outline">Attrition: {data.attritionRisk?.level ?? 'Low'}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(data.skills || []).map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Metric label="Attendance %" value={data.attendanceRate} />
          <Metric label="Task completion %" value={data.taskCompletionRate} />
          <Metric label="Deadline %" value={data.deadlineAdherenceRate} />
          <Metric label="Peer feedback" value={data.peerFeedbackScore} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value ?? '—'}</div>
    </div>
  );
}
