// Envío de notificaciones Web Push (protocolo estándar, funciona en Chrome,
// Edge, Firefox y Android; en iOS requiere que el sitio esté "agregado a
// pantalla de inicio" como PWA — limitación de Apple, no de este código).
//
// Requiere las variables de entorno en Vercel:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ej: mailto:correo@dominio.com)
import webpush from 'web-push';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en las variables de entorno de Vercel.');
  }
  webpush.setVapidDetails(
    VAPID_SUBJECT || 'mailto:contacto@threasurebarber.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  configured = true;
}

/**
 * Envía una notificación push a una suscripción.
 * @returns {boolean} true si se envió, false si la suscripción ya no es válida (expiró / el usuario la revocó).
 */
export async function sendPush(subscription, payload) {
  ensureConfigured();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    // 404/410 = la suscripción ya no existe (navegador desinstalado, permiso revocado, etc.)
    if (err.statusCode === 404 || err.statusCode === 410) {
      return false;
    }
    console.error('Error enviando push:', err.statusCode, err.body || err.message);
    return true; // error transitorio: no la borramos, puede que sea temporal
  }
}
