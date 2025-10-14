import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import { fetchLoginUser } from '../utils/fetchFromAPI';
import { toast } from 'react-toastify';
// login với register ông nào làm hơi bừa nhenn =))
interface LoginProps {
  onClose: () => void;
}

const Login = ({ onClose }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLoginUser(email, password).then((data) => {
      console.log('Login successful:', data);
      localStorage.setItem('token', data.token);
      onClose();
    }).catch((error) => {
      console.error('Login failed:', error);
      toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    });
  };
// thay cái Login thành Profile thật
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FontAwesomeIcon icon={faUser} className="mr-2" />
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FontAwesomeIcon icon={faLock} className="mr-2" />
              Mật khẩu
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-black py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
