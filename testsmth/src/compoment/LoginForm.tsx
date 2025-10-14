import React, { useState } from "react";

const specialtiesOptions = [
  { value: "CARDIOLOGY", label: "Cardiology" },
  { value: "INTERNAL_MEDICINE", label: "Internal Medicine" },
  { value: "SURGERY", label: "Surgery" },
  { value: "PEDIATRICS", label: "Pediatrics" },
  { value: "DERMATOLOGY", label: "Dermatology" },
];

interface AuthFormProps {
  onClose?: () => void;
  onLoginSuccess?: (user: any) => void;
}

export default function AuthForm({ onClose, onLoginSuccess }: AuthFormProps) {
  // Shared by both forms
  const [isLogin, setIsLogin] = useState(true);

  // Registration fields
  const [username, setUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [roles, setRoles] = useState("PATIENT");
  const [phone, setPhone] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [message, setMessage] = useState("");

  // Registration handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", regEmail);
    formData.append("password", regPassword);
    formData.append("roles", JSON.stringify([roles]));
    if (phone) formData.append("phone", phone);
    if (roles === "DOCTOR" && specialties.length > 0) {
      formData.append("medicleSpecially", JSON.stringify(specialties));
    }
    try {
      const res = await fetch("http://localhost:8080/users/register", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Đăng ký thành công! Vui lòng đăng nhập.");
        // Clear form
        setUsername("");
        setRegEmail("");
        setRegPassword("");
        setPhone("");
        setSpecialties([]);
        // Switch to login form
        setTimeout(() => {
          setIsLogin(true);
          setMessage("");
        }, 2000);
      } else {
        setMessage("Lỗi đăng ký: " + (data.message || "Có lỗi xảy ra"));
      }
    } catch (error) {
      setMessage("Lỗi kết nối server!");
      console.error("Register error:", error);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    
    // Use JSON for login instead of FormData
    const loginData = {
      email: loginEmail,
      password: loginPassword
    };
    
    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });
      
      const data = await res.json();
      console.log("Login response:", data); // Debug log
      
      if (res.ok && (data.results?.authenticated || data.authenticated || res.status === 200)) {
        setMessage("Đăng nhập thành công!");
        
        // Store token - handle different response structures
        const token = data.results?.token || data.token || data.accessToken;
        if (token) {
          localStorage.setItem('token', token);
        } else {
          console.warn("No token found in login response");
        } 
        
        try {
          const token = data.results?.token || data.token || data.accessToken;
          const userRes = await fetch("http://localhost:8080/users/getinfo", {
            method: "GET",
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
          
          if (userRes.ok) {
            const userData = await userRes.json();
            
            // Debug: Log the response structure
            console.log("User data response:", userData);
            
            // Check if userData exists and has the expected structure
            // The response can be either direct user object or nested under results
            const userInfo = userData.results || userData;
            if (!userData || (!userData.id && !userData.results)) {
              console.error("Invalid user data structure:", userData);
              setMessage("Error: Invalid user data received from server");
              return;
            }
            
            const user = {
              id: userInfo.id || "unknown",
              email: userInfo.email || loginEmail,
              name: userInfo.username || "Unknown User",
              role: userInfo.roles?.some((r: any) => r.name === 'DOCTOR') ? 'doctor' : 'patient',
              phone: userInfo.phone?.toString(),
              specialization: userInfo.medicleSpecially?.[0] || undefined,
              patientId: userInfo.roles?.some((r: any) => r.name === 'PATIENT') ? userInfo.id : undefined
            };
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Call parent callback
            if (onLoginSuccess) {
              onLoginSuccess(user);
            }
            
            // Close modal
            if (onClose) {
              onClose();
            }
          } else {
            const errorData = await userRes.json();
            console.error("Failed to get user info:", errorData);
            setMessage("Error fetching user information");
          }
        } catch (userError) {
          console.error("Error fetching user info:", userError);
          setMessage("Network error: Unable to fetch user information");
          
          // If we can't get user info but login was successful, create a basic user object
          const basicUser = {
            id: "temp_" + Date.now(),
            email: loginEmail,
            name: "User",
            role: 'patient' as const, // Default to patient
            phone: undefined,
            specialization: undefined,
            patientId: undefined
          };
          
          localStorage.setItem('currentUser', JSON.stringify(basicUser));
          
          if (onLoginSuccess) {
            onLoginSuccess(basicUser);
          }
          
          if (onClose) {
            onClose();
          }
        }
      } else {
        setMessage("Lỗi đăng nhập: " + (data.message || "Tài khoản hoặc mật khẩu không đúng"));
      }
    } catch (error) {
      setMessage("Lỗi kết nối server!");
      console.error("Login error:", error);
    }
  };

  // UI
  return (
    <div style={{ maxWidth: 400, margin: "auto", marginTop: 40, background: "#fff", padding: 24, borderRadius: 12 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24, color: "#000" }}>{isLogin ? "Đăng nhập" : "Đăng ký"}</h2>
      <form onSubmit={isLogin ? handleLogin : handleRegister}>

        {!isLogin && (
          <>
            <div>
              <label style={{ color: "#000", display: "block", marginBottom: 5 }}>Tên đăng nhập</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                type="text"
                minLength={6}
                required
                placeholder="Ít nhất 6 ký tự"
                style={{ width: "100%", marginBottom: 10, padding: 8, border: "1px solid #ccc", borderRadius: 4, color: "#000" }}
              />
            </div>
            <div>
              <label style={{ color: "#000", display: "block", marginBottom: 5 }}>Số điện thoại (tuỳ chọn)</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                type="tel"
                placeholder="Ví dụ: 0901234567"
                style={{ width: "100%", marginBottom: 10, padding: 8, border: "1px solid #ccc", borderRadius: 4, color: "#000" }}
              />
            </div>
            <div>
              <label style={{ color: "#000", display: "block", marginBottom: 5 }}>Vai trò</label>
              <select
                value={roles}
                onChange={e => setRoles(e.target.value)}
                style={{ width: "100%", marginBottom: 10, padding: 8, border: "1px solid #ccc", borderRadius: 4, color: "#000" }}
              >
                <option value="PATIENT">Bệnh nhân</option>
                <option value="DOCTOR">Bác sĩ</option>
              </select>
            </div>
            {roles === "DOCTOR" && (
              <div>
                <label style={{ color: "#000", display: "block", marginBottom: 5 }}>Chuyên khoa (Ctrl/Cmd để chọn nhiều)</label>
                <select
                  multiple
                  value={specialties}
                  onChange={e => setSpecialties(Array.from(e.target.selectedOptions, opt => opt.value))}
                  style={{ width: "100%", marginBottom: 10, padding: 8, border: "1px solid #ccc", borderRadius: 4, color: "#000", minHeight: 80 }}
                >
                  {specialtiesOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label style={{ color: "#000", display: "block", marginBottom: 5 }}>Email</label>
              <input
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                type="email"
                required
                style={{ width: "100%", marginBottom: 10, padding: 8, border: "1px solid #ccc", borderRadius: 4, color: "#000" }}
              />
            </div>
            <div>
              <label style={{ color: "#000", display: "block", marginBottom: 5 }}>Mật khẩu</label>
              <input
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                type="password"
                minLength={6}
                required
                style={{ width: "100%", marginBottom: 10, padding: 8, border: "1px solid #ccc", borderRadius: 4, color: "#000" }}
              />
            </div>
          </>
        )}

        {isLogin && (
          <>
            <div>
              <label style={{ color: "#000", display: "block", marginBottom: 5 }}>Email</label>
              <input
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                type="email"
                required
                style={{ width: "100%", marginBottom: 10, padding: 8, border: "1px solid #ccc", borderRadius: 4, color: "#000" }}
              />
            </div>
            <div>
              <label style={{ color: "#000", display: "block", marginBottom: 5 }}>Mật khẩu</label>
              <input
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                type="password"
                minLength={6}
                required
                style={{ width: "100%", marginBottom: 10, padding: 8, border: "1px solid #ccc", borderRadius: 4, color: "#000" }}
              />
            </div>
          </>
        )}

        <button 
          type="submit" 
          style={{ 
            width: "100%", 
            padding: "12px", 
            marginTop: 14, 
            backgroundColor: "#1976d2", 
            color: "#fff", 
            border: "none", 
            borderRadius: 4, 
            fontSize: 16, 
            cursor: "pointer" 
          }}
        >
          {isLogin ? "Đăng nhập" : "Đăng ký"}
        </button>
      </form>
      <div style={{ textAlign: "center", margin: 12, color: message.includes("thành công") ? "green" : "red", fontSize: 14 }}>
        {message}
      </div>
      <div style={{ textAlign: "center" }}>
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{ color: "#1976d2", background: "none", border: "none", cursor: "pointer", fontSize: 14, textDecoration: "underline" }}
        >
          {isLogin
            ? "Chưa có tài khoản? Đăng ký"
            : "Đã có tài khoản? Đăng nhập"}
        </button>
      </div>
      
      {/* Debug button for testing API */}
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: "test@test.com", password: "password" })
              });
              const data = await res.json();
              console.log("🔍 API Response Structure:", data);
              alert("Check console for API response structure");
            } catch (error) {
              console.error("API test failed:", error);
            }
          }}
          style={{ color: "#666", background: "none", border: "1px solid #ccc", cursor: "pointer", fontSize: 12, padding: "4px 8px", borderRadius: 4 }}
        >
          🔍 Test API Structure
        </button>
      </div>
    </div>
  );
}
