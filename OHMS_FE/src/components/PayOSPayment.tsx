import React, { useState, useEffect } from "react";
import { axiosInstance } from "../utils/fetchFromAPI";

interface PaymentItem {
  name: string;
  quantity: number;
  price: number;
}

const ProductDisplay: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const paymentRequest = {
        productName: "Mì tôm Hảo Hảo ly",
        description: "Thanh toán đơn hàng",
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        price: 2000,
        items: [
          {
            name: "Mì tôm Hảo Hảo ly",
            quantity: 1,
            price: 2000
          }
        ]
      };

      const response = await axiosInstance.post(
        '/api/v1/payos/create-payment-link',
        paymentRequest
      );

      if (response.data?.results?.checkoutUrl) {
        // Redirect to PayOS checkout page
        window.location.href = response.data.results.checkoutUrl;
      } else {
        alert('Không thể tạo link thanh toán. Vui lòng thử lại!');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Lỗi khi khởi tạo thanh toán. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Thanh toán với PayOS
        </h2>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Tên sản phẩm:</span>
              <span className="font-semibold">Mì tôm Hảo Hảo ly</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Giá tiền:</span>
              <span className="font-semibold text-blue-600">2,000 VNĐ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Số lượng:</span>
              <span className="font-semibold">1</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreatePayment}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang xử lý...
            </span>
          ) : (
            'Tạo Link thanh toán'
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Bạn sẽ được chuyển đến trang thanh toán PayOS
        </p>
      </div>
    </div>
  );
};

interface MessageProps {
  message: string;
  type: 'success' | 'error';
}

const Message: React.FC<MessageProps> = ({ message, type }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
      <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
        type === 'success' ? 'bg-green-100' : 'bg-red-100'
      }`}>
        {type === 'success' ? (
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      
      <h2 className={`text-2xl font-bold mb-4 ${
        type === 'success' ? 'text-green-600' : 'text-red-600'
      }`}>
        {type === 'success' ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
      </h2>
      
      <p className="text-gray-600 mb-6">{message}</p>
      
      <button
        onClick={() => window.location.href = '/'}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all active:scale-95"
      >
        Quay lại trang thanh toán
      </button>
    </div>
  </div>
);

export default function PayOSPayment() {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Check URL parameters for payment status
    const query = new URLSearchParams(window.location.search);

    if (query.get("success") || query.get("status") === "success") {
      setMessage("Thanh toán thành công. Cảm ơn bạn đã sử dụng PayOS!");
      setMessageType('success');
    }

    if (query.get("canceled") || query.get("status") === "cancelled") {
      setMessage(
        "Thanh toán thất bại. Nếu có bất kỳ câu hỏi nào hãy liên hệ support."
      );
      setMessageType('error');
    }
  }, []);

  return message ? (
    <Message message={message} type={messageType} />
  ) : (
    <ProductDisplay />
  );
}
