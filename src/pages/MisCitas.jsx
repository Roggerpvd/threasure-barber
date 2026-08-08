import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import EnableNotificationsButton from '../components/EnableNotificationsButton';
import useAppointmentReminder from '../hooks/useAppointmentReminder';

const statusStyles = {
  pendiente: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  confirmada: 'bg-green-500/10 text-green-600 border-green-500/30',
  cancelada: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const statusLabel = {
  pendiente: 'Pago en revisión',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
};

export default function MisCitas() {
  const { user, loadingAuth, logout } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCitas = async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      try {
        const q = query(collection(db, 'reservas'), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setCitas(data);
      } catch (err) {
        console.error('Error cargando citas:', err);
      }
      setLoading(false);
    };
    fetchCitas();
  }, [user]);

  // Avisa (notificación del navegador + sonido) 30 minutos antes de cada
  // cita confirmada, mientras esta página esté abierta en el navegador.
  useAppointmentReminder(
    citas.filter(c => c.status === 'confirmada'),
    (cita) => ({
      title: 'Tu cita es en 30 minutos',
      body: `Threasure Barber · ${cita.time || ''} · ${(cita.services || []).join(', ')}`,
    }),
    !!user
  );

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-20">
        <p className="text-on-background/60">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-6 pt-20">
        <h1 className="font-headline-md text-headline-md text-primary text-center">Mis Citas</h1>
        <p className="text-on-background/60 text-center max-w-sm">
          Inicia sesión con tu cuenta de Google para ver tus citas y el estado de tu pago.
        </p>
        <GoogleLoginButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28 pb-20 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-headline-md text-headline-md text-primary">Mis Citas</h1>
          <div className="flex items-center gap-4">
            <EnableNotificationsButton />
            <button onClick={logout} className="text-sm text-on-background/50 hover:text-on-background underline">
              Cerrar sesión
            </button>
          </div>
        </div>

        {loading && <p className="text-on-background/60">Cargando tus citas...</p>}

        {!loading && citas.length === 0 && (
          <p className="text-on-background/60">Aún no tienes citas registradas.</p>
        )}

        <div className="flex flex-col gap-4">
          {citas.map(cita => (
            <div key={cita.id} className="border border-outline/10 bg-surface p-6 flex flex-col gap-2">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <p className="font-nav-label text-xs uppercase tracking-widest text-on-background/40">
                    {cita.date} {cita.time ? `· ${cita.time}` : ''}
                  </p>
                  <p className="font-body-main text-on-background">
                    {(cita.services || []).join(', ')}
                  </p>
                </div>
                <span className={`px-3 py-1 border text-xs font-nav-label uppercase tracking-widest ${statusStyles[cita.status] || 'bg-outline/10 text-on-background/60 border-outline/20'}`}>
                  {statusLabel[cita.status] || cita.status}
                </span>
              </div>
              <div className="flex gap-6 text-sm text-on-background/60 mt-2">
                <span>Total: S/. {Number(cita.total || 0).toFixed(2)}</span>
                <span>Adelanto: S/. {Number(cita.adelanto || 0).toFixed(2)}</span>
                <span>Resto: S/. {Number(cita.resto || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
