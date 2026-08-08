import React, { useEffect, useState } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  playNotificationSound,
} from '../utils/notifications';
import { subscribeToPush, isPushSupported } from '../utils/push';

// Botón para activar notificaciones REALES (llegan aunque el navegador esté
// cerrado, vía push). Los navegadores exigen que el permiso se pida a
// partir de un clic del usuario, por eso no se puede activar solo al cargar
// la página.
export default function EnableNotificationsButton({ className = '' }) {
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  if (!isNotificationSupported()) return null;

  if (permission === 'granted') {
    return (
      <button
        type="button"
        onClick={() => playNotificationSound()}
        className={`font-nav-label text-[10px] uppercase tracking-widest px-3 py-1.5 border border-green-500/30 text-green-600 hover:bg-green-500/10 transition-colors ${className}`}
        title="Probar sonido de notificación"
      >
        🔔 Notificaciones activadas
      </button>
    );
  }

  if (permission === 'denied') {
    return (
      <span
        className={`font-nav-label text-[10px] uppercase tracking-widest px-3 py-1.5 border border-outline/20 text-on-background/40 ${className}`}
        title="Bloqueaste las notificaciones en el navegador. Actívalas desde la configuración del sitio."
      >
        🔕 Notificaciones bloqueadas
      </span>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      if (isPushSupported()) {
        const result = await subscribeToPush();
        setPermission(result.permission);
        if (result.ok) playNotificationSound();
      } else {
        // Respaldo: navegador sin soporte de push (raro), al menos dejamos
        // el permiso de notificación local activado.
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') playNotificationSound();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo activar.');
    }
    setLoading(false);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="font-nav-label text-[10px] uppercase tracking-widest px-3 py-1.5 border border-primary/40 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
      >
        {loading ? 'Activando…' : '🔔 Activar notificaciones'}
      </button>
      {error && (
        <p className="text-[10px] text-red-500 mt-1 max-w-[220px]">{error}</p>
      )}
    </div>
  );
}
