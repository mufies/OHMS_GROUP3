import React from 'react';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
}

const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      title: 'Thêm Bác sĩ',
      description: 'Tạo tài khoản bác sĩ mới',
      icon: '👨‍⚕️',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => {
        // Navigate to doctor management
        console.log('Navigate to add doctor');
      }
    },
    {
      title: 'Thêm Nhân viên',
      description: 'Tạo tài khoản nhân viên mới',
      icon: '👨‍💼',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => {
        // Navigate to staff management
        console.log('Navigate to add staff');
      }
    },
    {
      title: 'Xem Báo cáo',
      description: 'Xem báo cáo thống kê chi tiết',
      icon: '📊',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => {
        // Navigate to reports
        console.log('Navigate to reports');
      }
    },
    {
      title: 'Cài đặt Hệ thống',
      description: 'Cấu hình các tham số hệ thống',
      icon: '⚙️',
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => {
        // Navigate to system settings
        console.log('Navigate to system settings');
      }
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Thao tác nhanh</h3>
      <div className="space-y-3 flex-1">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`w-full ${action.color} text-white p-3 rounded-lg transition-colors flex items-center space-x-3`}
          >
            <span className="text-xl">{action.icon}</span>
            <div className="text-left">
              <div className="font-medium">{action.title}</div>
              <div className="text-sm opacity-90">{action.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
