import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function TaskAllocation() {
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await api.get('/api/tasks');
      if (alive) {
        const list = data.data || [];
        setTasks(list);
        const pending = list.find((t) => !t.assignedTo || t.status === 'pending');
        if (pending) setTaskId(pending._id);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function recommend() {
    if (!taskId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/tasks/recommend/${taskId}`);
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function autoAssign(top) {
    if (!top?.employeeId) return;
    try {
      const { data } = await api.post(`/api/tasks/${taskId}/assign`, {
        employeeId: top.employeeId,
        force: true,
      });
      toast.success(data.explanation || 'Assigned');
      setResult(null);
      const { data: t } = await api.get('/api/tasks');
      setTasks(t.data || []);
    } catch {
      /* */
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Smart task allocation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Engine: skill overlap + availability − workload penalty. Each candidate includes a plain-language reason.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Select task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label>Task</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
            >
              <option value="">Choose…</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} {t.assignedTo ? '(assigned)' : ''}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={recommend} disabled={!taskId || loading}>
            {loading ? 'Scoring…' : 'Get top 3 recommendations'}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{result.explanation}</p>
            {result.manualReviewRequired && (
              <Badge variant="destructive">Manual review recommended</Badge>
            )}
            <div className="space-y-3">
              {(result.recommendations || []).map((r, i) => (
                <div key={r.employeeId} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="font-medium">
                      #{i + 1} {r.fullName}{' '}
                      <span className="text-muted-foreground text-sm">({r.department})</span>
                    </div>
                    <Badge variant="secondary">Match {r.finalMatchScore?.toFixed?.(1)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.explanation}</p>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                    <span>Skills match: {r.skillMatchScore}</span>
                    <span>Availability: {r.availabilityScore}</span>
                    <span>Workload penalty: {r.workloadPenalty}</span>
                  </div>
                  {i === 0 && (
                    <Button size="sm" variant="outline" onClick={() => autoAssign(r)}>
                      Auto-assign best match
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
