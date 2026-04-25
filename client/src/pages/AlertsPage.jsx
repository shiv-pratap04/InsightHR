import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function AlertsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await api.get('/api/alerts');
    setRows(data.data || []);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await load();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function markRead(id) {
    try {
      const { data } = await api.put(`/api/alerts/${id}/read`);
      toast.success(data.explanation || 'Marked read');
      await load();
    } catch {
      /* */
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Operational signals (anomaly, attrition, performance-drop, promotion). Employees see only their own feed.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <Skeleton className="h-40" />
          ) : (
            rows.map((a) => (
              <div key={a._id} className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant={a.severity === 'high' ? 'destructive' : 'secondary'}>{a.type}</Badge>
                  {!a.isRead && <Badge variant="outline">Unread</Badge>}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{a.message}</p>
                {a.employeeId?.fullName && (
                  <p className="text-xs text-muted-foreground">Employee: {a.employeeId.fullName}</p>
                )}
                {!a.isRead && (
                  <Button size="sm" variant="outline" onClick={() => markRead(a._id)}>
                    Mark read
                  </Button>
                )}
              </div>
            ))
          )}
          {!loading && rows.length === 0 && <p className="text-sm text-muted-foreground">No alerts.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
