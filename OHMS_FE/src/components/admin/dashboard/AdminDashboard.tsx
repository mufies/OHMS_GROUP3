import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatisticsCard from './StatisticsCard';
import { axiosInstance } from '../../../utils/fetchFromAPI';

interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalStaff: number;
  totalAppointments: number;
  todayAppointments: number;
  monthlyRevenue: number;
  activeDoctors: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalStaff: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    activeDoctors: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Check if token exists
      const token = localStorage.getItem('accessToken');
      console.log('Token exists:', !!token);
      console.log('Token value:', token ? token.substring(0, 50) + '...' : 'None');
      
      if (!token) {
        setError('No access token found. Please login again.');
        setLoading(false);
        navigate('/login');
        return;
      }

      // Fetch all users to calculate stats
      const usersResponse = await axiosInstance.get('/users/getListUser');

      if (usersResponse.data?.code === 200 && usersResponse.data?.results) {
        const users = usersResponse.data.results;
        console.log('Fetched users:', users.length);
        
        // Calculate statistics
        const totalUsers = users.length;
        const totalDoctors = users.filter((user: any) => 
          user.role === 'ROLE_DOCTOR' || user.roles?.some((r: any) => r.name === 'DOCTOR' || r === 'ROLE_DOCTOR')
        ).length;
        const totalPatients = users.filter((user: any) =>
          user.role === 'ROLE_PATIENT' || user.roles?.some((r: any) => r.name === 'PATIENT' || r === 'ROLE_PATIENT')
        ).length;
        const totalStaff = users.filter((user: any) =>
          user.role === 'ROLE_STAFF' || user.roles?.some((r: any) => r.name === 'STAFF' || r === 'ROLE_STAFF')
        ).length;
        const activeDoctors = totalDoctors; // Assuming all doctors are active for now

        setStats({
          totalUsers,
          totalDoctors,
          totalPatients,
          totalStaff,
          totalAppointments: 0, // Will be updated when appointment API is available
          todayAppointments: 0, // Will be updated when appointment API is available
          monthlyRevenue: 0, // Will be updated when revenue API is available
          activeDoctors,
        });
        setError(null);
      } else {
        throw new Error('Failed to fetch dashboard data: Invalid response format');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.status === 401 
        ? 'Unauthorized: Your session may have expired. Please login again.'
        : err?.response?.data?.message || (err instanceof Error ? err.message : 'An error occurred while fetching dashboard data');
      
      setError(errorMessage);
      console.error('Error fetching dashboard data:', err);
      console.error('Error status:', err?.response?.status);
      console.error('Error data:', err?.response?.data);
      console.error('Full error:', err);
      
      // Redirect to login if 401
      if (err?.response?.status === 401) {
        setTimeout(() => navigate('/login'), 2000);
      }
      
      // Set default stats when error occurs
      setStats({
        totalUsers: 0,
        totalDoctors: 0,
        totalPatients: 0,
        totalStaff: 0,
        totalAppointments: 0,
        todayAppointments: 0,
        monthlyRevenue: 0,
        activeDoctors: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Đang tải dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-lg">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Tổng quan hệ thống OHMS</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatisticsCard
          title="Tổng người dùng"
          value={stats.totalUsers}
          icon="👥"
          color="blue"
          change="+12%"
          changeType="positive"
        />
        <StatisticsCard
          title="Bác sĩ"
          value={stats.totalDoctors}
          icon="👨‍⚕️"
          color="green"
          change="+8%"
          changeType="positive"
        />
        <StatisticsCard
          title="Bệnh nhân"
          value={stats.totalPatients}
          icon="🏥"
          color="purple"
          change="+15%"
          changeType="positive"
        />
        <StatisticsCard
          title="Nhân viên"
          value={stats.totalStaff}
          icon="👨‍💼"
          color="orange"
          change="+5%"
          changeType="positive"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatisticsCard
          title="Cuộc hẹn hôm nay"
          value={stats.todayAppointments}
          icon="📅"
          color="indigo"
          change="+3"
          changeType="positive"
        />
        <StatisticsCard
          title="Tổng cuộc hẹn"
          value={stats.totalAppointments}
          icon="📋"
          color="pink"
          change="+25%"
          changeType="positive"
        />
        <StatisticsCard
          title="Doanh thu tháng"
          value={`${stats.monthlyRevenue.toLocaleString()} VNĐ`}
          icon="💰"
          color="yellow"
          change="+18%"
          changeType="positive"
        />
        <StatisticsCard
          title="Bác sĩ hoạt động"
          value={stats.activeDoctors}
          icon="✅"
          color="teal"
          change="100%"
          changeType="positive"
        />
      </div>

    </div>
  );
};

export default AdminDashboard;
