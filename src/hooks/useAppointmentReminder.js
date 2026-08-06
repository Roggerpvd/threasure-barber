import { useEffect, useRef } from 'react';
import { notify } from '../utils/notifications';

const REMINDER_MINUTES_BEFORE = 30;
const CHECK_INTERVAL_MS = 30 * 1000; // revisa cada 30s
const STORAGE_KEY_PREFIX = 'tb_reminder_notified_';

// Convierte una etiqueta de hora tipo "3:00 p.m." en {h, m} en 24h.
function parseTimeLabel(label) {
  if (!label) return null;
  const match = /^(\d{1,2}):(\d{2})\s*([ap])\.?m\.?$/i.exec(label.trim());
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const isPM = match[3].toLowerCase() === 'p';
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return { h, m };
}

function getAppointmentDate(appointment) {
  if (!appointment.date) return null;
  const parsedTime = parseTimeLabel(appointment.time);
  if (!parsedTime) return null;
  const [year, month, day] = appointment.date.split('-').map(Number);
  return new Date(year, month - 1, day, parsedTime.h, parsedTime.m, 0, 0);
}

/**
 * Avisa (notificación del navegador + sonido) 30 minutos antes de cada cita.
 * Funciona mientras la app esté abierta en el navegador.
 *
 * @param {Array} appointments - lista de citas, cada una con { id, date, time, fullName, ... }
 * @param {(appt) => {title: string, body: string}} buildMessage - arma el texto del aviso
 * @param {boolean} enabled - activa/desactiva el chequeo
 */
export default function useAppointmentReminder(appointments, buildMessage, enabled = true) {
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + 'ids');
      if (stored) notifiedRef.current = new Set(JSON.parse(stored));
    } catch {
      // noop
    }
  }, []);

  const persist = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY_PREFIX + 'ids',
        JSON.stringify(Array.from(notifiedRef.current))
      );
    } catch {
      // noop
    }
  };

  useEffect(() => {
    if (!enabled || !appointments || appointments.length === 0) return undefined;

    const check = () => {
      const now = new Date();
      appointments.forEach(appt => {
        if (!appt || !appt.id) return;
        if (notifiedRef.current.has(appt.id)) return;

        const apptDate = getAppointmentDate(appt);
        if (!apptDate) return;

        const diffMinutes = (apptDate.getTime() - now.getTime()) / 60000;

        // Ventana de aviso: entre 0 y 30 minutos antes de la cita.
        if (diffMinutes <= REMINDER_MINUTES_BEFORE && diffMinutes >= 0) {
          const { title, body } = buildMessage(appt);
          notify(title, { body, tag: `cita-${appt.id}` });
          notifiedRef.current.add(appt.id);
          persist();
        }
      });
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, enabled]);
}
