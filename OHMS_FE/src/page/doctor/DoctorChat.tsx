import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorChat from '../../components/doctor/chat/doctorChat.tsx'
import Navigator from '../../components/doctor/navigator.tsx'

interface User {
  id: string;
  role: 'doctor' | 'patient';
}

const DoctorChatPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
    const payload = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));   
      if (decodedPayload.scope === 'ROLE_DOCTOR') {
          const transformedUser: User = {
          id: decodedPayload.userId,
          role: 'doctor',
        };
        setCurrentUser(transformedUser);
    } 
    navigate('/doctor/chat')
  

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
          <p className="text-gray-600">Đang tải tin nhắn...</p>
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