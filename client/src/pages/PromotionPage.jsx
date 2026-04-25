import { useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function PromotionPage() {
  const [department, setDepartment] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const { data } = await api.post('/api/ml/promotion', {
        department: department.trim() || undefined,
        limit: 8,
      });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Promotion recommendations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explainable ranking using performance level, trend, peer signal, attendance, skills, and tenure.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label>Department (optional)</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
          </div>
          <Button onClick={run} disabled={loading}>
            {loading ? 'Ranking…' : 'Recommend candidates'}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Candidates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{result.explanation}</p>
            <p className="text-xs text-muted-foreground">{result.method}</p>
            <div className="space-y-3">
              {(result.recommendedCandidates || []).map((c) => (
                <div key={c.employeeId} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="font-medium">
                      {c.fullName}{' '}
                      <span className="text-muted-foreground">
                        — {c.designation} ({c.department})
                      </span>
                    </div>
                    <Badge variant="secondary">Score {c.promotionScore}</Badge>
                  </div>
                  <p className="text-muted-foreground">{c.explanation}</p>
                </div>
              ))}
            </div>
            {(result.recommendedCandidates || []).length === 0 && (
              <p className="text-muted-foreground">No candidates above threshold.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
