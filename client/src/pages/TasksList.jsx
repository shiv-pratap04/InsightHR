import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';

export function TasksList() {
  const role = useAuthStore((s) => s.user?.role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get('/api/tasks');
        if (alive) setRows(data.data || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {role === 'employee' ? 'Assignments visible to you' : 'Team backlog and execution'}
          </p>
        </div>
        {role !== 'employee' && (
          <Button asChild>
            <Link to="/tasks/new">New task</Link>
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <Skeleton className="h-48" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  {role !== 'employee' && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t._id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{t.title}</TableCell>
                    <TableCell>
                      <Badge variant={t.priority === 'high' ? 'destructive' : 'secondary'}>{t.priority}</Badge>
                    </TableCell>
                    <TableCell>{t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{t.status}</TableCell>
                    <TableCell>{t.assignedTo?.fullName || '—'}</TableCell>
                    {role !== 'employee' && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/tasks/${t._id}/edit`}>Edit</Link>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && rows.length === 0 && <p className="text-sm text-muted-foreground py-6">No tasks.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
