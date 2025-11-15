import React, { useEffect, useState } from "react"
import { axiosInstance } from "../../utils/fetchFromAPI"
import {
  MEDICAL_SPECIALTY_LABELS,
  MedicalSpecialtyType,
} from "../../constant/medicalSpecialty"
import { toast } from "react-toastify"

interface Doctor {
  id: string
  username: string
  medicleSpecially?: string[]
}

interface AppointmentModalProps {
  userId: string
  onClose: () => void
  onSuccess?: () => void
}

export default function AppointmentModal({
  userId,
  onClose,
  onSuccess,
}: AppointmentModalProps) {
  const [formData, setFormData] = useState({
    doctorId: "",
    workDate: "",
    startTime: "",
    endTime: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false) // tránh submit 2 lần

  /* -------------------------------------------------
   *  LẤY DANH SÁCH BÁC SĨ
   * ------------------------------------------------- */
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axiosInstance.get(
          "/users/getListDoctor"
        )
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.results || []
        setDoctors(data)
      } catch (err) {
        console.error("Lỗi khi tải danh sách bác sĩ:", err)
        setError("Không thể tải danh sách bác sĩ")
      } finally {
        setLoadingDoctors(false)
      }
    }
    fetchDoctors()
  }, [])

  /* -------------------------------------------------
   *  SET CỨNG: startTime = now + 1s, endTime = now + 30p
   *  → CHẠY MỖI KHI MỞ MODAL
   * ------------------------------------------------- */
  useEffect(() => {
    const now = new Date()

    // Ngày hôm nay
    const today = now.toISOString().split("T")[0]

    // startTime = hiện tại + 1 giây
    const startDate = new Date(now.getTime() + 1000)
    const startTime = startDate.toTimeString().slice(0, 5)

    // endTime = hiện tại + 30 phút
    const endDate = new Date(now.getTime() + 30 * 60 * 1000)
    const endTime = endDate.toTimeString().slice(0, 5)

    setFormData({
      doctorId: "",
      workDate: today,
      startTime,
      endTime,
    })
  }, []) // Chỉ chạy 1 lần khi mở modal

  /* -------------------------------------------------
   *  XỬ LÝ THAY ĐỔI INPUT (chỉ cho doctorId và workDate)
   * ------------------------------------------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    if (name === "startTime" || name === "endTime") return
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  /* -------------------------------------------------
   *  SUBMIT + VALIDATE (chỉ 1 lần)
   * ------------------------------------------------- */
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (hasSubmitted) return
  setHasSubmitted(true)
  setIsLoading(true)

  try {
    // ✅ Cập nhật thời gian ngay trước khi gửi đi
    const now = new Date()
    const today = now.toISOString().split("T")[0]

    const startDate = new Date(now.getTime() + 500) // +0.5 giây
    const endDate = new Date(now.getTime() + 1000)  // +1 giây

    const startTime = startDate.toTimeString().split(" ")[0]
    const endTime = endDate.toTimeString().split(" ")[0]

    const payload = {
      patientId: userId,
      doctorId: formData.doctorId,
      workDate: today,
      startTime,
      endTime,
    }

    console.log("Payload gửi đi:", payload)

    const { data } = await axiosInstance.post("/appointments", payload)
    console.log("Response:", data)

    toast.success("Tạo thành công")
    onSuccess?.()
    onClose()
  } catch (err) {
    console.error("Lỗi khi tạo appointment:", err)
    toast.error("Slot này đã tồn tại hoặc lỗi tạo lịch")
  } finally {
    setIsLoading(false)
    setHasSubmitted(false)
  }
}


  /* -------------------------------------------------
   *  ĐÓNG MODAL KHI CLICK BÊN NGOÀI
   * ------------------------------------------------- */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  /* -------------------------------------------------
   *  RENDER
   * ------------------------------------------------- */
  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Tạo lịch khám cho User</h2>

        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : loadingDoctors ? (
          <p>Đang tải danh sách bác sĩ...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* CHỌN BÁC SĨ */}
            <div className="form-group">
              <label>Chọn bác sĩ</label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                required
              >
                <option value="">Chọn bác sĩ</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.username}{" "}
                    {d.medicleSpecially && d.medicleSpecially.length > 0
                      ? `(${d.medicleSpecially
                          .map(
                            (spec) =>
                              MEDICAL_SPECIALTY_LABELS[
                                spec as MedicalSpecialtyType
                              ] || spec
                          )
                          .join(", ")})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* NGÀY KHÁM */}
            <div className="form-group">
              <label>Ngày khám</label>
              <input
                type="date"
                name="workDate"
                value={formData.workDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* GIỜ BẮT ĐẦU - CỨNG */}
            <div className="form-group">
              <label>Giờ bắt đầu</label>
              <input
                type="time"
                value={formData.startTime}
                readOnly
                style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
              />
            </div>

            {/* GIỜ KẾT THÚC - CỨNG */}
            <div className="form-group">
              <label>Giờ kết thúc</label>
              <input
                type="time"
                value={formData.endTime}
                readOnly
                style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
              />
            </div>

            {/* NÚT HÀNH ĐỘNG */}
            <div className="modal-actions">
              <button type="button" className="cancel" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" disabled={isLoading || hasSubmitted}>
                {isLoading ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}