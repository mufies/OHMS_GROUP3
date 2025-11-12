import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../utils/fetchFromAPI";

function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'failure'>('processing');
  const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');
  const [paymentDetails, setPaymentDetails] = useState<{
    depositPaid: number;
    totalAmount: number;
    remainingAmount: number;
    discount: number;
  } | null>(null);
  
  // THÊM useRef để track đã call API chưa
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    if (hasCalledAPI.current) return;
    
    const handlePaymentCallback = async () => {
      // MARK là đã call
      hasCalledAPI.current = true;
      
      // PayOS parameters
      const code = searchParams.get('code');
      const id = searchParams.get('id');
      const cancel = searchParams.get('cancel');
      const status = searchParams.get('status');
      const orderCode = searchParams.get('orderCode');
      
      const bookingDataStr = sessionStorage.getItem('pendingBooking');
      
      if (!bookingDataStr) {
        setStatus('failure');
        setMessage('Không tìm thấy thông tin đặt khám. Vui lòng thử lại.');
        setTimeout(() => navigate('/booking-schedule'), 3000);
        return;
      }

      const bookingData = JSON.parse(bookingDataStr);
      
      // Calculate payment details if discount and deposit are available
      if (bookingData.discount && bookingData.deposit) {
        const totalAmount = bookingData.totalAmount || 0;
        const depositPaid = bookingData.deposit;
        const remainingAmount = totalAmount - depositPaid - (totalAmount * bookingData.discount / 100);
        
        setPaymentDetails({
          depositPaid,
          totalAmount,
          remainingAmount,
          discount: bookingData.discount
        });
      }
      
      // PayOS success: code=00 and status=PAID or cancel=false
      if (code === '00' && cancel !== 'true' && (status === 'PAID' || !cancel)) {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            setStatus('failure');
            setMessage('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
            // Decode JWT to get userId
            const decodeJWT = (token: string) => {
            try {
              const payload = token.split('.')[1];
              const decoded = JSON.parse(atob(payload));
              return decoded;
            } catch (error) {
              throw new Error('Invalid JWT token');
            }
            };
            const decodedToken = decodeJWT(token);
            const userId = decodedToken.userId;
          
          // Check if this is a preventive service booking (no doctor)
          if (bookingData.bookingType === 'PREVENTIVE_SERVICE') {
            // For preventive services: create appointments for each service
            const serviceIds = bookingData.medicalExaminationIds;
            
            for (let i = 0; i < serviceIds.length; i++) {
              const appointmentData = {
                patientId: userId,
                workDate: bookingData.workDate,
                startTime: bookingData.startTime,
                endTime: bookingData.endTime,
                medicalExaminationIds: [serviceIds[i]],
                discount: bookingData.discount || 0,
                deposit: bookingData.deposit || 0,
                depositStatus: bookingData.depositStatus || 'PENDING'
              };

              await axiosInstance.post(
                '/appointments',
                appointmentData
              );
            }

            setStatus('success');
            setMessage('Đặt lịch dịch vụ y tế dự phòng thành công!');
            sessionStorage.removeItem('pendingBooking');
            setTimeout(() => navigate('/patient/appointments'), 3000);
          } else if (bookingData.bookingType === 'CONSULTATION_ONLY') {
            // For CONSULTATION_ONLY: single parent appointment with doctor and "Khám bệnh" service
            const parentAppointmentData = {
              patientId: userId,
              doctorId: bookingData.doctorId,
              workDate: bookingData.workDate,
              startTime: bookingData.startTime,
              endTime: bookingData.endTime,
              medicalExaminationIds: bookingData.medicalExaminationIds || [],
              discount: bookingData.discount || 0,
              deposit: bookingData.deposit || 0,
              depositStatus: 'DEPOSIT' // Payment successful, mark as deposit paid
            };

            console.log('Creating consultation-only appointment:', parentAppointmentData);

            await axiosInstance.post(
              '/appointments',
              parentAppointmentData
            );

            setStatus('success');
            setMessage('Đặt khám thành công! Cảm ơn bạn đã sử dụng dịch vụ.');
            sessionStorage.removeItem('pendingBooking');
            setTimeout(() => navigate('/patient/appointments'), 3000);
          } else if (bookingData.bookingType === 'SERVICE_AND_CONSULTATION') {
            // For SERVICE_AND_CONSULTATION: create parent + child appointments with specific times
            
            // Step 1: Create parent appointment with doctor (consultation time) and "Khám bệnh" service
            const consultationSlot = bookingData.consultationSlot;
            const parentAppointmentData = {
              patientId: userId,
              doctorId: bookingData.doctorId,
              workDate: bookingData.workDate,
              startTime: consultationSlot.startTime,
              endTime: consultationSlot.endTime,
              medicalExaminationIds: bookingData.medicalExaminationIds || [], // Include "Khám bệnh" service
              discount: bookingData.discount || 0,
              deposit: bookingData.deposit || 0,
              depositStatus: 'DEPOSIT' // Payment successful, mark as deposit paid
            };

            console.log('Creating parent appointment with consultation time:', parentAppointmentData);

            const parentResponse = await axiosInstance.post(
              '/appointments',
              parentAppointmentData
            );

            if (parentResponse.status !== 201) {
              throw new Error('Failed to create parent appointment');
            }

            const parentAppointmentId = parentResponse.data?.id;
            
            if (!parentAppointmentId) {
              throw new Error('Parent appointment ID not found in response');
            }

            console.log('Parent appointment created with ID:', parentAppointmentId);

            // Step 2: Create child appointments for each service with their specific times
            const serviceSlots = bookingData.serviceSlots;
            
            for (let i = 0; i < serviceSlots.length; i++) {
              const serviceSlot = serviceSlots[i];
              const childAppointmentData = {
                patientId: userId,
                workDate: bookingData.workDate,
                startTime: serviceSlot.startTime,
                endTime: serviceSlot.endTime,
                medicalExaminationIds: [serviceSlot.serviceId],
                parentAppointmentId: parentAppointmentId,
                discount: 0, // Child appointments don't need discount info (parent has it)
                deposit: 0,
                depositStatus: 'DEPOSIT'
              };

              console.log(`Creating child appointment ${i + 1}/${serviceSlots.length}:`, childAppointmentData);

              await axiosInstance.post(
                '/appointments',
                childAppointmentData
              );
            }

            setStatus('success');
            setMessage('Đặt khám thành công! Cảm ơn bạn đã sử dụng dịch vụ.');
            sessionStorage.removeItem('pendingBooking');
            setTimeout(() => navigate('/patient/appointments'), 3000);
          } else {
            // Legacy fallback for old booking format
            const parentAppointmentData = {
              patientId: userId,
              doctorId: bookingData.doctorId,
              workDate: bookingData.workDate,
              startTime: bookingData.startTime,
              endTime: bookingData.endTime,
              medicalExaminationIds: [],
              discount: bookingData.discount || 0,
              deposit: bookingData.deposit || 0,
              depositStatus: 'DEPOSIT'
            };

            console.log('Creating appointment (legacy format):', parentAppointmentData);

            await axiosInstance.post(
              '/appointments',
              parentAppointmentData
            );

            setStatus('success');
            setMessage('Đặt khám thành công! Cảm ơn bạn đã sử dụng dịch vụ.');
            sessionStorage.removeItem('pendingBooking');
            setTimeout(() => navigate('/patient/appointments'), 3000);
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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Thanh toán thành công!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <div className="text-sm font-semibold text-blue-900 mb-3">Chi tiết thanh toán:</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="text-blue-700">Đã đặt cọc:</span>
                    <span className="font-bold text-blue-700">
                      {paymentDetails.depositPaid.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-blue-200">
                    <span className="text-orange-700 font-semibold">Còn lại (thanh toán khi khám):</span>
                    <span className="font-bold text-orange-700">
                      {paymentDetails.remainingAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            )}
            
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
              onClick={() => navigate('/')}
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
