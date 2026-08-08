// FUNCIÓN 2/2 de Vercel — la llama un cron EXTERNO (no el de Vercel, porque
// el plan Hobby solo permite crons de una vez al día y esto necesita
// revisarse cada 1–5 minutos). Usa por ejemplo cron-job.org (gratis) o un
// GitHub Action programado, apuntando a:
//   https://tu-dominio.vercel.app/api/cron-check?secret=TU_CRON_SECRET
// cada 2 minutos, las 24 horas (o solo en horario de atención, como prefieras).
//
// Hace dos cosas:
//   1) Avisa al admin (push) cuando hay una reserva nueva sin avisar.
//   2) Avisa (push) 30 minutos antes de cada cita confirmada — al cliente
//      dueño de la cita y a todos los dispositivos admin.
import { getAdminDb } from '../server/firebaseAdmin.js';
import { sendPush } from '../server/webpush.js';
import { getAppointmentDateUTC, nowUTC } from '../server/dateUtils.js';

const REMINDER_WINDOW_MINUTES = 30;

async function getSubscriptionsByRole(db, role) {
  const snap = await db.collection('pushSubscriptions').where('role', '==', role).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function getClientSubscription(db, uid) {
  if (!uid) return null;
  const snap = await db.collection('pushSubscriptions').doc(uid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function pushAndCleanup(db, subDoc, payload) {
  if (!subDoc) return;
  const stillValid = await sendPush(subDoc.subscription, payload);
  if (!stillValid) {
    await db.collection('pushSubscriptions').doc(subDoc.id).delete().catch(() => {});
  }
}

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const db = getAdminDb();
  const today = new Date(nowUTC().getTime() - 5 * 60 * 60 * 1000).toISOString().split('T')[0];

  let newBookingsNotified = 0;
  let remindersNotified = 0;

  try {
    // ── 1) Nuevas reservas pendientes sin avisar al admin ──
    // (una sola condición de igualdad: no necesita índice compuesto)
    const pendientesSnap = await db
      .collection('reservas')
      .where('status', '==', 'pendiente')
      .get();

    const pendientesSinAvisar = pendientesSnap.docs.filter((d) => !d.data().adminNotified);

    if (pendientesSinAvisar.length > 0) {
      const adminSubs = await getSubscriptionsByRole(db, 'admin');
      for (const doc of pendientesSinAvisar) {
        const r = doc.data();
        const payload = {
          title: 'Nueva reserva recibida',
          body: `${r.fullName || 'Un cliente'} · ${r.date || ''} ${r.time || ''}`,
          tag: `nueva-reserva-${doc.id}`,
          url: '/admin',
        };
        await Promise.all(adminSubs.map((s) => pushAndCleanup(db, s, payload)));
        await doc.ref.update({ adminNotified: true });
        newBookingsNotified++;
      }
    }

    // ── 2) Recordatorio 30 min antes de citas confirmadas ──
    // (una sola condición de igualdad: no necesita índice compuesto; el
    // resto — fecha y si ya se avisó — se filtra aquí mismo en el código)
    const confirmadasSnap = await db
      .collection('reservas')
      .where('status', '==', 'confirmada')
      .get();

    const confirmadasPorAvisar = confirmadasSnap.docs.filter(
      (d) => d.data().date >= today && !d.data().reminderSent
    );

    if (confirmadasPorAvisar.length > 0) {
      const adminSubs = await getSubscriptionsByRole(db, 'admin');
      const now = nowUTC();

      for (const doc of confirmadasPorAvisar) {
        const r = doc.data();
        const apptDate = getAppointmentDateUTC(r.date, r.time);
        if (!apptDate) continue;

        const diffMinutes = (apptDate.getTime() - now.getTime()) / 60000;
        if (diffMinutes > REMINDER_WINDOW_MINUTES || diffMinutes < 0) continue;

        const serviciosTexto = Array.isArray(r.services) ? r.services.join(', ') : '';

        const clientPayload = {
          title: 'Tu cita es en 30 minutos',
          body: `Threasure Barber · ${r.time || ''} · ${serviciosTexto}`,
          tag: `cita-${doc.id}`,
          url: '/mis-citas',
        };
        const adminPayload = {
          title: 'Cita en 30 minutos',
          body: `${r.fullName || 'Cliente'} · ${r.time || ''} · ${serviciosTexto}`,
          tag: `cita-${doc.id}`,
          url: '/admin',
        };

        const clientSub = await getClientSubscription(db, r.uid);
        await pushAndCleanup(db, clientSub, clientPayload);
        await Promise.all(adminSubs.map((s) => pushAndCleanup(db, s, adminPayload)));

        await doc.ref.update({ reminderSent: true });
        remindersNotified++;
      }
    }

    res.status(200).json({ ok: true, newBookingsNotified, remindersNotified });
  } catch (err) {
    console.error('Error en /api/cron-check:', err);
    res.status(500).json({ error: 'Error interno', detail: err.message });
  }
}
