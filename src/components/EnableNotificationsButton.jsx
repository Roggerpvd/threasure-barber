import React, { useEffect, useState } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  playNotificationSound,
} from '../utils/notifications';

// Botón chiquito para activar notificaciones + sonido. Los navegadores
// exigen que el permiso se pida a partir de un clic del usuario, por eso no
// se puede activar solo al cargar la página.
export default function EnableNotificationsButton({ className = '' }) {
  const [permission, setPermission] = useState('default');

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
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') playNotificationSound();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`font-nav-label text-[10px] uppercase tracking-widest px-3 py-1.5 border border-primary/40 text-primary hover:bg-primary/10 transition-colors ${className}`}
    >
      🔔 Activar notificaciones
    </button>
  );
}
