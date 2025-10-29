import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../utils/fetchFromAPI";
import { toast } from "sonner";
import Navigator from "../Navigator";

// 🩺 Interfaces
interface MedicineInfo {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
}

interface MedicalExaminationInfo {
  id: string;
  name: string;
  price: number;
}

interface PrescriptionInfo {
  id: string;
  amount: number;
  status: string;
  medicines: MedicineInfo[];
}

interface MedicalRecord {
  id: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  symptoms: string;
  diagnosis: string;
  prescription: PrescriptionInfo | null;
  medicalExaminations: MedicalExaminationInfo[] | null;
  createdAt: string;
}

export default function PatientMedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🧠 Lấy patientId từ token
  const getPatientId = () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId;
    } catch (error) {
      console.error("❌ Lỗi decode token:", error);
      return null;
    }
  };

  useEffect(() => {
    const patientId = getPatientId();

    if (!patientId) {
      setError("Không tìm thấy ID bệnh nhân.");
      setLoading(false);
      return;
    }

    const fetchRecords = async () => {
      try {
        console.log(`🔍 Fetching records for patientId: ${patientId}`);
        const res = await axiosInstance.get(`/medical-records/patient/${patientId}`);
        console.log("🧾 Full Response:", res.data);

        if (res.data?.results && Array.isArray(res.data.results)) {
          console.log(`✅ Tải được ${res.data.results.length} hồ sơ`);
          setRecords(res.data.results);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error("❌ Lỗi fetch:", err);
        setError("Không thể tải hồ sơ bệnh án.");
        toast.error("Không thể tải hồ sơ bệnh án!");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  // ⏳ Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Đang tải hồ sơ bệnh án...</p>
      </div>
    );
  }

  // ❌ Lỗi
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <svg className="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  // ❌ Không có dữ liệu
  if (records.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🧾 Hồ sơ bệnh án</h2>
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-lg">Chưa có hồ sơ bệnh án nào</p>
        </div>
      </div>
    );
  }

  // ✅ Hiển thị danh sách hồ sơ
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Navigator />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🧾 Hồ sơ bệnh án của tôi</h2>

      {records.map((r) => (
        <div key={r.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {r.doctorName || "Chưa có bác sĩ"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Chuyên khoa: <span className="font-medium">{r.doctorSpecialty || "--"}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Ngày khám: <span className="font-medium">{r.appointmentDate || "Không rõ"}</span> • <span className="font-medium">{r.appointmentTime || "--"}</span>
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1">
                <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  ID: {r.id.substring(0, 8)}...
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Thông tin khám */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-5 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Triệu chứng</p>
                  <p className="text-sm text-gray-900">{r.symptoms || "--"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Chẩn đoán</p>
                  <p className="text-sm text-gray-900">{r.diagnosis || "--"}</p>
                </div>
              </div>
            </div>

            {/* Đơn thuốc */}
            {r.prescription && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <h4 className="text-base font-bold text-gray-900">Đơn thuốc</h4>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-700">Trạng thái:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    r.prescription.status === "PAID" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {r.prescription.status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                </div>

                <div className="bg-white rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700">
                    Tổng tiền: <span className="text-lg font-bold text-purple-600">{r.prescription.amount?.toLocaleString("vi-VN")} ₫</span>
                  </p>
                </div>

                {r.prescription.medicines?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Danh sách thuốc:</p>
                    <ul className="space-y-2">
                      {r.prescription.medicines.map((m) => (
                        <li key={m.id} className="bg-white rounded-lg p-3 flex items-start gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                            <p className="text-xs text-gray-600">Liều lượng: {m.dosage}</p>
                            <p className="text-xs text-gray-500 italic">{m.instructions}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Dịch vụ khám */}
            {r.medicalExaminations && r.medicalExaminations.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h4 className="text-base font-bold text-gray-900">Dịch vụ khám</h4>
                </div>

                <ul className="space-y-2 mb-3">
                  {r.medicalExaminations.map((e) => (
                    <li key={e.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                      <span className="text-sm text-gray-900">{e.name}</span>
                      <span className="text-sm font-bold text-blue-600">{e.price.toLocaleString("vi-VN")} ₫</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-blue-100 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    Tổng phí dịch vụ: <span className="text-lg font-bold text-blue-700">
                      {r.medicalExaminations.reduce((sum, e) => sum + (e.price || 0), 0).toLocaleString("vi-VN")} ₫
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
