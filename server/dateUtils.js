// Utilidades de fecha/hora para las funciones serverless (Node, corre en
// UTC). Perú es UTC-5 fijo (sin horario de verano), igual que en
// src/utils/schedule.js del frontend.

const PERU_OFFSET_MS = 5 * 60 * 60 * 1000; // Perú va 5h detrás de UTC

export function parseTimeLabel(label) {
  if (!label) return null;
  const match = /^(\d{1,2}):(\d{2})\s*([ap])\.?m\.?$/i.exec(String(label).trim());
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const isPM = match[3].toLowerCase() === 'p';
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return { h, m };
}

// Devuelve el instante UTC real (Date) en que ocurre la cita, a partir de
// la fecha ("YYYY-MM-DD") y hora ("8:00 a.m.") guardadas, ambas en hora de Perú.
export function getAppointmentDateUTC(dateStr, timeLabel) {
  const parsed = parseTimeLabel(timeLabel);
  if (!parsed || !dateStr) return null;
  const pad = (n) => String(n).padStart(2, '0');
  const naiveUTC = new Date(`${dateStr}T${pad(parsed.h)}:${pad(parsed.m)}:00.000Z`);
  if (Number.isNaN(naiveUTC.getTime())) return null;
  return new Date(naiveUTC.getTime() + PERU_OFFSET_MS);
}

export function nowUTC() {
  return new Date();
}
