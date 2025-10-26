import React, { useState, useEffect } from "react"
import "./user.css"
import Navigator from "../Navigator"
import { axiosInstance } from "../../utils/fetchFromAPI"
import AppointmentModal from "./AppointmentModal"

interface UserData {
  username: string
  phone: string
  roles?: string[]
}

interface User extends UserData {
  id: string
}

export default function ReceptionUserPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState<UserData>({
    username: "",
    phone: "",
  })

  // 🟢 Load users từ API khi mở trang
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/users/getListUserOffline")
        console.log(res);
        
        setUsers(res?.data?.results)
      } catch (err) {
        console.error("Lỗi khi tải user:", err)
      }
    }
    fetchUsers()
  }, [])

  // 🟢 Hàm xử lý nhập form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // 🟢 Gửi user mới lên API
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const limitedPhone = formData.phone.replace(/\D/g, "").slice(0, 9) // chỉ lấy 9 số
const newUser = {
  username: formData.username,
  phone: Number(limitedPhone),
  roles: ["PATIENT"],
}


      const res = await axiosInstance.post("/users/offline", newUser)
      const created = res.data // ✅ axios trả data trong res.data

      // ✅ Cập nhật danh sách user mới
      setUsers((prev) => [created, ...prev])
      setFormData({ username: "", phone: "" })
    } catch (err) {
      console.error("Lỗi khi tạo user:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Navigator />
      <div className="user-container">
        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h1>Quản lý User offline và Booking dịch vụ</h1>
          </div>

          <div className="content-grid">
            {/* Form Section */}
            <div className="form-section">
              <h2>Đăng ký User mới</h2>
              <form onSubmit={handleAddUser} className="user-form">
                <div className="form-group">
                  <label htmlFor="username">Tên người dùng *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập tên user"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="(0123) 456-789"
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? "Đang tạo..." : "Thêm người dùng"}
                </button>
              </form>
            </div>

            {/* List Section */}
            <div className="list-section">
              <h2>Danh sách User ({users.length})</h2>
              <div className="users-list">
                {users.map((u) => (
                  <div key={u.id} className="user-card">
                    <p><strong>Tên:</strong> {u.username}</p>
                    <p><strong>SĐT:</strong> {u.phone}</p>
                    <button
                     className="submit-btn"
                    onClick={() => setSelectedUserId(u.id)}>
              Tạo Lịch khám
            </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      {selectedUserId && (
        <AppointmentModal
          userId={selectedUserId}
     onClose={() => setSelectedUserId(null)}
 // đóng modal
          onSuccess={() => console.log("Tạo appointment thành công")}
        />
      )}
    </div>
  )
}
