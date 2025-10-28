import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // For now, we'll allow access if token exists
        // In a real app, you would:
        // 1. Decode the JWT token
        // 2. Check if user has ADMIN role
        // 3. Make an API call to verify admin status
        
        // Mock admin check - you can replace this with actual role checking
        setIsAdmin(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        setIsAdmin(false);
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;
