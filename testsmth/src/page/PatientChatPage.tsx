import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientChat from '../compoment/PatientChat';

interface User {
  id: string;
  name: string;
  role: 'doctor' | 'patient';
  email: string;
  patientId?: string;
}

const PatientChatPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user from localStorage or redirect to login
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      const user = JSON.parse(storedUser);
      if (user.role === 'patient') {
        setCurrentUser(user);
      } else {
        // If not a patient, redirect to appropriate page
        navigate('/doctor/chat');
      }
    } else {
      // No user logged in, redirect to main page
      navigate('/');
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
    <PatientChat 
      currentUser={currentUser} 
      onClose={handleClose} 
    />
  );
};

export default PatientChatPage;