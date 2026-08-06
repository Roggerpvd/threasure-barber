import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { notify } from '../utils/notifications';

/**
 * Escucha en tiempo real la colección "reservas" (status == 'pendiente') y
 * dispara una notificación + sonido cada vez que llega una reserva nueva.
 * Solo notifica mientras el panel de admin esté abierto en el navegador.
 *
 * @param {boolean} enabled - normalmente `authed` (admin logueado)
 * @param {() => void} onNewBooking - callback opcional para refrescar listas, etc.
 */
export default function useNewBookingAlert(enabled, onNewBooking) {
  const isFirstSnapshot = useRef(true);

  useEffect(() => {
    if (!enabled) return undefined;

    isFirstSnapshot.current = true;
    const q = query(collection(db, 'reservas'), where('status', '==', 'pendiente'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        // En la primera carga no avisamos (son las reservas ya existentes),
        // solo avisamos de los cambios que lleguen después.
        if (isFirstSnapshot.current) {
          isFirstSnapshot.current = false;
          return;
        }
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            notify('Nueva reserva recibida', {
              body: `${data.fullName || 'Un cliente'} · ${data.date || ''} ${data.time || ''}`,
              tag: `nueva-reserva-${change.doc.id}`,
            });
          }
        });
        if (onNewBooking) onNewBooking();
      },
      err => console.error('Error escuchando nuevas reservas:', err)
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
