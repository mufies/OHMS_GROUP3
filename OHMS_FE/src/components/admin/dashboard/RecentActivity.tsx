import React, { useState, useEffect } from 'react';

interface Activity {
  id: string;
  type: 'user_created' | 'doctor_approved' | 'appointment_created' | 'system_update';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  icon: string;
  color: string;
}

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate loading activities
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'user_created',
        title: 'Người dùng mới đăng ký',
        description: 'Bệnh nhân Nguyễn Văn A đã đăng ký tài khoản',
        timestamp: '2 phút trước',
        user: 'Nguyễn Văn A',
        icon: '👤',
        color: 'bg-blue-100 text-blue-600'
      },
      {
        id: '2',
        type: 'doctor_approved',
        title: 'Bác sĩ được phê duyệt',
        description: 'Bác sĩ Trần Thị B đã được phê duyệt tài khoản',
        timestamp: '15 phút trước',
        user: 'Trần Thị B',
        icon: '👨‍⚕️',
        color: 'bg-green-100 text-green-600'
      },
      {
        id: '3',
        type: 'appointment_created',
        title: 'Cuộc hẹn mới',
        description: 'Cuộc hẹn với bác sĩ Lê Văn C đã được tạo',
        timestamp: '1 giờ trước',
        user: 'Phạm Thị D',
        icon: '📅',
        color: 'bg-purple-100 text-purple-600'
      },
      {
        id: '4',
        type: 'system_update',
        title: 'Cập nhật hệ thống',
        description: 'Hệ thống đã được cập nhật lên phiên bản mới',
        timestamp: '2 giờ trước',
        user: 'Admin',
        icon: '⚙️',
        color: 'bg-orange-100 text-orange-600'
      },
      {
        id: '5',
        type: 'user_created',
        title: 'Người dùng mới đăng ký',
        description: 'Bệnh nhân Hoàng Văn E đã đăng ký tài khoản',
        timestamp: '3 giờ trước',
        user: 'Hoàng Văn E',
        icon: '👤',
        color: 'bg-blue-100 text-blue-600'
      }
    ];

    // Simulate API call
    setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 1000);
  }, []);

  const getActivityTypeText = (type: string) => {
    switch (type) {
      case 'user_created':
        return 'Người dùng mới';
      case 'doctor_approved':
        return 'Bác sĩ được phê duyệt';
      case 'appointment_created':
        return 'Cuộc hẹn mới';
      case 'system_update':
        return 'Cập nhật hệ thống';
      default:
        return 'Hoạt động';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Hoạt động gần đây</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Hoạt động gần đây</h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Xem tất cả
        </button>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Không có hoạt động nào gần đây
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center text-sm`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 ml-2">
                    {activity.timestamp}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500">
                    Bởi: {activity.user}
                  </span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${activity.color}`}>
                    {getActivityTypeText(activity.type)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
