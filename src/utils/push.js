// Suscripción a Web Push real (funciona con el navegador cerrado).
// Se apoya en las 2 funciones serverless de /api (push.js y cron-check.js).
import { auth } from '../firebase';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

// Pide permiso de notificación + registra el service worker + se suscribe a
// push + guarda la suscripción en el backend. Debe llamarse desde un clic
// del usuario (los navegadores exigen un gesto para pedir permiso).
export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Este navegador no soporta notificaciones push.');
  }
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error('Falta configurar VITE_VAPID_PUBLIC_KEY.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, permission };
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('Debes iniciar sesión para activar las notificaciones.');
  }
  const idToken = await user.getIdToken();

  const res = await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, subscription: subscription.toJSON() }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'No se pudo guardar la suscripción.');
  }

  return { ok: true, permission };
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const user = auth.currentUser;
  if (user) {
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/push', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, endpoint: subscription.endpoint }),
      });
    } catch (err) {
      console.warn('No se pudo avisar al backend de la baja:', err);
    }
  }
  await subscription.unsubscribe();
}
