/**
 * Format price to Vietnamese currency
 */
export const formatPrice = (price: number): string => {
  return price.toLocaleString('vi-VN') + 'đ';
};

/**
 * Format time string (HH:mm:ss) to HH:mm
 */
export const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
};

/**
 * Format day label for Vietnamese calendar
 */
export const formatDayLabel = (date: Date): string => {
  const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const dayOfWeek = days[date.getDay()];
  
  return `${dayOfWeek}, ${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}`;
};

/**
 * Apply 10% discount for online booking
 */
export const applyDiscount = (totalPrice: number): number => {
  return Math.round(totalPrice * 0.9);
};

/**
 * Calculate deposit (50% of discounted price)
 */
export const calculateDeposit = (discountedPrice: number): number => {
  return Math.round(discountedPrice / 2);
};

/**
 * Add minutes to time string
 */
export const addMinutesToTime = (timeStr: string, minutes: number): string => {
  const [hour, min] = timeStr.split(':').map(Number);
  const totalMinutes = hour * 60 + min + minutes;
  const newHour = Math.floor(totalMinutes / 60);
  const newMin = totalMinutes % 60;
  return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
};

/**
 * Check if slot is in the past
 */
export const isSlotInPast = (date: string, startTime: string): boolean => {
  const now = new Date();
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const slotDate = new Date(year, month - 1, day, hours, minutes);
  
  return slotDate < now;
};

/**
 * Convert Date to YYYY-MM-DD format
 */
export const toYMD = (d: Date): string => {
  return d.toISOString().slice(0, 10);
};

/**
 * Build week dates starting from Monday
 */
export const buildWeekDates = (refDate: Date): Date[] => {
  const d = new Date(refDate);
  const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = localDate.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  
  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const weekDates: Date[] = [];
  for (let i = 0; i < 6; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    weekDates.push(dt);
  }
  return weekDates;
};
