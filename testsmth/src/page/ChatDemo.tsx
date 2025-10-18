import { useEffect } from 'react';
import ChatInterface from '../compoment/ChatInterface';

const ChatDemo = () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    role: 'patient' as const,
    email: 'john.doe@email.com',
    isOnline: true,
  };

  useEffect(() => {
    // Clear any existing login data to prevent conflicts
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }, []);

  const handleClose = () => {
    // Navigate back to home instead of just logging
    window.location.href = '/';
  };

  return (
    <div className="h-screen">
      <div className="absolute top-4 left-4 z-50">
        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
          Demo Mode
        </span>
      </div>
      <ChatInterface 
        currentUser={mockUser} 
        onClose={handleClose} 
      />
    </div>
  );
};

export default ChatDemo;