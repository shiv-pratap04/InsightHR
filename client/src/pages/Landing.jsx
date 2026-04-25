import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, LineChart, Users } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/40">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="font-semibold">InsightHR</span>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-16 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">InsightHR</h1>
          <p className="text-xl text-muted-foreground font-medium">
            Intelligent employee management &amp; decision support
          </p>
          <p className="text-muted-foreground text-lg">
            Explainable scoring, smart task allocation, attrition signals, and promotion readiness — built for
            transparent HR analytics demos.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" asChild>
              <Link to="/register">Get started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Explainable AI</CardTitle>
              <CardDescription>Every score ships human-readable reasoning and factor breakdowns.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Performance weights are configurable; attrition and anomaly outputs list drivers and next actions.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Smart allocation</CardTitle>
              <CardDescription>Skill fit, capacity, and workload penalty with top-3 ranked candidates.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Auto-assign guarded against double assignment; low-confidence cases flag manual review.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <LineChart className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Dashboards</CardTitle>
              <CardDescription>Role-aware views for admin, manager, and employee personas.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Recharts visualizations for workload, risk bands, and performance trends out of the box.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
