import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorChat from '../../compoment/doctor/chat/doctorChat.tsx'
import Navigator from '../../compoment/doctor/navigator.tsx'

interface User {
  id: string;
  username: string;
  role: 'doctor' | 'patient';
  email: string;
  specialization?: string;
}

const DoctorChatPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('accessToken');
    
    if (storedUser && token) {
      const user = JSON.parse(storedUser);
      if (user.role === 'doctor') {
        // Transform user object to match expected interface
        const transformedUser: User = {
          id: user.id,
          username: user.username || user.name, 
          role: user.role,
          email: user.email,
          specialization: user.specialization
        };
        setCurrentUser(transformedUser);
      } else {
        // If not a doctor, redirect to patient chat
        navigate('/patient/chat');
      }
    } else {
      // No user logged in, redirect to main page
      navigate('/');
    }
  }, [navigate]);



  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Navigator doctorSpecialty="Cardiology"/>
      <div className="flex-1 ml-64" style={{minWidth: 'calc(100vw - 16rem)'}}>
        <div className="w-full h-screen">
          <DoctorChat 
            currentUser={currentUser} 
          />
        </div>
      </div>
    </div>
  );
};

export default DoctorChatPage;