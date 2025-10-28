import React, { useState, useEffect } from 'react';
import StatisticsCard from './StatisticsCard';

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

interface ApiResponse {
  code: number;
  results: any[];
}

const AdminDashboard: React.FC = () => {
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
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      // Fetch all users to calculate stats
      const usersResponse = await fetch('http://localhost:8080/users/getListUser', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!usersResponse.ok) {
        throw new Error(`HTTP error! status: ${usersResponse.status}`);
      }

      const usersData: ApiResponse = await usersResponse.json();
      
      if (usersData.code === 200) {
        const users = usersData.results;
        
        // Calculate statistics
        const totalUsers = users.length;
        const totalDoctors = users.filter(user => 
          user.roles.some((role: any) => role.name === 'DOCTOR')
        ).length;
        const totalPatients = users.filter(user => 
          user.roles.some((role: any) => role.name === 'PATIENT')
        ).length;
        const totalStaff = users.filter(user => 
          user.roles.some((role: any) => role.name === 'STAFF')
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
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching dashboard data:', err);
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
