import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const emRes = await api.get('/api/employees');
        const me = (emRes.data.data || [])[0];
        if (alive) setEmployee(me || null);
        const [t, a] = await Promise.all([api.get('/api/tasks'), api.get('/api/alerts')]);
        if (alive) {
          setTasks(t.data.data || []);
          setAlerts(a.data.data || []);
        }
        if (me?._id) {
          const tr = await api.get(`/api/performance/trends/${me._id}`);
          if (alive) setTrend(tr.data.data || []);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!employee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No employee profile linked</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ask an admin to attach your user account to an <code className="text-xs">Employee</code> record (
          <code className="text-xs">userId</code> field). Seed demo: login as{' '}
          <strong>employee1@ems.demo</strong>.
        </CardContent>
      </Card>
    );
  }

  const lastScore = employee.performanceHistory?.length
    ? employee.performanceHistory[employee.performanceHistory.length - 1]?.weightedScore
    : null;

  const chartData = trend.map((p) => ({
    date: new Date(p.date).toLocaleDateString(),
    score: p.score,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personal performance trend, tasks, and alerts. Narratives come from stored performance breakdowns.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{employee.fullName}</div>
            <div>{employee.designation}</div>
            <div className="text-muted-foreground">{employee.department}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Latest score (history)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{lastScore != null ? lastScore : '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Attrition risk (cached)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <span className="text-2xl font-bold">{employee.attritionRisk?.score ?? 0}</span>
            <Badge variant="outline">{employee.attritionRisk?.level ?? 'Low'}</Badge>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Performance trend</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No performance records yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#0ea5e9" fill="#38bdf833" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My tasks</CardTitle>
            <Link className="text-sm text-primary" to="/tasks">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tasks.slice(0, 5).map((tk) => (
              <div key={tk._id} className="flex justify-between border-b border-border pb-2">
                <span className="truncate pr-2">{tk.title}</span>
                <Badge variant="secondary">{tk.status}</Badge>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-muted-foreground">No tasks assigned.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {alerts.slice(0, 6).map((al) => (
              <div key={al._id} className="border-b border-border pb-2">
                <div className="flex gap-2">
                  <Badge variant="outline">{al.type}</Badge>
                  {!al.isRead && <span className="text-xs text-amber-600">New</span>}
                </div>
                <p className="mt-1">{al.message}</p>
              </div>
            ))}
            {alerts.length === 0 && <p className="text-muted-foreground">No alerts.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
