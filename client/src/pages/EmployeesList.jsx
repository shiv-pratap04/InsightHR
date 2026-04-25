import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';

export function EmployeesList() {
  const role = useAuthStore((s) => s.user?.role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const q = dept ? `?department=${encodeURIComponent(dept)}` : '';
        const { data } = await api.get(`/api/employees${q}`);
        if (alive) setRows(data.data || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [dept]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-sm text-muted-foreground">{role === 'employee' ? 'Your profile' : 'Directory'}</p>
        </div>
        {role !== 'employee' && (
          <Button asChild>
            <Link to="/employees/new">Add employee</Link>
          </Button>
        )}
      </div>
      {role !== 'employee' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 max-w-md">
            <Input placeholder="Department contains…" value={dept} onChange={(e) => setDept(e.target.value)} />
            <Button variant="secondary" type="button" onClick={() => setDept('')}>
              Clear
            </Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow key={e._id}>
                    <TableCell className="font-medium">{e.fullName}</TableCell>
                    <TableCell>{e.department}</TableCell>
                    <TableCell>{e.designation}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === 'active' ? 'success' : 'secondary'}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/employees/${e._id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && rows.length === 0 && <p className="text-sm text-muted-foreground py-6">No employees found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
