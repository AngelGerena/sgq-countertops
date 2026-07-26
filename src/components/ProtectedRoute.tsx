import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, admin, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="boot">Loading</div>;
  if (!session) return <Navigate to="/admin/login" state={{ from: loc.pathname }} replace />;
  if (!admin) {
    return (
      <div className="boot boot-msg">
        <h1>No portal access</h1>
        <p>This account is signed in but is not set up as an administrator.</p>
      </div>
    );
  }
  return <>{children}</>;
}
