import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {   
  MEDICAL_SPECIALTY_LABELS,
  MedicalSpecialtyType, } from "../constant/medicalSpecialty";
import { axiosInstance } from "../utils/fetchFromAPI";


interface Role {
  name: string;
  description?: string;
}

interface Doctor {
  id: string;
  username: string;
  email: string;
  imageUrl?: string | null;
  medicleSpecially?: MedicalSpecialtyType[] | null;
  roles: Role[];
}

export default function DoctorListSection() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await axiosInstance.get("/users/getListDoctor"); // API trả về { code, results }
        const allDoctors = data.results.filter((u: Doctor) =>
          u.roles.some((r) => r.name === "DOCTOR")
        );
        setDoctors(allDoctors);
        setFilteredDoctors(allDoctors);
      } catch (error) {
        console.error("Lỗi khi load danh sách bác sĩ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSpecialty(value);

    if (value === "ALL") {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter((doc) =>
        doc.medicleSpecially?.includes(value as MedicalSpecialtyType)
      );
      setFilteredDoctors(filtered);
    }
  };

  if (loading) {
    return (
      <section style={{ padding: "32px", textAlign: "center" }}>
        <p>Đang tải danh sách bác sĩ...</p>
      </section>
    );
  }

  return (
    <section style={{ padding: "16px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 24, margin: 0, color: "#0f172a" }}>
            Bác sĩ TƯ VẤN khám bệnh qua video
          </h2>
          <Link
            to="/patient"
            style={{
              color: "#0ea5e9",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Xem tất cả
          </Link>
        </div>

        {/* Bộ lọc chuyên khoa */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 600, marginRight: 10 }}>Chuyên khoa:</label>
          <select
            value={selectedSpecialty}
            onChange={handleFilterChange}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              minWidth: 250,
            }}
          >
            <option value="ALL">Tất cả</option>
            {Object.entries(MEDICAL_SPECIALTY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Grid danh sách bác sĩ */}
        {filteredDoctors.length === 0 ? (
          <p>Không tìm thấy bác sĩ thuộc chuyên khoa này.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 24,
            }}
          >
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 10,
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  
                }}
              >
                <img
                  src={doc.imageUrl || "/default-doctor.png"}
                  alt={doc.username}
                  style={{
                    margin:"0 auto",
                    width: 200,
                    height: 100,
                    borderRadius: "10%",
                    objectFit: "cover",
                    marginBottom: 12,
                  }}
                />
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                  {doc.username}
                </h3>
                <p style={{ fontSize: 14, color: "#64748b" }}>
                  {doc.medicleSpecially?.length
                    ? doc.medicleSpecially
                        .map((m) => MEDICAL_SPECIALTY_LABELS[m])
                        .join(", ")
                    : "Chưa cập nhật chuyên khoa"}
                </p>
                <p style={{ fontSize: 13, color: "#475569" }}>{doc.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
