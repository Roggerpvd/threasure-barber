// Utilidades de notificaciones del navegador (Notification API) + sonido.
//
// IMPORTANTE — limitación técnica:
// Esto funciona mientras la pestaña/app esté ABIERTA (en primer plano o en
// segundo plano, pero con el navegador corriendo). Para recibir avisos con
// el navegador totalmente cerrado se necesitaría Firebase Cloud Messaging +
// una función en la nube (backend) que dispare el push, lo cual requiere el
// plan de pago "Blaze" de Firebase y configuración adicional de servidor.
// Por ahora, con Reserva/AdminPanel/MisCitas abiertos (aunque sea en una
// pestaña de fondo), el aviso y el sonido sí se disparan automáticamente.

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  return audioCtx;
}

// "Despierta" el audio context la primera vez que el usuario interactúa con
// la página (los navegadores bloquean el audio automático sin gesto previo).
export function primeAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

if (typeof window !== 'undefined') {
  ['click', 'touchstart', 'keydown'].forEach(evt =>
    window.addEventListener(evt, primeAudio, { once: true, passive: true })
  );
}

// Reproduce un pequeño timbre de dos tonos (no requiere ningún archivo de audio).
export function playNotificationSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.18);
    playTone(1175, now + 0.18, 0.22);
  } catch (err) {
    console.warn('No se pudo reproducir el sonido de notificación:', err);
  }
}

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

// Debe llamarse dentro de un gesto del usuario (click de un botón), los
// navegadores no permiten pedir permiso automáticamente al cargar la página.
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  primeAudio();
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Error pidiendo permiso de notificaciones:', err);
    return 'denied';
  }
}

// Muestra una notificación del navegador (si hay permiso) y reproduce el sonido.
export function notify(title, options = {}) {
  playNotificationSound();
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        icon: '/web-app-manifest-192x192.png',
        badge: '/favicon-96x96.png',
        ...options,
      });
      if (options.onClick) {
        n.onclick = options.onClick;
      } else {
        n.onclick = () => window.focus();
      }
    } catch (err) {
      console.warn('No se pudo mostrar la notificación:', err);
    }
  }
}
