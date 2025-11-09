import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StaffNavigator from "../../components/staff/StaffNavigator";
import DoctorScheduleManager from "../../components/staff/DoctorScheduleManager";
import AppointmentManager from "../../components/staff/AppointmentManager";
import CancelRequestManager from "../../components/staff/CancelRequestManager";
import WeekScheduleManager from "../../components/staff/WeekScheduleManager";

type TabType = "weekSchedule" | "schedule" | "appointments" | "cancellations";

interface Role {
  name: string;
  description: string | null;
  permissions: string[];
}

interface StaffInfo {
  id: string;
  username: string;
  email: string;
  phone: number;
  medicleSpecially: string[];
  imageUrl: string | null;
}

interface UserResponse {
  code: number;
  results: {
    id: string;
    username: string;
    email: string;
    roles: Role[];
    phone: number;
    gender: string | null;
    dob: string | null;
    imageUrl: string | null;
    bankNumber: string | null;
    bankName: string | null;
    medicleSpecially: string[];
  };
}

// Helper: Decode JWT token
const decodeJWT = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("weekSchedule");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStaffAccess = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          console.error('No access token found');
          navigate('/');
          return;
        }

        // Decode JWT to get userId
        const decodedToken = decodeJWT(token);
        const userId = decodedToken?.userId || decodedToken?.sub;

        if (!userId) {
          console.error('No userId found in token');
          navigate('/');
          return;
        }

        // Call API to check user role
        const response = await axios.get<UserResponse>(
          `http://localhost:8080/users/findUser/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Check if user has STAFF role
        const hasStaffRole = response.data.results.roles.some(
          (role) => role.name === 'STAFF'
        );

        if (hasStaffRole) {
          setIsAuthorized(true);
          // Set staff info
          const userData = response.data.results;
          setStaffInfo({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            phone: userData.phone,
            medicleSpecially: userData.medicleSpecially || [],
            imageUrl: userData.imageUrl
          });
        } else {
          console.warn('User does not have STAFF role');
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking staff access:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkStaffAccess();
  }, [navigate]);

  const tabs = [
    { 
      id: "weekSchedule" as TabType, 
      label: "Lịch tuần",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: "schedule" as TabType, 
      label: "Quản lý hẹn bác sĩ",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: "appointments" as TabType, 
      label: "Yêu cầu dời lịch",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    { 
      id: "cancellations" as TabType, 
      label: "Yêu cầu hủy lịch",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Not authorized - shouldn't reach here due to navigate, but good fallback
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StaffNavigator />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bảng điều khiển Staff
            </h1>
            <p className="text-gray-600">Quản lý lịch làm việc bác sĩ và xử lý yêu cầu</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === "weekSchedule" && <WeekScheduleManager staffInfo={staffInfo} />}
            {activeTab === "schedule" && <DoctorScheduleManager staffInfo={staffInfo} />}
            {activeTab === "appointments" && <AppointmentManager staffInfo={staffInfo} />}
            {activeTab === "cancellations" && <CancelRequestManager />}
          </div>
        </div>
      </div>
    </div>
  );
}
