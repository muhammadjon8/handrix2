import { Navigate } from 'react-router-dom';
import { useStore } from '../store';
import type { UserRole } from '../types';

const roleHome: Record<UserRole, string> = {
  CLIENT: '/client/home',
  HANDYMAN: '/handyman/jobs',
  ADMIN: '/admin/dashboard',
};

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return <>{children}</>;
}
