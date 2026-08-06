import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import {
  doc, setDoc, deleteDoc, getDoc, collection, getDocs,
  query, where, updateDoc
} from 'firebase/firestore';
import WeekAvailability from '../components/WeekAvailability';
import EnableNotificationsButton from '../components/EnableNotificationsButton';
import useNewBookingAlert from '../hooks/useNewBookingAlert';
import useAppointmentReminder from '../hooks/useAppointmentReminder';


// El acceso a este panel ahora se controla con Firebase Auth (ver RequireAdmin.jsx),
// usando un correo y contraseña privados que solo tú conoces.

const ALL_SLOTS = [
  { label: '8:00 a.m.',  hour: 8  },
  { label: '9:00 a.m.',  hour: 9  },
  { label: '10:00 a.m.', hour: 10 },
  { label: '11:00 a.m.', hour: 11 },
  { label: '12:00 p.m.', hour: 12 },
  { label: '2:00 p.m.',  hour: 14 },
  { label: '3:00 p.m.',  hour: 15 },
  { label: '4:00 p.m.',  hour: 16 },
  { label: '5:00 p.m.',  hour: 17 },
  { label: '6:00 p.m.',  hour: 18 },
];

export default function AdminPanel() {
  // El control de acceso real ya lo hace <RequireAdmin> en App.jsx.
  const authed = true;


  const [selectedDate, setSelectedDate] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [horasBloquedas, setHorasBloquedas] = useState([]);
  const [reason, setReason] = useState('');
  const [bloqueos, setBloqueos] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');


  const [reservasPendientes, setReservasPendientes] = useState([]);
  const [confirmando, setConfirmando] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [searchBloqueo, setSearchBloqueo] = useState('');
  const [justConfirmed, setJustConfirmed] = useState(null);

  const [reservasConfirmadas, setReservasConfirmadas] = useState([]);
  const [mesExportar, setMesExportar] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loadingReporte, setLoadingReporte] = useState(false);

  const [comprasCurso, setComprasCurso] = useState([]);


  const today = new Date().toISOString().split('T')[0];




  // ── FETCHERS ──

  const fetchBloqueos = async () => {
    const snap = await getDocs(collection(db, 'bloqueos'));
    const data = {};
    snap.forEach(d => { data[d.id] = d.data(); });
    setBloqueos(data);
  };


  const fetchReservasPendientes = async () => {
    const q = query(collection(db, 'reservas'), where('status', '==', 'pendiente'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => a.date.localeCompare(b.date));
    setReservasPendientes(data);
  };


  const fetchReservasConfirmadas = async () => {
    setLoadingReporte(true);
    try {
      const q = query(collection(db, 'reservas'), where('status', '==', 'confirmada'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReservasConfirmadas(data);
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
    setLoadingReporte(false);
  };

  const fetchComprasCurso = async () => {
    try {
      const q = query(collection(db, 'compras_curso'), where('status', '==', 'pendiente'));
      const snap = await getDocs(q);
      setComprasCurso(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error cargando compras curso:', err);
    }
  };




  useEffect(() => {

    if (authed) {

      fetchBloqueos();

      fetchReservasPendientes();

      fetchReservasConfirmadas();

      fetchComprasCurso();

    }

  }, [authed]);

  // Notificacion + sonido en tiempo real cuando llega una reserva nueva.
  useNewBookingAlert(authed, () => {
    fetchReservasPendientes();
    fetchBloqueos();
  });

  // Recordatorio 30 minutos antes de cada cita confirmada (mientras el panel este abierto).
  useAppointmentReminder(
    reservasConfirmadas.filter(r => r.date >= today),
    (appt) => ({
      title: 'Cita en 30 minutos',
      body: `${appt.fullName || 'Cliente'} - ${appt.time || ''} - ${(appt.services || []).join(', ')}`,
    }),
    authed
  );




  useEffect(() => {

    if (!selectedDate || !bloqueos[selectedDate]) {

      setAllDay(false);

      setHorasBloquedas([]);

      setReason('');

      return;

    }

    const b = bloqueos[selectedDate];

    setAllDay(b.allDay || false);

    setHorasBloquedas(b.horasBloquedas || []);

    setReason(b.reason || '');

  }, [selectedDate, bloqueos]);




  // ── HANDLERS ──





  const toggleHora = (hour) => {

    setHorasBloquedas(prev =>

      prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour]

    );

  };




  const handleGuardar = async () => {

    if (!selectedDate) return;

    setSaving(true);

    try {

      // Preservamos las horas ya reservadas (citas confirmadas) al guardar
      // un bloqueo manual: son cosas independientes.
      const horasReservadasExistentes = bloqueos[selectedDate]?.horasReservadas || [];

      if (!allDay && horasBloquedas.length === 0) {

        if (horasReservadasExistentes.length > 0) {

          await setDoc(doc(db, 'bloqueos', selectedDate), {

            allDay: false,

            horasBloquedas: [],

            horasReservadas: horasReservadasExistentes,

            reason: '',

          });

        } else {

          await deleteDoc(doc(db, 'bloqueos', selectedDate));

        }

        setFeedback('Bloqueo eliminado.');

      } else {

        await setDoc(doc(db, 'bloqueos', selectedDate), {

          allDay,

          horasBloquedas: allDay ? [] : horasBloquedas,

          horasReservadas: horasReservadasExistentes,

          reason: reason.trim(),

        });

        setFeedback('✔ Bloqueo guardado.');

      }

      await fetchBloqueos();

    } catch (err) {

      setFeedback('Error al guardar. Revisa Firebase.');

      console.error(err);

    }

    setSaving(false);

    setTimeout(() => setFeedback(''), 3000);

  };




  const handleEliminar = async (fecha) => {

    // Si ese día tiene citas reservadas, no borramos el documento entero:
    // solo quitamos el bloqueo manual y dejamos las horas reservadas intactas.
    const horasReservadasExistentes = bloqueos[fecha]?.horasReservadas || [];

    if (horasReservadasExistentes.length > 0) {

      await setDoc(doc(db, 'bloqueos', fecha), {

        allDay: false,

        horasBloquedas: [],

        horasReservadas: horasReservadasExistentes,

        reason: '',

      });

    } else {

      await deleteDoc(doc(db, 'bloqueos', fecha));

    }

    await fetchBloqueos();

    if (selectedDate === fecha) {

      setAllDay(false);

      setHorasBloquedas([]);

      setReason('');

    }

    setConfirmDialog(null);

  };




  const handleConfirmarPago = async (reserva) => {

    setConfirmando(reserva.id);

    try {

      const bloqueoRef = doc(db, 'bloqueos', reserva.date);

      const bloqueoSnap = await getDoc(bloqueoRef);

      const existente = bloqueoSnap.exists()

        ? bloqueoSnap.data()

        : { allDay: false, horasBloquedas: [], horasReservadas: [], reason: '' };




      // Al confirmar el pago, la hora queda RESERVADA (horasReservadas).
      // Esto es distinto de horasBloquedas, que son los cierres manuales del admin.
      if (!existente.allDay && reserva.hour !== null && reserva.hour !== undefined) {

        const nuevasReservadas = [...new Set([...(existente.horasReservadas || []), reserva.hour])];

        await setDoc(bloqueoRef, {

          allDay: existente.allDay || false,

          horasBloquedas: existente.horasBloquedas || [],

          horasReservadas: nuevasReservadas,

          reason: existente.reason || '',

        });

      }




      await updateDoc(doc(db, 'reservas', reserva.id), { status: 'confirmada' });

      await fetchBloqueos();

      await fetchReservasPendientes();

      await fetchReservasConfirmadas();

      setJustConfirmed(reserva.id);

      setTimeout(() => setJustConfirmed(null), 2000);

    } catch (err) {

      console.error('Error confirmando pago:', err);

      alert('Error al confirmar. Revisa la consola.');

    }

    setConfirmando(null);

  };




  const handleRechazarReserva = async (reserva) => {

    await deleteDoc(doc(db, 'reservas', reserva.id));

    // Liberamos la hora que se había bloqueado al crear la reserva
    if (!reserva.isCustomTime && reserva.hour !== null && reserva.hour !== undefined) {
      const bloqueoRef = doc(db, 'bloqueos', reserva.date);
      const bloqueoSnap = await getDoc(bloqueoRef);
      if (bloqueoSnap.exists()) {
        const existente = bloqueoSnap.data();
        const nuevasHoras = (existente.horasBloquedas || []).filter(h => h !== reserva.hour);
        await setDoc(bloqueoRef, { ...existente, horasBloquedas: nuevasHoras });
      }
    }

    await fetchReservasPendientes();

    await fetchBloqueos();

    setConfirmDialog(null);

  };





  const handleConfirmarCurso = async (compra) => {

    await updateDoc(doc(db, 'compras_curso', compra.id), { status: 'confirmada' });

    await fetchComprasCurso();

  };




  // ── EXPORTAR EXCEL ──

  const exportarExcel = () => {

    const filtradas = reservasConfirmadas.filter(r => r.date?.startsWith(mesExportar));




    if (filtradas.length === 0) {

      alert('No hay citas confirmadas en ese mes.');

      return;

    }




    const filas = filtradas

      .sort((a, b) => a.date.localeCompare(b.date))

      .map((r, i) => ({

        '#': i + 1,

        'Fecha': r.date,

        'Hora': r.time,

        'Cliente': r.fullName,

        'Servicios': Array.isArray(r.services) ? r.services.join(', ') : r.services,

        'Total (S/.)': r.total,

        'Adelanto cobrado (S/.)': r.adelanto,

        'Resto cobrado (S/.)': r.resto,

      }));




    const totalMes = filtradas.reduce((sum, r) => sum + (r.total || 0), 0);

    const adelantoMes = filtradas.reduce((sum, r) => sum + (r.adelanto || 0), 0);




    filas.push({

      '#': '',

      'Fecha': '',

      'Hora': '',

      'Cliente': 'TOTAL DEL MES',

      'Servicios': `${filtradas.length} citas`,

      'Total (S/.)': totalMes,

      'Adelanto cobrado (S/.)': adelantoMes,

      'Resto cobrado (S/.)': totalMes - adelantoMes,

    });




    const ws = XLSX.utils.json_to_sheet(filas);

    ws['!cols'] = [

      { wch: 4 },

      { wch: 12 },

      { wch: 12 },

      { wch: 22 },

      { wch: 35 },

      { wch: 14 },

      { wch: 22 },

      { wch: 20 },

    ];




    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, `Reporte ${mesExportar}`);

    XLSX.writeFile(wb, `threasure-reporte-${mesExportar}.xlsx`);

  };




  // ── PANEL ──

  const bloqueosSorted = Object.entries(bloqueos)
    // Solo mostramos en "bloqueos activos" los que el admin cerro a mano
    // (allDay o con horas en horasBloquedas). Las horas en horasReservadas
    // son citas confirmadas, no bloqueos manuales.
    .filter(([fecha]) => fecha >= today)
    .filter(([, data]) => data.allDay || (data.horasBloquedas && data.horasBloquedas.length > 0))
    .filter(([fecha, data]) =>
      searchBloqueo === '' ||
      fecha.includes(searchBloqueo) ||
      data.reason?.toLowerCase().includes(searchBloqueo.toLowerCase())
    )
    .sort(([a], [b]) => a.localeCompare(b));




  const proximoBloqueo = Object.entries(bloqueos)

    .filter(([fecha]) => fecha >= today)

    .sort(([a], [b]) => a.localeCompare(b))[0];




  const montoPendienteTotal = reservasPendientes.reduce((sum, r) => sum + (r.adelanto || 0), 0);




  const delMesActual = reservasConfirmadas.filter(r => r.date?.startsWith(mesExportar));

  const totalMesActual = delMesActual.reduce((sum, r) => sum + (r.total || 0), 0);




  return (

    <div className="min-h-screen bg-background text-on-background pt-32 pb-16 px-margin-mobile md:px-margin-desktop">

      <div className="max-w-4xl mx-auto">




        {/* Header */}

        <div className="flex items-center justify-between mb-10">

          <div className="border-l-4 border-primary pl-6">

            <h1 className="font-display-lg text-3xl uppercase text-primary">PANEL ADMIN</h1>

            <p className="font-body-small text-on-background/50 text-sm mt-1">

              Threasure Barber — gestión completa

            </p>

          </div>

          <div className="flex items-center gap-3">
            <EnableNotificationsButton />
            <button
              onClick={() => setAuthed(false)}
              className="font-nav-label text-[10px] uppercase tracking-widest text-on-background/30 hover:text-primary transition-colors"
            >
              SALIR
            </button>
          </div>
        </div>




        {/* ── MÉTRICAS RÁPIDAS ── */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">

          <div className="bg-surface-container-low p-4 transition-transform hover:scale-[1.02]">

            <p className="font-display-lg text-3xl text-primary">{reservasPendientes.length}</p>

            <p className="font-nav-label text-[9px] uppercase tracking-widest text-on-background/40 mt-1">

              Reservas pendientes

            </p>

          </div>

          <div className="bg-surface-container-low p-4 transition-transform hover:scale-[1.02]">

            <p className="font-display-lg text-3xl text-primary">S/. {montoPendienteTotal}</p>

            <p className="font-nav-label text-[9px] uppercase tracking-widest text-on-background/40 mt-1">

              Adelantos por confirmar

            </p>

          </div>

          <div className="bg-surface-container-low p-4 transition-transform hover:scale-[1.02]">

            <p className="font-display-lg text-3xl text-primary">S/. {totalMesActual}</p>

            <p className="font-nav-label text-[9px] uppercase tracking-widest text-on-background/40 mt-1">

              Ingresos este mes

            </p>

          </div>

          <div className="bg-surface-container-low p-4 transition-transform hover:scale-[1.02]">

            <p className="font-display-lg text-3xl text-primary truncate">

              {proximoBloqueo ? proximoBloqueo[0].slice(5) : '—'}

            </p>

            <p className="font-nav-label text-[9px] uppercase tracking-widest text-on-background/40 mt-1">

              Próximo bloqueo

            </p>

          </div>

        </div>




        {/* ── RESERVAS PENDIENTES ── */}

        <div className="mb-12">

          <h2 className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-6 flex items-center gap-2">

            RESERVAS PENDIENTES DE PAGO

            {reservasPendientes.length > 0 && (

              <span className="bg-primary text-on-primary w-5 h-5 rounded-full flex items-center justify-center text-[10px]">

                {reservasPendientes.length}

              </span>

            )}

          </h2>

          {reservasPendientes.length === 0 ? (

            <p className="font-body-small text-on-background/30 text-sm italic">

              No hay reservas esperando confirmación.

            </p>

          ) : (

            <div className="space-y-3">

              {reservasPendientes.map(reserva => (

                <div

                  key={reserva.id}

                  className={`border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${

                    justConfirmed === reserva.id

                      ? 'border-green-500 bg-green-500/5'

                      : 'border-primary/30'

                  }`}

                >

                  <div className="flex-1">

                    <p className="font-nav-label text-sm text-primary uppercase tracking-widest">

                      {reserva.fullName}

                    </p>

                    <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/50 mt-1">

                      Reservado a las {reserva.time} — {reserva.date}

                    </p>

                    <p className="font-body-small text-xs text-on-background/50 mt-1">

                      {reserva.services?.join(', ')}

                    </p>

                    <p className="font-body-small text-xs text-on-background/40 mt-1">

                      Adelanto: S/. {reserva.adelanto} — Total: S/. {reserva.total}

                    </p>

                  </div>

                  <div className="flex gap-2 flex-shrink-0">

                    <button

                      onClick={() => handleConfirmarPago(reserva)}

                      disabled={confirmando === reserva.id || justConfirmed === reserva.id}

                      className="bg-primary text-on-primary px-6 py-3 font-nav-label text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"

                    >

                      {confirmando === reserva.id ? (

                        <>

                          <span className="inline-block w-3 h-3 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin"></span>

                          CONFIRMANDO...

                        </>

                      ) : justConfirmed === reserva.id ? '✓ CONFIRMADO' : '✔ CONFIRMAR PAGO'}

                    </button>

                    <button

                      onClick={() => setConfirmDialog({ type: 'rechazar', payload: reserva })}

                      className="border border-outline/20 text-on-background/40 px-4 py-3 font-nav-label text-[10px] uppercase tracking-widest hover:border-red-500 hover:text-red-500 active:scale-95 transition-all"

                    >

                      ✕

                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>




        {/* ── COMPRAS CURSO PENDIENTES ── */}

        {comprasCurso.length > 0 && (

          <div className="mb-12">

            <h2 className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-6 flex items-center gap-2">

              COMPRAS DE ACADEMY PENDIENTES

              <span className="bg-primary text-on-primary w-5 h-5 rounded-full flex items-center justify-center text-[10px]">

                {comprasCurso.length}

              </span>

            </h2>

            <div className="space-y-3">

              {comprasCurso.map(c => (

                <div key={c.id} className="border border-primary/30 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">

                  <div className="flex-1">

                    <p className="font-nav-label text-sm text-primary uppercase tracking-widest">

                      {c.fullName}

                    </p>

                    <p className="font-body-small text-xs text-on-background/50 mt-1">

                      WhatsApp: {c.phone}

                    </p>

                    <p className="font-body-small text-xs text-on-background/40 mt-1">

                      S/. {c.precio} — Threasure Academy

                    </p>

                  </div>

                  <button

                    onClick={() => handleConfirmarCurso(c)}

                    className="bg-primary text-on-primary px-6 py-3 font-nav-label text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all flex-shrink-0"

                  >

                    ✔ CONFIRMAR Y DAR ACCESO

                  </button>

                </div>

              ))}

            </div>

          </div>

        )}




        {/* ── REPORTE MENSUAL ── */}

        <div className="mb-12 border border-outline/10 p-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">

            <div>

              <h2 className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-1">

                REPORTE DE INGRESOS

              </h2>

              <p className="font-body-small text-xs text-on-background/30">

                Exporta tus citas confirmadas del mes a Excel

              </p>

            </div>

            <div className="flex items-end gap-4">

              <div>

                <label className="block font-nav-label text-[10px] uppercase tracking-widest text-on-background/30 mb-2">

                  MES

                </label>

                <input

                  type="month"

                  value={mesExportar}

                  onChange={(e) => setMesExportar(e.target.value)}

                  className="bg-surface-container-low text-primary border-outline/10 px-4 py-3 font-nav-label tracking-widest text-sm focus:ring-2 focus:ring-primary/20"

                />

              </div>

              <button

                onClick={exportarExcel}

                disabled={loadingReporte}

                className="bg-primary text-on-primary px-8 py-3 font-nav-label text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"

              >

                <span className="material-symbols-outlined text-sm">download</span>

                EXPORTAR EXCEL

              </button>

            </div>

          </div>




          {/* Resumen rápido del mes */}

          {(() => {

            const delMes = reservasConfirmadas.filter(r => r.date?.startsWith(mesExportar));

            const totalMes = delMes.reduce((sum, r) => sum + (r.total || 0), 0);

            return delMes.length > 0 ? (

              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-outline/10">

                <div>

                  <p className="font-display-lg text-2xl text-primary">{delMes.length}</p>

                  <p className="font-nav-label text-[9px] uppercase tracking-widest text-on-background/40">Citas confirmadas</p>

                </div>

                <div>

                  <p className="font-display-lg text-2xl text-primary">S/. {totalMes}</p>

                  <p className="font-nav-label text-[9px] uppercase tracking-widest text-on-background/40">Ingreso total</p>

                </div>

                <div>

                  <p className="font-display-lg text-2xl text-primary">

                    S/. {Math.round(totalMes / delMes.length)}

                  </p>

                  <p className="font-nav-label text-[9px] uppercase tracking-widest text-on-background/40">Ticket promedio</p>

                </div>

              </div>

            ) : (

              <p className="font-body-small text-xs text-on-background/30 italic pt-4 border-t border-outline/10">

                Sin citas confirmadas en {mesExportar}.

              </p>

            );

          })()}

        </div>





        {/* ── VISTA SEMANAL DE DISPONIBILIDAD ── */}
        <div className="mb-16">
          <h2 className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-4">
            DISPONIBILIDAD DE LA SEMANA
          </h2>
          <WeekAvailability
            bloqueosByDate={bloqueos}
            selectedDate={selectedDate}
            onDayHeaderClick={(fecha) => setSelectedDate(fecha)}
          />
          <p className="font-nav-label text-[10px] uppercase tracking-widest text-on-background/30 mt-3">
            Toca el nombre de un día para editar sus bloqueos abajo.
          </p>
        </div>

        {/* ── BLOQUEO DE DÍAS/HORAS ── */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">




          {/* Formulario de bloqueo */}

          <div className="space-y-8">

            <h2 className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40">

              AGREGAR / EDITAR BLOQUEO

            </h2>




            <div>

              <label className="block font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-3">

                FECHA

              </label>

              <input

                type="date"

                min={today}

                className="w-full bg-surface-container-low text-primary border-outline/10 px-6 py-4 font-nav-label tracking-widest text-sm focus:ring-2 focus:ring-primary/20 transition-shadow"

                value={selectedDate}

                onChange={(e) => setSelectedDate(e.target.value)}

              />

            </div>




            {selectedDate && (

              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-8">

                {/* Toggle día completo */}

                <div

                  className="flex items-center gap-4 cursor-pointer"

                  onClick={() => { setAllDay(p => !p); setHorasBloquedas([]); }}

                >

                  <div className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${allDay ? 'bg-primary' : 'bg-outline/20'}`}>

                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${allDay ? 'left-7' : 'left-1'}`} />

                  </div>

                  <span className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/60">

                    BLOQUEAR DÍA COMPLETO

                  </span>

                </div>




                {/* Slots individuales */}

                {!allDay && (

                  <div>

                    <div className="flex items-center justify-between mb-4">

                      <label className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40">

                        HORAS A BLOQUEAR

                      </label>

                      {horasBloquedas.length > 0 && (

                        <span className="font-nav-label text-[10px] text-primary">

                          {horasBloquedas.length} seleccionadas

                        </span>

                      )}

                    </div>

                    <div className="grid grid-cols-2 gap-2">

                      {ALL_SLOTS.map(slot => {

                        const blocked = horasBloquedas.includes(slot.hour);

                        return (

                          <button

                            key={slot.hour}

                            type="button"

                            onClick={() => toggleHora(slot.hour)}

                            className={`py-3 border font-nav-label text-[11px] transition-all duration-150 active:scale-95 ${

                              blocked

                                ? 'bg-primary border-primary text-on-primary'

                                : 'border-outline/10 text-on-background/60 hover:border-primary'

                            }`}

                          >

                            {blocked ? '✕ ' : ''}{slot.label}

                          </button>

                        );

                      })}

                    </div>

                  </div>

                )}




                {/* Motivo */}

                <div>

                  <label className="block font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-3">

                    MOTIVO (solo tú lo ves)

                  </label>

                  <input

                    type="text"

                    className="w-full bg-transparent border-b border-outline/20 focus:border-primary focus:ring-0 px-0 py-3 font-body-main text-base text-primary placeholder:text-on-background/20"

                    placeholder="Ej: Viaje a Lima, día libre..."

                    value={reason}

                    onChange={(e) => setReason(e.target.value)}

                  />

                </div>




                {/* Guardar */}

                <div className="flex items-center gap-4">

                  <button

                    onClick={handleGuardar}

                    disabled={saving}

                    className="bg-primary text-on-primary px-10 py-4 font-nav-label text-[11px] uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"

                  >

                    {saving && (

                      <span className="inline-block w-3 h-3 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin"></span>

                    )}

                    {saving ? 'GUARDANDO...' : 'GUARDAR BLOQUEO'}

                  </button>

                  {feedback && (

                    <span className="font-nav-label text-[10px] uppercase tracking-widest text-primary animate-in fade-in duration-300">

                      {feedback}

                    </span>

                  )}

                </div>

              </div>

            )}

          </div>




          {/* Lista de bloqueos activos */}

          <div>

            <div className="flex items-center justify-between mb-6">

              <h2 className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40">

                BLOQUEOS ACTIVOS

              </h2>

              {Object.keys(bloqueos).length > 2 && (

                <input

                  type="text"

                  placeholder="Buscar..."

                  value={searchBloqueo}

                  onChange={(e) => setSearchBloqueo(e.target.value)}

                  className="bg-transparent border-b border-outline/20 focus:border-primary focus:ring-0 px-0 py-1 font-nav-label text-[11px] text-on-background w-28 placeholder:text-on-background/30"

                />

              )}

            </div>

            {bloqueosSorted.length === 0 ? (

              <p className="font-body-small text-on-background/30 text-sm italic">

                {searchBloqueo ? 'Sin resultados.' : 'No hay bloqueos programados.'}

              </p>

            ) : (

              <div className="space-y-3">

                {bloqueosSorted.map(([fecha, data]) => (

                  <div

                    key={fecha}

                    onClick={() => setSelectedDate(fecha)}

                    className={`flex items-start justify-between p-5 border gap-4 cursor-pointer transition-all duration-150 hover:translate-x-1 ${

                      selectedDate === fecha ? 'border-primary' : 'border-outline/10 hover:border-primary/40'

                    }`}

                  >

                    <div className="flex-1 min-w-0">

                      <p className="font-nav-label text-sm text-primary uppercase tracking-widest">{fecha}</p>

                      {data.allDay ? (

                        <p className="font-body-small text-xs text-on-background/50 mt-1">DÍA COMPLETO</p>

                      ) : (

                        <p className="font-body-small text-xs text-on-background/50 mt-1">

                          {ALL_SLOTS

                            .filter(s => data.horasBloquedas?.includes(s.hour))

                            .map(s => s.label)

                            .join(', ')}

                        </p>

                      )}

                      {data.reason && (

                        <p className="font-body-small text-xs text-on-background/30 mt-1 italic truncate">

                          {data.reason}

                        </p>

                      )}

                    </div>

                    <button

                      onClick={(e) => { e.stopPropagation(); setConfirmDialog({ type: 'eliminar', payload: fecha }); }}

                      className="font-nav-label text-[10px] uppercase tracking-widest text-on-background/30 hover:text-red-500 active:scale-95 transition-all flex-shrink-0"

                    >

                      ELIMINAR

                    </button>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </div>




      {/* ── MODAL DE CONFIRMACIÓN ── */}

      {confirmDialog && (

        <div

          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150"

          onClick={() => setConfirmDialog(null)}

        >

          <div

            className="bg-background border border-outline/20 p-8 max-w-sm w-full animate-in zoom-in-95 duration-150"

            onClick={(e) => e.stopPropagation()}

          >

            <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-3">

              {confirmDialog.type === 'rechazar' ? 'DESCARTAR RESERVA' : 'ELIMINAR BLOQUEO'}

            </p>

            <p className="font-body-main text-sm text-on-background/70 mb-8">

              {confirmDialog.type === 'rechazar'

                ? `¿Seguro que quieres descartar la reserva de ${confirmDialog.payload.fullName}? El horario quedará disponible de nuevo.`

                : `¿Seguro que quieres eliminar el bloqueo del ${confirmDialog.payload}?`}

            </p>

            <div className="flex gap-3">

              <button

                onClick={() =>

                  confirmDialog.type === 'rechazar'

                    ? handleRechazarReserva(confirmDialog.payload)

                    : handleEliminar(confirmDialog.payload)

                }

                className="flex-1 bg-red-500 text-white py-3 font-nav-label text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"

              >

                SÍ, ELIMINAR

              </button>

              <button

                onClick={() => setConfirmDialog(null)}

                className="flex-1 border border-outline/20 py-3 font-nav-label text-[11px] uppercase tracking-widest hover:border-primary transition-all"

              >

                CANCELAR

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}
