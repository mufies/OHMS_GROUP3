import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';  // Sửa: Import named { jwtDecode } thay vì default

const OAuth2RedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');  // Nếu backend gửi error

    if (error) {
      toast.error(`Đăng nhập thất bại: ${error}`);
      navigate('/login');
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      // Optional: Decode token để lấy user info (email, roles từ scope)
      try {
        const decoded = jwtDecode<{ sub?: string; scope?: string; email?: string }>(token);
        console.log('Token decoded:', decoded);  // Log để check: { sub: id, scope: 'patient ...', email: '...' }
        // Lưu thêm nếu cần: localStorage.setItem('user', JSON.stringify(decoded));
      } catch (e) {
        console.error('Invalid token:', e);
        toast.error('Token không hợp lệ!');
        navigate('/login');
        return;
      }
      toast.success('Đăng nhập Google thành công!');
      // Xóa onclose() vì không có prop onClose (nếu cần modal close, pass prop từ parent)
      navigate('/');  // Về home, hoặc '/profile' nếu muốn
    } else {
      toast.error('Không nhận được token từ Google!');
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-4">
        <p className="text-lg">Đang xử lý đăng nhập Google...</p>
        {/* Optional spinner */}
        <div className="mt-4 spinner-border animate-spin inline-block w-8 h-8 border-4 border-blue-500 rounded-full"></div>
      </div>
    </div>
  );
};

export default OAuth2RedirectHandler;