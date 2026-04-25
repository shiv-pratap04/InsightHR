import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#0ea5e9', '#6366f1', '#22c55e', '#f97316', '#94a3b8'];

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [e, t, a] = await Promise.all([
          api.get('/api/employees'),
          api.get('/api/tasks'),
          api.get('/api/alerts'),
        ]);
        if (alive) {
          setEmployees(e.data.data || []);
          setTasks(t.data.data || []);
          setAlerts(a.data.data || []);
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
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const active = employees.filter((x) => x.status === 'active').length;
  const avgPerf =
    employees.length > 0
      ? employees.reduce((s, e) => {
          const last = e.performanceHistory?.length ? e.performanceHistory[e.performanceHistory.length - 1]?.weightedScore : 0;
          return s + (last || 0);
        }, 0) / employees.length
      : 0;

  const top = [...employees]
    .map((e) => ({
      name: e.fullName,
      score: e.performanceHistory?.length ? e.performanceHistory[e.performanceHistory.length - 1]?.weightedScore : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const riskData = employees.map((e) => ({
    name: e.fullName.split(' ')[0],
    risk: e.attritionRisk?.score ?? 0,
    level: e.attritionRisk?.level ?? 'Low',
  }));

  const workloadData = employees.map((e) => ({
    name: e.fullName.split(' ')[0],
    load: e.currentWorkload ?? 0,
  }));

  const taskSummary = ['pending', 'assigned', 'in-progress', 'completed'].map((status) => ({
    name: status,
    value: tasks.filter((t) => t.status === status).length,
  }));

  const explanation =
    'Admin view aggregates directory health: headcount, synthetic performance history averages, attrition risk proxies, workload, and alert feed.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">{explanation}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Total employees" value={employees.length} />
        <Stat title="Active" value={active} />
        <Stat title="Avg. performance (history)" value={avgPerf.toFixed(1)} suffix="/100" />
        <Stat title="Open alerts" value={alerts.filter((x) => !x.isRead).length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top performers (latest history point)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {top.length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
            {top.map((r) => (
              <div key={r.name} className="flex justify-between text-sm border-b border-border pb-2">
                <span>{r.name}</span>
                <Badge variant="secondary">{r.score?.toFixed?.(1) ?? r.score}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attrition risk (stored score)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="risk" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workload distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="load" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Task status summary</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskSummary} dataKey="value" nameKey="name" outerRadius={90} label>
                  {taskSummary.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.slice(0, 6).map((a) => (
            <div key={a._id} className="flex flex-wrap items-center gap-2 text-sm border-b border-border pb-2">
              <Badge variant={a.severity === 'high' ? 'destructive' : 'secondary'}>{a.type}</Badge>
              <span className="flex-1">{a.message}</span>
              {!a.isRead && <Badge variant="outline">Unread</Badge>}
            </div>
          ))}
          {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ title, value, suffix }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {suffix && <span className="text-lg font-normal text-muted-foreground">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
