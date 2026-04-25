import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function AttritionPage() {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await api.get('/api/employees');
      if (alive) setEmployees(data.data || []);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function run() {
    if (!employeeId) return;
    setLoading(true);
    try {
      const { data } = await api.post('/api/ml/attrition', { employeeId });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Attrition prediction</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rule-based risk scoring (ML-ready features). Output always includes reasons and recommended actions.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Run model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
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
          <Button onClick={run} disabled={!employeeId || loading}>
            {loading ? 'Scoring…' : 'Predict attrition risk'}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant={result.riskLevel === 'High' ? 'destructive' : result.riskLevel === 'Medium' ? 'secondary' : 'outline'}>
                {result.riskLevel}
              </Badge>
              <span className="text-muted-foreground">Score {result.riskScore}/100</span>
            </div>
            <p>{result.explanation}</p>
            <p className="text-xs text-muted-foreground">{result.method}</p>
            <div>
              <div className="font-medium mb-1">Reasons</div>
              <ul className="list-disc pl-5 space-y-1">
                {(result.reasons || []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium mb-1">Recommended actions</div>
              <ul className="list-disc pl-5 space-y-1">
                {(result.recommendedActions || []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
