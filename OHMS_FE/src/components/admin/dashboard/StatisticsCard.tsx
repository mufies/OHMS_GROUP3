import React from 'react';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'pink' | 'yellow' | 'teal';
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  icon,
  color,
  change,
  changeType = 'neutral'
}) => {
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      purple: 'bg-purple-500 text-white',
      orange: 'bg-orange-500 text-white',
      indigo: 'bg-indigo-500 text-white',
      pink: 'bg-pink-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      teal: 'bg-teal-500 text-white',
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500 text-white';
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return '↗';
      case 'negative':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${getChangeColor(changeType)}`}>
                {getChangeIcon(changeType)} {change}
              </span>
              <span className="text-sm text-gray-500 ml-1">so với tháng trước</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${getColorClasses(color)} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatisticsCard;
