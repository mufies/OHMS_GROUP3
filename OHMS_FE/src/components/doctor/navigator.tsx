import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTableColumns,
    faStethoscope,
    faComment,
    faCalendar,
    faUser,
    faRightFromBracket, // Logout icon
    faClipboardList, // Pending requests icon
} from "@fortawesome/free-solid-svg-icons";
import { LOGIN_USER } from "../../constant/enum";

interface NavigatorProps {
    doctorSpecialty?: string;
}

function Navigator({ doctorSpecialty = "General Medicine" }: NavigatorProps) {
    const navigationItems = [
        { icon: faTableColumns, label: "Bảng điều khiển", path: "/doctor"},
        { icon: faClipboardList, label: "Yêu cầu chờ", path: "/doctor/pending-requests" },
        { icon: faComment, label: "Tin nhắn", path: "/doctor/chat" },
        { icon: faCalendar, label: "Lịch làm việc", path: "/doctor/schedule" },
        { icon: faUser, label: "Hồ sơ", path: "/doctor/profile" },
    ];

    const handleNavigation = (path: string) => {
        window.location.href = path;
    };

    const handleLogout = () => {
        // Remove the access token from localStorage
        localStorage.removeItem(LOGIN_USER);
        
        // Optionally remove refresh token if you're storing it
        localStorage.removeItem('refreshToken');
        
        // Redirect to login page
        window.location.href = '/';
    };

    const currentPath = window.location.pathname;

    return (
        <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col">
            {/* Doctor Specialty Header */}
            <div className="bg-white text-[#0085b9] p-6 border-t border-b border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-[#0085b9] bg-opacity-20 rounded-full p-3 text-white">
                        <FontAwesomeIcon icon={faStethoscope} className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-l font-bold text-black ">Cổng Bác sĩ</h2>
                    </div>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-6">
                <p className="text-gray-500 px-3 font-bold mb-2 text-sm">CHUNG</p>
                <ul className="space-y-1 px-3">
                    {navigationItems.map((item, index) => (
                        <li key={index}>
                            <button
                                onClick={() => handleNavigation(item.path)}
                                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                                    currentPath === item.path
                                        ? 'bg-[#0085b9] text-white text-sm shadow-sm'
                                        : 'text-gray-700 hover:bg-white hover:text-[#0085b9]'
                                } `}
                            >
                                <FontAwesomeIcon
                                    icon={item.icon}
                                    className={`text-base ${
                                        currentPath === item.path ? 'text-white' : 'text-gray-500'
                                    }`}
                                />
                                <span className="text-sm">{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>

                {/* Logout Button */}
                <div className="px-3 mt-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-all duration-200 cursor-pointer text-red-600 hover:bg-red-50"
                    >
                        <FontAwesomeIcon
                            icon={faRightFromBracket}
                            className="text-base text-red-500"
                        />
                        <span className="text-sm font-medium">Đăng xuất</span>
                    </button>
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                    OACHS Cổng Bác sĩ v1.0
                </p>
                <p className="text-xs text-gray-400 text-center mt-1">
                    © 2025 Hệ thống Y tế
                </p>
            </div>
        </div>
    );
}

export default Navigator;
