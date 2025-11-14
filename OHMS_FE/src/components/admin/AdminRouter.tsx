import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminGuard from './AdminGuard';
import AdminDashboardPage from '../../page/admin/AdminDashboardPage';
import DoctorManagementPage from '../../page/admin/DoctorManagementPage';
import StaffManagementPage from '../../page/admin/StaffManagementPage';
import ServiceManagementPage from '../../page/admin/ServiceManagementPage';

const AdminRouter: React.FC = () => {
  return (
    <AdminGuard>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="/doctors" element={<DoctorManagementPage />} />
          <Route path="/staff" element={<StaffManagementPage />} />
          <Route path="/services" element={<ServiceManagementPage />} />
          <Route path="*" element={<Navigate to="/admin/" replace />} />
        </Routes>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminRouter;
