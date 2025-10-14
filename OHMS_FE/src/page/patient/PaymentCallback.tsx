import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'failure'>('processing');
  const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');
  
  // THÊM useRef để track đã call API chưa
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    // NẾU ĐÃ CALL RỒI THÌ RETURN
    if (hasCalledAPI.current) return;
    
    const handlePaymentCallback = async () => {
      // MARK là đã call
      hasCalledAPI.current = true;
      
      const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
      const vnp_TransactionStatus = searchParams.get('vnp_TransactionStatus');
      
      const bookingDataStr = sessionStorage.getItem('pendingBooking');
      
      if (!bookingDataStr) {
        setStatus('failure');
        setMessage('Không tìm thấy thông tin đặt khám. Vui lòng thử lại.');
        setTimeout(() => navigate('/booking-schedule'), 3000);
        return;
      }

      const bookingData = JSON.parse(bookingDataStr);
      
      if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
        try {
          const token = localStorage.getItem('accessToken');
          const userId = localStorage.getItem('userId');
          
          const appointmentData = {
            patientId: userId,
            doctorId: bookingData.doctorId,
            workDate: bookingData.workDate,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            medicalExaminationIds: bookingData.medicalExaminationIds
          };

          console.log('Creating appointment:', appointmentData);

          const response = await axios.post(
            'http://localhost:8080/appointments',
            appointmentData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            }
          );

          if (response.status === 201) {
            setStatus('success');
            setMessage('Đặt khám thành công! Cảm ơn bạn đã sử dụng dịch vụ.');
            
            sessionStorage.removeItem('pendingBooking');
            
            setTimeout(() => navigate('/patient/appointments'), 3000);
          } else {
            throw new Error('Failed to create appointment');
          }
        } catch (error: any) {
          console.error('Error creating appointment:', error);
          console.error('Error response:', error.response?.data);
          
          setStatus('failure');
          setMessage(
            error.response?.data?.message || 
            'Thanh toán thành công nhưng không thể tạo lịch hẹn. Vui lòng liên hệ hỗ trợ.'
          );
        }
      } else {
        setStatus('failure');
        setMessage('Thanh toán thất bại. Vui lòng thử lại.');
        
        sessionStorage.removeItem('pendingBooking');
        
        setTimeout(() => navigate('/booking-schedule'), 3000);
      }
    };

    handlePaymentCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{message}</h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Thành công!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="text-sm text-gray-500">
              Bạn sẽ được chuyển đến danh sách lịch hẹn...
            </div>
          </>
        )}
        
        {status === 'failure' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Thất bại!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/booking-schedule')}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Quay lại
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentCallback;
