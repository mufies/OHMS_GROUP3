import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserMd, 
  faUserInjured
} from '@fortawesome/free-solid-svg-icons';
import AuthForm from '../compoment/LoginForm';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'patient';
  phone?: string;
  specialization?: string;
  patientId?: string;
}

const MainApp = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      // Redirect to appropriate chat based on user role
      if (user.role === 'patient') {
        window.location.href = '/patient/chat';
      } else if (user.role === 'doctor') {
        window.location.href = '/doctor/chat';
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Redirect to appropriate chat based on user role
    if (user.role === 'patient') {
      window.location.href = '/patient/chat';
    } else if (user.role === 'doctor') {
      window.location.href = '/doctor/chat';
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center w-full">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Online Healthcare Management System
          </h1>
          <p className="text-xl text-gray-600">
            Connecting patients and doctors through secure communication
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="flex space-x-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <FontAwesomeIcon icon={faUserInjured} className="text-2xl text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Patients</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <FontAwesomeIcon icon={faUserMd} className="text-2xl text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Doctors</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowLogin(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg mb-3"
          >
            Get Started
          </button>
          
          <button
            onClick={() => window.location.href = '/chat-demo'}
            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Try Demo
          </button>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Secure • HIPAA Compliant • 24/7 Available</p>
            <p className="mt-2">
              <a 
                href="/chat-demo" 
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Try Chat Demo
              </a>
            </p>
          </div>
        </div>
      </div>
      
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              ×
            </button>
            <AuthForm 
              onClose={() => setShowLogin(false)}
              onLoginSuccess={handleLogin}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MainApp;