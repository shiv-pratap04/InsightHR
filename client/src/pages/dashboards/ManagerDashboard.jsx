import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [e, t] = await Promise.all([api.get('/api/employees'), api.get('/api/tasks')]);
        if (alive) {
          setEmployees(e.data.data || []);
          setTasks(t.data.data || []);
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
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const teamAvg =
    employees.length > 0
      ? employees.reduce((s, e) => s + (e.taskCompletionRate || 0), 0) / employees.length
      : 0;

  const attritionList = [...employees]
    .map((e) => ({
      id: e._id,
      name: e.fullName,
      risk: e.attritionRisk?.score ?? 0,
      level: e.attritionRisk?.level ?? 'Low',
    }))
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 6);

  const trendData = employees.slice(0, 5).map((e) => ({
    name: e.fullName.split(' ')[0],
    completion: e.taskCompletionRate ?? 0,
    attendance: e.attendanceRate ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manager dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Team performance snapshot, allocation entry points, and attrition watchlist. Explanations are generated server-side
            on each analytics run.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/tasks/allocate">Task allocation</Link>
          </Button>
          <Button asChild>
            <Link to="/tasks/new">New task</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Team size</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{employees.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Avg task completion %</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{teamAvg.toFixed(1)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active tasks</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {tasks.filter((t) => t.status !== 'completed').length}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Team metrics (sample slice)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="completion" stroke="#0ea5e9" name="Task %" />
              <Line type="monotone" dataKey="attendance" stroke="#6366f1" name="Attendance %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Attrition risk list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {attritionList.map((row) => (
            <div key={row.id} className="flex items-center justify-between text-sm">
              <Link className="text-primary hover:underline" to={`/employees/${row.id}`}>
                {row.name}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{row.risk}/100</span>
                <Badge variant={row.level === 'High' ? 'destructive' : row.level === 'Medium' ? 'secondary' : 'outline'}>
                  {row.level}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
