import React, { useEffect, useState } from "react";
import { axiosInstance } from "../utils/fetchFromAPI";

interface Role {
  name: string;
  description: string | null;
  permissions: string[];
}

interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  phone?: string | null;
  medicleSpecially?: string[] | null;
}

const DoctorList: React.FC = () => {
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axiosInstance.get("/users/getListUser");

        if (res.data.code === 200 && Array.isArray(res.data.results)) {
          const filtered = res.data.results.filter((user: User) =>
            user.roles.some((r) => r.name === "DOCTOR")
          );
          setDoctors(filtered);
        } else {
          setError("Invalid response format");
        }
      } catch (err) {
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Danh sách bác sĩ 👨‍⚕️</h2>
      {doctors.length === 0 ? (
        <p>Không có bác sĩ nào.</p>
      ) : (
        <ul>
          {doctors.map((doctor) => (
            <li key={doctor.id}>
              <strong>{doctor.username}</strong> — {doctor.email}
              {doctor.medicleSpecially && doctor.medicleSpecially.length > 0 && (
                <span>
                  {" "}
                  | Chuyên khoa: {doctor.medicleSpecially.join(", ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DoctorList;
