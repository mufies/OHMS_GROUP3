import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientChat from '../../components/patient/PatientChat';
import Navigator from '../../components/Navigator';

interface User {
  id: string;
  role: 'doctor' | 'patient';
}

const PatientChatPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));   
      
      if (decodedPayload.scope === 'ROLE_patient') {
        const transformedUser: User = {
          id: decodedPayload.userId,
          role: 'patient',
        };
        setCurrentUser(transformedUser);
      } else if (decodedPayload.scope === 'doctor') {
        // Nếu là doctor, redirect tới doctor chat
        navigate('/doctor/chat', { replace: true });
      } else {
        // Nếu scope khác, redirect tới home
        navigate('/', { replace: true });
      }
    } else {
      // No user logged in, redirect to main page
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleClose = () => {
    // Navigate back to main page
    navigate('/');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigator />
      <div className="pt-14">
        <PatientChat 
          currentUser={currentUser} 
          onClose={handleClose} 
        />
      </div>
    </>
  );

};

export default PatientChatPage;