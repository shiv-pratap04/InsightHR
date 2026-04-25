import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  LineChart,
  AlertTriangle,
  Award,
  Bell,
  Settings,
  LogOut,
  Target,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
  { to: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'manager'] },
  { to: '/tasks', label: 'Tasks', icon: ListTodo, roles: ['admin', 'manager', 'employee'] },
  { to: '/tasks/allocate', label: 'Task allocation', icon: Target, roles: ['admin', 'manager'] },
  { to: '/performance', label: 'Performance', icon: LineChart, roles: ['admin', 'manager', 'employee'] },
  { to: '/attrition', label: 'Attrition', icon: AlertTriangle, roles: ['admin', 'manager'] },
  { to: '/promotion', label: 'Promotions', icon: Award, roles: ['admin', 'manager'] },
  { to: '/alerts', label: 'Alerts', icon: Bell, roles: ['admin', 'manager', 'employee'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'manager'] },
];

function dashboardPath(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'manager') return '/manager/dashboard';
  return '/employee/dashboard';
}

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const filtered = nav.filter((n) => n.roles.includes(user?.role));

  async function logout() {
    try {
      await api.post('/api/auth/logout');
    } catch {
      /* still clear client */
    }
    clear();
    navigate('/login');
  }

  const dash = dashboardPath(user?.role);

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card p-4 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="mb-8 px-2">
          <div className="text-lg font-bold tracking-tight">InsightHR</div>
          <p className="text-xs text-muted-foreground">People analytics &amp; decision support</p>
        </div>
        <nav className="space-y-1">
          {filtered.map((item) => (
            <NavLink
              key={item.to}
              to={item.to === '/dashboard' ? dash : item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              InsightHR — intelligent employee management &amp; decision support
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <span className="max-w-[140px] truncate">{user?.name}</span>
                <BadgeRole role={user?.role} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(dash)}>My dashboard</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="p-4 md:p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function BadgeRole({ role }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] uppercase',
        role === 'admin' && 'bg-red-600 text-white',
        role === 'manager' && 'bg-secondary text-secondary-foreground',
        role === 'employee' && 'border border-border'
      )}
    >
      {role}
    </span>
  );
}
