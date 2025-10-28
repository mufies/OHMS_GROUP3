import React, { useState, useEffect, useMemo } from "react"
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
  const [searchTerm, setSearchTerm] = useState("") // State cho tìm kiếm

  const [formData, setFormData] = useState<UserData>({
    username: "",
    phone: "",
  })

  // Load users từ API khi mở trang
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/users/getListUserOffline")
        setUsers(res?.data?.results || [])
      } catch (err) {
        console.error("Lỗi khi tải user:", err)
      }
    }
    fetchUsers()
  }, [])

  // Xử lý nhập form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Gửi user mới lên API
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const limitedPhone = formData.phone.replace(/\D/g, "").slice(0, 9)
      const newUser = {
        username: formData.username,
        phone: Number(limitedPhone),
        roles: ["PATIENT"],
      }

      const res = await axiosInstance.post("/users/offline", newUser)
      const created = res.data

      // Cập nhật danh sách user mới
      setUsers((prev) => [created, ...prev])
      setFormData({ username: "", phone: "" })
    } catch (err) {
      console.error("Lỗi khi tạo user:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Lọc danh sách user theo từ khóa tìm kiếm
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users

    const lowerSearch = searchTerm.toLowerCase()
    return users.filter((user) => {
      const phoneStr = user.phone.toString()
      return (
        user.username.toLowerCase().includes(lowerSearch) ||
        phoneStr.includes(lowerSearch)
      )
    })
  }, [users, searchTerm])

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
              <h2>
                Danh sách User ({filteredUsers.length})
                {searchTerm && ` - Tìm thấy: "${searchTerm}"`}
              </h2>

              {/* Ô tìm kiếm */}
              <div className="search-bar" style={{ marginBottom: "1rem" }}>
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    fontSize: "1rem",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    outline: "none",
                  }}
                />
              </div>

              <div className="users-list">
                {filteredUsers.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#666", padding: "2rem" }}>
                    {searchTerm ? "Không tìm thấy user nào." : "Chưa có user nào."}
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <div key={u.id} className="user-card">
                      <p><strong>Tên:</strong> {u.username}</p>
                      <p><strong>SĐT:</strong> {u.phone}</p>
                      <button
                        className="submit-btn"
                        onClick={() => setSelectedUserId(u.id)}
                        style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}
                      >
                        Tạo Lịch khám
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal tạo lịch khám */}
      {selectedUserId && (
        <AppointmentModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onSuccess={() => console.log("Tạo appointment thành công")}
        />
      )}
    </div>
  )
}