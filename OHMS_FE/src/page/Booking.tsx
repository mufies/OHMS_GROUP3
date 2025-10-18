import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStethoscope } from '@fortawesome/free-solid-svg-icons';
import Navigator from '../compoment/Navigator';
import SearchDoctor from '../compoment/searchDoctor';
import { useNavigate } from 'react-router-dom';
import { MedicalSpecialty, MEDICAL_SPECIALTY_LABELS, MedicalSpecialtyType } from '../constant/medicalSpecialty';

const Booking = () => {
  const navigate = useNavigate();

  // Chuyển object thành array of { key, label }
  const specialties = Object.entries(MEDICAL_SPECIALTY_LABELS).map(([key, label]) => ({
    key: key as MedicalSpecialtyType,
    label: label
  }));

  const handleSpecialtyClick = (specialtyKey: MedicalSpecialtyType) => {
    navigate(`/booking-schedule-new?specialty=${specialtyKey}`);
  };

  return (
    <>
      <div className="w-full min-h-[100vh] bg-white pt-12">
        <Navigator />
        <SearchDoctor />
        
        <div className="mx-auto max-w-6xl text-center pt-10">
          <h2 className="text-5xl font-bold text-black">
            Đa dạng chuyên khoa khám
          </h2>
          <p className="mt-2 text-sm text-black/80 pt-5">
            Đặt khám dễ dàng và tiện lợi hơn với đầy đủ các chuyên khoa
          </p>

          <div className="mt-12 grid gap-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {specialties.map((spec) => (
              <div
                key={spec.key}
                className="flex flex-col items-center text-center transition-transform hover:scale-105 cursor-pointer"
                onClick={() => handleSpecialtyClick(spec.key)}
              >
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl text-black shadow ring-1 ring-white/20">
                  <FontAwesomeIcon icon={faStethoscope} />
                </div>
                <span className="text-sm text-black line-clamp-2">{spec.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Booking;
