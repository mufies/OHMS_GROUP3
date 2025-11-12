import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;
  scope: string;
  sub: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/' 
}: ProtectedRouteProps) => {
  const token = localStorage.getItem('accessToken');

  // Check if token exists
  if (!token) {
    console.warn('⚠️ No token found, redirecting to home');
    return <Navigate to={redirectTo} replace />;
  }

  try {
    // Decode token
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Check if token is expired
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      console.warn('⚠️ Token expired, redirecting to home');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
      return <Navigate to={redirectTo} replace />;
    }

    // Check role if allowedRoles is specified
    if (allowedRoles.length > 0) {
      const userRole = decoded.scope;
      
      if (!allowedRoles.includes(userRole)) {
        console.warn(`⚠️ Access denied. User role: ${userRole}, Required: ${allowedRoles.join(', ')}`);
        return <Navigate to={redirectTo} replace />;
      }
    }

    // All checks passed
    return <>{children}</>;
    
  } catch (error) {
    console.error('❌ Invalid token:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    return <Navigate to={redirectTo} replace />;
  }
};

export default ProtectedRoute;
