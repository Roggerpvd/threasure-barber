// Utilidades de horario compartidas entre Reserva.jsx y AdminPanel.jsx

export const ALL_TIME_SLOTS = [
  { label: '8:00 a.m.', hour: 8 },
  { label: '9:00 a.m.', hour: 9 },
  { label: '10:00 a.m.', hour: 10 },
  { label: '11:00 a.m.', hour: 11 },
  { label: '12:00 p.m.', hour: 12 },
  { label: '2:00 p.m.', hour: 14 },
  { label: '3:00 p.m.', hour: 15 },
  { label: '4:00 p.m.', hour: 16 },
  { label: '5:00 p.m.', hour: 17 },
  { label: '6:00 p.m.', hour: 18 },
];

// Horas cerradas fijas según el día de la semana (0=domingo ... 6=sábado)
export function getDayBlocks(dateStr) {
  if (!dateStr) return [];
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay();
  switch (dow) {
    case 1: return [10, 11, 12, 17, 18];
    case 2: return [14, 15, 16];
    case 3: return [15, 16, 17];
    case 5: return [9, 10, 11, 15, 16, 17];
    default: return [];
  }
}

export const DAY_NAMES_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
export const MONTH_NAMES_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function getTodayPeru() {
  const now = new Date();
  const peruOffsetMs = -5 * 60 * 60 * 1000; // Perú es UTC-5 fijo, sin horario de verano
  const peruNow = new Date(now.getTime() + peruOffsetMs);
  return peruNow.toISOString().split('T')[0];
}

export function getCurrentHourPeru() {
  const now = new Date();
  const peruOffsetMs = -5 * 60 * 60 * 1000;
  const peruNow = new Date(now.getTime() + peruOffsetMs);
  return peruNow.getUTCHours();
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// Devuelve las 7 fechas (lunes a domingo) de la semana que contiene dateStr
export function getWeekDates(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay(); // 0=domingo..6=sábado
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(dateStr, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatDayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    dayName: DAY_NAMES_SHORT[d.getDay()],
    dayNum: d.getDate(),
    monthName: MONTH_NAMES_SHORT[d.getMonth()],
  };
}
