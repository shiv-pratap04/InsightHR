import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleRoute } from '@/components/RoleRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { AuthCallback } from '@/pages/AuthCallback';
import { Unauthorized } from '@/pages/Unauthorized';
import { AdminDashboard } from '@/pages/dashboards/AdminDashboard';
import { ManagerDashboard } from '@/pages/dashboards/ManagerDashboard';
import { EmployeeDashboard } from '@/pages/dashboards/EmployeeDashboard';
import { EmployeesList } from '@/pages/EmployeesList';
import { EmployeeDetail } from '@/pages/EmployeeDetail';
import { EmployeeForm } from '@/pages/EmployeeForm';
import { TasksList } from '@/pages/TasksList';
import { TaskForm } from '@/pages/TaskForm';
import { TaskAllocation } from '@/pages/TaskAllocation';
import { PerformancePage } from '@/pages/PerformancePage';
import { AttritionPage } from '@/pages/AttritionPage';
import { PromotionPage } from '@/pages/PromotionPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { SettingsPage } from '@/pages/SettingsPage';

function AuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => clear());
  }, [setUser, clear]);

  return null;
}

function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  if (!hydrated) return null;
  if (!user) return <Landing />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
}

export default function App() {
  return (
    <>
      <AuthBootstrap />
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route element={<RoleRoute allow={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
            <Route element={<RoleRoute allow={['admin', 'manager']} />}>
              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            </Route>
            <Route element={<RoleRoute allow={['admin', 'manager', 'employee']} />}>
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            </Route>
            <Route element={<RoleRoute allow={['admin', 'manager', 'employee']} />}>
              <Route path="/employees" element={<EmployeesList />} />
              <Route path="/employees/:id" element={<EmployeeDetail />} />
            </Route>
            <Route element={<RoleRoute allow={['admin', 'manager']} />}>
              <Route path="/employees/new" element={<EmployeeForm />} />
              <Route path="/employees/:id/edit" element={<EmployeeForm />} />
            </Route>
            <Route element={<RoleRoute allow={['admin', 'manager', 'employee']} />}>
              <Route path="/tasks" element={<TasksList />} />
            </Route>
            <Route element={<RoleRoute allow={['admin', 'manager']} />}>
              <Route path="/tasks/new" element={<TaskForm />} />
              <Route path="/tasks/:id/edit" element={<TaskForm />} />
              <Route path="/tasks/allocate" element={<TaskAllocation />} />
            </Route>
            <Route element={<RoleRoute allow={['admin', 'manager', 'employee']} />}>
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/alerts" element={<AlertsPage />} />
            </Route>
            <Route element={<RoleRoute allow={['admin', 'manager']} />}>
              <Route path="/attrition" element={<AttritionPage />} />
              <Route path="/promotion" element={<PromotionPage />} />
            </Route>
            <Route element={<RoleRoute allow={['admin', 'manager']} />}>
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
