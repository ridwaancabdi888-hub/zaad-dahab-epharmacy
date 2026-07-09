import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Blocks any route until the session is known to be an authenticated admin. */
export default function RequireAdmin({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'unknown') {
    return (
      <div className="login-screen">
        <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
