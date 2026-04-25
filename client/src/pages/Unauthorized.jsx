import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Unauthorized</h1>
      <p className="text-muted-foreground text-center max-w-md">
        You do not have permission to view this area. Use an admin or manager account for operational consoles.
      </p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
