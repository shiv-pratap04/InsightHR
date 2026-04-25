import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

export function PerformancePage() {
  const role = useAuthStore((s) => s.user?.role);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [records, setRecords] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [anomalyResult, setAnomalyResult] = useState(null);
  const [anomalyBusy, setAnomalyBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get('/api/employees');
        const list = data.data || [];
        if (alive) {
          setEmployees(list);
          if (list.length === 1) setEmployeeId(list[0]._id);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    let alive = true;
    (async () => {
      try {
        const [h, tr] = await Promise.all([
          api.get(`/api/performance/${employeeId}`),
          api.get(`/api/performance/trends/${employeeId}`),
        ]);
        if (alive) {
          setRecords(h.data.data || []);
          setTrend(tr.data.data || []);
        }
      } catch {
        if (alive) {
          setRecords([]);
          setTrend([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [employeeId]);

  useEffect(() => {
    if (role === 'employee' && employees.length === 1 && !employeeId) {
      setEmployeeId(employees[0]._id);
    }
  }, [role, employees, employeeId]);

  async function runAnomaly() {
    if (!employeeId) return;
    setAnomalyBusy(true);
    try {
      const { data } = await api.post('/api/ml/anomaly', { employeeId });
      setAnomalyResult(data);
    } finally {
      setAnomalyBusy(false);
    }
  }

  async function calculate() {
    if (!employeeId) return;
    setBusy(true);
    try {
      const { data } = await api.post('/api/performance/calculate', { employeeId });
      toast.success(data.explanation || 'Calculated');
      const [h, tr] = await Promise.all([
        api.get(`/api/performance/${employeeId}`),
        api.get(`/api/performance/trends/${employeeId}`),
      ]);
      setRecords(h.data.data || []);
      setTrend(tr.data.data || []);
    } finally {
      setBusy(false);
    }
  }

  const latest = records[0];
  const breakdownData = latest
    ? [
        { name: 'Attendance', value: latest.breakdown?.contributions?.attendance ?? 0 },
        { name: 'Tasks', value: latest.breakdown?.contributions?.taskCompletion ?? 0 },
        { name: 'Deadlines', value: latest.breakdown?.contributions?.deadlineAdherence ?? 0 },
        { name: 'Peers', value: latest.breakdown?.contributions?.peerFeedback ?? 0 },
      ]
    : [];

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Weighted scoring with stored breakdown for audit trails. Admins/managers can recalculate; employees see self only.
        </p>
      </div>
      {role !== 'employee' && employees.length > 1 && (
        <Card>
          <CardContent className="pt-6 flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[200px]">
              <Label>Employee</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">Select…</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.fullName}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={calculate} disabled={!employeeId || busy}>
              {busy ? 'Calculating…' : 'Calculate & save record'}
            </Button>
          </CardContent>
        </Card>
      )}
      {employeeId && role === 'employee' && (
        <p className="text-sm text-muted-foreground">
          Showing your performance history. Managers trigger official calculation runs.
        </p>
      )}
      {employeeId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Anomaly detection</CardTitle>
            <Button size="sm" variant="outline" onClick={runAnomaly} disabled={anomalyBusy}>
              {anomalyBusy ? 'Scanning…' : 'Run explainable scan'}
            </Button>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {anomalyResult ? (
              <>
                <p className="text-muted-foreground">{anomalyResult.explanation}</p>
                <p className="text-xs text-muted-foreground">{anomalyResult.method}</p>
                <ul className="space-y-2">
                  {(anomalyResult.anomalies || []).map((a, i) => (
                    <li key={i} className="rounded-md border border-border p-3">
                      <div className="font-medium">{a.anomalyType}</div>
                      <div className="text-xs text-muted-foreground">Severity: {a.severity}</div>
                      <p className="mt-1">{a.reason}</p>
                      <p className="text-xs mt-1">{a.explanation}</p>
                      <p className="text-xs mt-1 text-primary">{a.suggestedAction}</p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-muted-foreground">
                Uses z-score and rule thresholds on performance history. Select an employee first.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest breakdown (contributions)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {!latest ? (
              <p className="text-sm text-muted-foreground">No records.</p>
            ) : (
              <>
                <p className="text-sm mb-2">{latest.breakdown?.explanation}</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#0ea5e9" name="Weighted contribution" />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64 text-sm">
            {trend.length === 0 ? (
              <p className="text-muted-foreground">No trend points.</p>
            ) : (
              <ul className="space-y-2 overflow-auto max-h-56">
                {trend.map((p, i) => (
                  <li key={i} className="border-b border-border pb-2">
                    <div className="font-medium">{new Date(p.date).toLocaleString()}</div>
                    <div>Score: {p.score?.toFixed?.(1) ?? p.score}</div>
                    {p.reason && <div className="text-muted-foreground text-xs mt-1">{p.reason}</div>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
