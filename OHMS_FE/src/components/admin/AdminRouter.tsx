import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminGuard from './AdminGuard';
import AdminDashboardPage from '../../page/admin/AdminDashboardPage';
import DoctorManagementPage from '../../page/admin/DoctorManagementPage';
import StaffManagementPage from '../../page/admin/StaffManagementPage';

const AdminRouter: React.FC = () => {
  return (
    <AdminGuard>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="/doctors" element={<DoctorManagementPage />} />
          <Route path="/staff" element={<StaffManagementPage />} />
          <Route path="/services" element={<div className="p-6"><h1 className="text-2xl font-bold">Quản lý Dịch vụ - Đang phát triển</h1></div>} />
          <Route path="*" element={<Navigate to="/admin/" replace />} />
        </Routes>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminRouter;
