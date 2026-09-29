/**
 * ProtectedRoute.jsx — Route guard for authenticated + role-based access
 * Usage:
 *   <ProtectedRoute role="beneficiary">
 *     <BeneficiaryDashboard />
 *   </ProtectedRoute>
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to role-specific login, preserve intended destination
    const loginPath = role === 'counsellor' ? '/login/counsellor' : '/login/beneficiary';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    // Wrong role — send to appropriate dashboard
    const correctPath = user?.role === 'counsellor' ? '/counsellor' : '/beneficiary';
    return <Navigate to={correctPath} replace />;
  }

  return children;
}
