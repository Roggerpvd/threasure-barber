import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';

const RECARGO_ESPECIAL = 5;

export default function Reserva() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [paySubStep, setPaySubStep] = useState('confirm');
  const [fullName, setFullName] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [bloqueo, setBloqueo] = useState(null);
  const [loadingBloqueo, setLoadingBloqueo] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [magnet, setMagnet] = useState({ x: 0, y: 0 });

  const services = [
    { id: 'corte', name: 'CORTE DE CABELLO CLASICO + TEXTURIZADO/DEGRAFILADO', price: 25 },
    { id: 'fade',  name: 'SKIN FADE',                price: 30 },
    { id: 'barba', name: 'BARBA',                    price: 5  },
    { id: 'cejas', name: 'PERFILADO DE CEJAS',       price: 5  },
    { id: 'pack',  name: 'CORTE A DOMICILIO',        price: 40 },
  ];
  

  const allTimeSlots = [
    { label: '8:00 a.m.',  hour: 8  },
    { label: '9:00 a.m.',  hour: 9  },
    { label: '10:00 a.m.', hour: 10 },
    { label: '11:00 a.m.', hour: 11 },
    { label: '12:00 p.m.', hour: 12 },
    { label: '2:00 p.m.',  hour: 14 },
    { label: '3:00 p.m.',  hour: 15 },
    { label: '4:00 p.m.',  hour: 16 },
    { label: '5:00 p.m.',  hour: 17 },
    { label: '6:00 p.m.',  hour: 18 },
  ];

  const getDayBlocks = (dateStr) => {
    if (!dateStr) return [];
    const d = new Date(dateStr + 'T12:00:00');
    const dow = d.getDay();
    switch (dow) {
      case 1: return [10, 11, 12, 17, 18];
      case 2: return [14, 15, 16];
      case 3: return [15, 16, 17];
      case 5: return [9, 10, 11, 15, 16, 17];
      default: return [];
    }
  };

  useEffect(() => {
    if (user && !fullName) {
      setFullName(user.displayName || '');
    }
  }, [user]);

  const today = (() => {
  const now = new Date();
  const peruOffsetMs = -5 * 60 * 60 * 1000; // Perú es UTC-5 fijo, sin horario de verano
  const peruNow = new Date(now.getTime() + peruOffsetMs);
  return peruNow.toISOString().split('T')[0];
  })();

  useEffect(() => {
    if (!date) { setBloqueo(null); return; }
    setLoadingBloqueo(true);
    getDoc(doc(db, 'bloqueos', date))
      .then(snap => setBloqueo(snap.exists() ? snap.data() : null))
      .catch(err => console.error('Error consultando bloqueo:', err))
      .finally(() => setLoadingBloqueo(false));
  }, [date]);

  const availableSlots = (() => {
  let slots = allTimeSlots;
  if (date === today) {
    const now = new Date();
    const peruOffsetMs = -5 * 60 * 60 * 1000; // Perú es UTC-5 fijo
    const peruNow = new Date(now.getTime() + peruOffsetMs);
    const currentHour = peruNow.getUTCHours();
    slots = slots.filter(s => s.hour > currentHour);
  }
  if (bloqueo?.allDay) return [];
  if (bloqueo?.horasBloquedas?.length) {
    slots = slots.filter(s => !bloqueo.horasBloquedas.includes(s.hour));
  }
  const dayBlocks = getDayBlocks(date);
  if (dayBlocks.length) {
    slots = slots.filter(s => !dayBlocks.includes(s.hour));
  }
  return slots;
  })();

  const formatCustomTime = (val) => {
    if (!val) return '';
    const [h, m] = val.split(':').map(Number);
    const period = h >= 12 ? 'p.m.' : 'a.m.';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const selectedTime = useCustomTime ? formatCustomTime(customTime) : time;

  const handleServiceChange = (serviceName, price) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.name === serviceName);
      return exists
        ? prev.filter(s => s.name !== serviceName)
        : [...prev, { name: serviceName, price }];
    });
  };

  const handleToggleCustomTime = () => {
    setUseCustomTime(prev => !prev);
    setTime('');
    setCustomTime('');
  };

  const handleSlotSelect = (label) => {
    setTime(label);
    setUseCustomTime(false);
    setCustomTime('');
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setTime('');
    setCustomTime('');
  };

  const calculateServicesTotal = () =>
    selectedServices.reduce((sum, s) => sum + s.price, 0);

  const calculateTotal = () =>
    calculateServicesTotal() + (useCustomTime ? RECARGO_ESPECIAL : 0);

  const calculateAdelanto = () =>
    Math.ceil(calculateTotal() * 0.5);

  const calculateResto = () =>
    calculateTotal() - calculateAdelanto();

  const goToStep = (n) => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(n);
      setTransitioning(false);
    }, 200);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!selectedTime) { alert('Por favor selecciona un horario.'); return; }
    if (useCustomTime && !customTime) { alert('Por favor ingresa tu horario especial.'); return; }
    if (selectedServices.length === 0) { alert('Por favor selecciona al menos un servicio.'); return; }
    setPaySubStep('confirm');
    goToStep(2);
  };


  //Confirmacion de yape
  const handleYapeConfirmado = async () => {
  const total = calculateTotal();
  const adelanto = calculateAdelanto();
  const resto = calculateResto();

  try {
    await addDoc(collection(db, 'reservas'), {
      uid: user?.uid || null,
      clientEmail: user?.email || null,
      fullName,
      date,
      time: selectedTime,
      hour: useCustomTime ? null : (allTimeSlots.find(s => s.label === time)?.hour ?? null),
      isCustomTime: useCustomTime,
      services: selectedServices.map(s => s.name),
      total,
      adelanto,
      resto,
      status: 'pendiente',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error guardando reserva:', err);
  }

  goToStep(3);
};

  const handleReset = () => {
    setStep(1);
    setPaySubStep('confirm');
    setFullName('');
    setSelectedServices([]);
    setDate('');
    setTime('');
    setUseCustomTime(false);
    setCustomTime('');
    setBloqueo(null);
  };

  const handleMagnet = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
    setMagnet({ x, y });
  };
  const resetMagnet = () => setMagnet({ x: 0, y: 0 });

  const backgroundImage = 'imagen8.png';
  const stepLabels = ['DETALLES', 'PAGO', 'LISTO'];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[400px] flex flex-col justify-end px-margin-mobile md:px-margin-desktop pb-16 md:pb-20 pt-32 overflow-hidden bg-surface-container-low">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10"></div>
          <img alt="Barbershop interior" className="w-full h-full object-cover opacity-50 grayscale" src={backgroundImage} />
        </div>
        <div className="relative z-20 max-w-4xl text-left">
          <h1 className="font-display-xl text-5xl md:text-display-xl uppercase leading-none mb-4 text-primary">
            AGENDA TU CITA
          </h1>
          <p className="font-body-main text-on-background/70 text-base md:text-xl max-w-xl">
            Elige tu servicio, fecha y hora. La precisión de THREASURE espera por ti.
          </p>
        </div>
        <div className="absolute -bottom-10 -right-20 font-display-xl text-[180px] md:text-[400px] text-primary/[0.03] select-none pointer-events-none leading-none">
          THREASURE
        </div>
      </section>

      {/* ── STEPPER VISUAL ── */}
      <div className="bg-background px-margin-mobile md:px-margin-desktop pt-10">
        <div className="max-w-6xl mx-auto flex items-center">
          {[1, 2, 3].map((n, i) => (
            <React.Fragment key={n}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-nav-label text-[11px] transition-all duration-300 ${
                  step > n ? 'bg-primary text-on-primary'
                  : step === n ? 'border-2 border-primary text-primary'
                  : 'border border-outline/20 text-on-background/30'
                }`}>
                  {step > n ? '✓' : n}
                </div>
                <span className={`font-nav-label text-[10px] uppercase tracking-widest hidden sm:inline transition-colors ${
                  step >= n ? 'text-primary' : 'text-on-background/30'
                }`}>
                  {stepLabels[i]}
                </span>
              </div>
              {n < 3 && (
                <div className="flex-1 h-px mx-3 md:mx-6 bg-outline/10 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                    style={{ width: step > n ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Contenedor con transición */}
      <div className={`transition-all duration-200 ${transitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>

        {/* ── LOGIN REQUERIDO ANTES DE RESERVAR ── */}
        {step === 1 && !user && (
          <section className="bg-background text-on-background py-20 px-margin-mobile md:px-margin-desktop">
            <div className="max-w-md mx-auto text-center flex flex-col items-center gap-6">
              <h2 className="font-headline-md text-headline-md text-primary">
                Inicia sesión para agendar
              </h2>
              <p className="font-body-main text-on-background/60">
                Usa tu cuenta de Google para reservar tu cita y poder ver el estado
                de tu confirmación de pago más adelante.
              </p>
              <GoogleLoginButton />
            </div>
          </section>
        )}

        {/* ── PASO 1: FORMULARIO ── */}
        {step === 1 && user && (
          <section className="bg-background text-on-background py-16 md:py-20 px-margin-mobile md:px-margin-desktop relative">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">

              {/* Resumen sticky */}
              <div className="lg:col-span-4 order-2 lg:order-1">
                <div className="lg:sticky lg:top-28 space-y-8">
                  <div className="border-l-4 border-primary pl-6 md:pl-8">
                    <span className="font-nav-label text-nav-label tracking-widest uppercase text-on-background/40 block mb-2">
                      Paso 01 / 03
                    </span>
                    <h2 className="font-display-lg text-3xl md:text-headline-md uppercase text-primary leading-tight">
                      DETALLES DE LA SESIÓN
                    </h2>
                  </div>

                  <div className="bg-surface-container-low p-6 space-y-3">
                    <p className="font-nav-label text-[10px] uppercase tracking-widest text-on-background/30 mb-2">TU RESERVA</p>
                    <div className={`flex justify-between font-body-main text-sm transition-opacity ${fullName ? 'opacity-100' : 'opacity-30'}`}>
                      <span className="text-on-background/60">Nombre</span>
                      <span className="text-primary font-bold truncate max-w-[140px]">{fullName || '—'}</span>
                    </div>
                    <div className={`flex justify-between font-body-main text-sm transition-opacity ${selectedServices.length ? 'opacity-100' : 'opacity-30'}`}>
                      <span className="text-on-background/60">Servicios</span>
                      <span className="text-primary font-bold">{selectedServices.length || '—'}</span>
                    </div>
                    <div className={`flex justify-between font-body-main text-sm transition-opacity ${date ? 'opacity-100' : 'opacity-30'}`}>
                      <span className="text-on-background/60">Fecha</span>
                      <span className="text-primary font-bold">{date || '—'}</span>
                    </div>
                    <div className={`flex justify-between font-body-main text-sm transition-opacity ${selectedTime ? 'opacity-100' : 'opacity-30'}`}>
                      <span className="text-on-background/60">Hora</span>
                      <span className="text-primary font-bold">{selectedTime || '—'}</span>
                    </div>
                    <div className="border-t border-outline/10 pt-3 mt-3">
                      <div className="flex justify-between font-display-lg text-2xl text-primary">
                        <span className="font-nav-label text-xs uppercase tracking-widest self-center">Total</span>
                        <span key={calculateTotal()} className="animate-in fade-in duration-300">
                          S/. {calculateTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="font-body-small text-primary font-bold uppercase tracking-tighter text-xs leading-normal">
                    SE REQUIERE EL 50% DE ADELANTO POR YAPE PARA CONFIRMAR TU CITA.
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <div className="lg:col-span-8 order-1 lg:order-2">
                <form className="space-y-12" onSubmit={handleFormSubmit}>

                  {/* Nombre */}
                  <div className="group">
                    <label className="block font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-4 transition-colors group-focus-within:text-primary">
                      NOMBRE COMPLETO
                    </label>
                    <input
                      className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline/20 focus:border-primary focus:ring-0 px-0 py-4 font-body-main text-lg placeholder:text-on-background/20 transition-all text-primary"
                      placeholder="ESCRIBE TU NOMBRE..."
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  {/* Servicios */}
                  <div>
                    <label className="block font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-8">
                      SELECCIONA SERVICIOS
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.map(service => {
                        const isSelected = selectedServices.some(s => s.name === service.name);
                        return (
                          <label
                            key={service.id}
                            className={`relative flex items-center justify-between p-6 border cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                              isSelected
                                ? 'border-primary bg-primary text-on-primary'
                                : 'border-outline/10 hover:border-primary text-on-background'
                            }`}
                          >
                            <span className="font-headline-md text-xl uppercase leading-tight">{service.name}</span>
                            <span className="flex items-center gap-3 flex-shrink-0 ml-3">
                              <span className={`font-nav-label text-sm ${isSelected ? 'opacity-80' : 'opacity-60'}`}>
                                S/. {service.price}
                              </span>
                              <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-all ${
                                isSelected ? 'bg-on-primary border-on-primary text-primary scale-100' : 'border-current opacity-30 scale-90'
                              }`}>
                                {isSelected ? '✓' : ''}
                              </span>
                            </span>
                            <input className="hidden" type="checkbox" checked={isSelected}
                              onChange={() => handleServiceChange(service.name, service.price)} />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fecha y Hora */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                      <label className="block font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-4">
                        FECHA
                      </label>
                      <input
                        className="w-full bg-surface-container-low text-primary border-outline/10 px-6 py-4 font-nav-label tracking-widest text-sm focus:ring-2 focus:ring-primary/20 transition-shadow"
                        required
                        type="date"
                        min={today}
                        value={date}
                        onChange={handleDateChange}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40">
                          HORARIO
                        </label>
                        <button
                          type="button"
                          onClick={handleToggleCustomTime}
                          className={`font-nav-label text-[10px] uppercase tracking-widest px-3 py-1 border transition-all active:scale-95 ${
                            useCustomTime
                              ? 'border-primary bg-primary text-on-primary'
                              : 'border-outline/20 text-on-background/40 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {useCustomTime ? '✕ CANCELAR' : '+ HORARIO ESPECIAL'}
                        </button>
                      </div>

                      {!useCustomTime && (
                        <>
                          {loadingBloqueo ? (
                            <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/30 py-4 flex items-center gap-2">
                              <span className="inline-block w-3 h-3 border-2 border-on-background/30 border-t-primary rounded-full animate-spin"></span>
                              Verificando disponibilidad...
                            </p>
                          ) : bloqueo?.allDay ? (
                            <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/30 py-4">
                              No hay atención este día. Por favor elige otra fecha.
                            </p>
                          ) : availableSlots.length === 0 ? (
                            <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/30 py-4">
                              No hay horarios disponibles. Selecciona otra fecha o usa horario especial.
                            </p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {availableSlots.map(slot => (
                                <label key={slot.label} className="cursor-pointer">
                                  <input
                                    className="peer hidden"
                                    name="time"
                                    type="radio"
                                    value={slot.label}
                                    checked={time === slot.label}
                                    onChange={() => handleSlotSelect(slot.label)}
                                  />
                                  <div className={`text-center py-3 border font-nav-label text-[11px] transition-all duration-200 active:scale-95 ${
                                    time === slot.label
                                      ? 'bg-primary border-primary text-on-primary scale-[1.03]'
                                      : 'border-outline/10 text-on-background/60 hover:border-primary'
                                  }`}>
                                    {slot.label}
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {useCustomTime && (
                        <div className="space-y-3">
                          <input
                            type="time"
                            className="w-full bg-surface-container-low text-primary border border-primary/40 px-6 py-4 font-nav-label tracking-widest text-sm focus:ring-2 focus:ring-primary/20"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            required
                          />
                          <p className="font-nav-label text-[10px] uppercase tracking-widest text-primary/60">
                            + S/. {RECARGO_ESPECIAL} por horario especial
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-12 border-t border-outline/10">
                    <button
                      onMouseMove={handleMagnet}
                      onMouseLeave={resetMagnet}
                      style={{ transform: `translate(${magnet.x}px, ${magnet.y}px)`, transition: 'transform 0.15s ease-out' }}
                      className="w-full md:w-auto bg-primary text-on-primary px-12 py-6 font-nav-label text-nav-label uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 flex items-center justify-center gap-4 shadow-md"
                      type="submit"
                    >
                      SIGUIENTE: PAGAR ADELANTO
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* ── PASO 2: PAGO ── */}
        {step === 2 && (
          <section className="bg-background text-on-background py-16 md:py-20 px-margin-mobile md:px-margin-desktop">
            <div className="max-w-2xl mx-auto text-left">
              <div className="flex items-center gap-3 mb-12">
                <button
                  onClick={() => paySubStep === 'qr' ? setPaySubStep('confirm') : goToStep(1)}
                  className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  VOLVER
                </button>
                <span className="text-on-background/20">|</span>
                <span className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40">
                  Paso 02 / 03
                </span>
              </div>

              {/* SUBPASO: CONFIRMAR MONTO */}
              {paySubStep === 'confirm' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="border-l-4 border-primary pl-6 md:pl-8 mb-12">
                    <h2 className="font-display-lg text-3xl md:text-headline-md uppercase text-primary leading-tight">
                      CONFIRMA TU PAGO
                    </h2>
                    <p className="font-body-small text-on-background/60 mt-2">
                      Este es el adelanto del 50% que debes yapear para reservar tu cita.
                    </p>
                  </div>

                  <div className="bg-surface-container-low p-8 mb-8 space-y-3">
                    <div className="flex justify-between font-body-main text-sm text-on-background/70">
                      <span>Cliente</span>
                      <span className="text-primary font-bold">{fullName}</span>
                    </div>
                    <div className="flex justify-between font-body-main text-sm text-on-background/70">
                      <span>Fecha y hora</span>
                      <span className="text-primary font-bold">{date} — {selectedTime}</span>
                    </div>
                    <div className="flex justify-between font-body-main text-sm text-on-background/70">
                      <span>Servicios</span>
                      <span className="text-primary font-bold text-right max-w-[60%]">
                        {selectedServices.map(s => s.name).join(', ')}
                      </span>
                    </div>
                    <div className="border-t border-outline/10 pt-4 mt-4 space-y-1">
                      <div className="flex justify-between font-body-main text-sm text-on-background/70">
                        <span>Total</span>
                        <span>S/. {calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-body-main text-sm text-on-background/50">
                        <span>Resto al llegar</span>
                        <span>S/. {calculateResto().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-10 mb-8 border border-primary/30 relative overflow-hidden">
                    <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-2">
                      MONTO A YAPEAR
                    </p>
                    <p className="font-display-lg text-6xl text-primary animate-in zoom-in duration-500">
                      S/. {calculateAdelanto()}
                    </p>
                  </div>

                  <button
                    onClick={() => setPaySubStep('qr')}
                    className="w-full bg-primary text-on-primary px-10 py-6 font-nav-label text-nav-label uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 flex items-center justify-center gap-4 shadow-md transition-all"
                  >
                    CONTINUAR
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              )}

              {/* SUBPASO: QR */}
              {paySubStep === 'qr' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="border-l-4 border-primary pl-6 md:pl-8 mb-12">
                    <h2 className="font-display-lg text-3xl md:text-headline-md uppercase text-primary leading-tight">
                      ESCANEA Y YAPEA
                    </h2>
                    <p className="font-body-small text-on-background/60 mt-2">
                      Abre tu app de Yape, escanea el código y escribe el monto exacto.
                    </p>
                  </div>

                  <div className="bg-surface-container-low p-8 mb-8 flex flex-col items-center">
                    <div className="relative">
                      <img
                        src="/qr-yape.jpeg"
                        alt="QR de pago Yape Threasure Barber"
                        className="w-64 h-64 object-contain bg-white p-2 mb-6"
                      />
                      <div className="absolute inset-0 mb-6 border-2 border-primary/30 animate-pulse pointer-events-none"></div>
                    </div>
                    <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-1">
                      MONTO A INGRESAR EN YAPE
                    </p>
                    <p className="font-display-lg text-5xl text-primary mb-2">
                      S/. {calculateAdelanto()}
                    </p>
                    <p className="font-body-small text-xs text-on-background/40">
                      Rogger Vega — Threasure Barber
                    </p>
                  </div>

                  <div className="border border-primary/30 p-6 mb-8">
                    <ol className="space-y-3 font-body-main text-on-background/80 text-sm">
                      <li className="flex gap-4">
                        <span className="font-bold text-primary text-lg leading-none">01</span>
                        <span>Abre Yape y escanea el QR de arriba.</span>
                      </li>
                      <li className="flex gap-4">
                        <span className="font-bold text-primary text-lg leading-none">02</span>
                        <span>Ingresa el monto exacto: <strong className="text-primary">S/. {calculateAdelanto()}</strong></span>
                      </li>
                      <li className="flex gap-4">
                        <span className="font-bold text-primary text-lg leading-none">03</span>
                        <span>Toma captura del comprobante.</span>
                      </li>
                      <li className="flex gap-4">
                        <span className="font-bold text-primary text-lg leading-none">04</span>
                        <span>Adjúntala en WhatsApp al continuar.</span>
                      </li>
                    </ol>
                  </div>

                  <button
                    onClick={handleYapeConfirmado}
                    onMouseMove={handleMagnet}
                    onMouseLeave={resetMagnet}
                    style={{ transform: `translate(${magnet.x}px, ${magnet.y}px)`, transition: 'transform 0.15s ease-out' }}
                    className="w-full bg-primary text-on-primary px-10 py-6 font-nav-label text-nav-label uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 flex items-center justify-center gap-4 shadow-md"
                  >
                    YA YAPÉ — IR A WHATSAPP
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                  <p className="font-nav-label text-[10px] uppercase tracking-widest text-on-background/30 mt-4 text-center">
                    Tu cita se confirma solo cuando recibamos el voucher de Yape.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── PASO 3: CONFIRMACIÓN ── */}
        {step === 3 && (
        <section className="bg-background text-on-background py-16 md:py-20 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-2xl mx-auto text-left animate-in fade-in zoom-in-95 duration-500">
        <div className="border-l-4 border-primary pl-6 md:pl-8 mb-12">
        <span className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 block mb-2">
        Paso 03 / 03
        </span><h2 className="font-display-lg text-3xl md:text-headline-md uppercase text-primary leading-tight">
          ¡YA CASI!
        </h2>
        <p className="font-body-small text-on-background/60 mt-2 max-w-md">
          Tu reserva está registrada. Solo falta que nos envíes la captura de tu Yape para confirmarla.
        </p>
      </div>

      <div className="bg-surface-container-low p-8 mb-8 space-y-3 font-body-small text-sm text-on-background/60">
        <p className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px]">✓</span>
          Reserva registrada
        </p>
        <p className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px]">✓</span>
          Pago realizado
        </p>
        <p className="text-primary font-bold flex items-center gap-2">
          <span className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center text-[10px] animate-pulse">!</span>
          Envía la captura de tu Yape por WhatsApp para confirmar
        </p>
      </div>

      {/* Botón de WhatsApp para mandar la captura */}
      
        <a href="https://wa.me/51930561385"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white px-10 py-5 font-nav-label text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all mb-6"
      >
        <span className="material-symbols-outlined text-sm">chat</span>
        ENVIAR CAPTURA POR WHATSAPP
      </a>

      <button
        onClick={handleReset}
        className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 hover:text-primary transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">refresh</span>
        HACER OTRA RESERVA
      </button>
    </div>
  </section>
)}
      </div>

      {/* ── UBICACIÓN ── */}
<section className="bg-surface-container-low px-margin-mobile md:px-margin-desktop py-16">
  <div className="max-w-6xl mx-auto">
    <div className="border-l-4 border-primary pl-6 mb-10">
      <p className="font-nav-label text-[10px] uppercase tracking-widest text-on-background/40 mb-1">
        ENCUÉNTRANOS
      </p>
      <h2 className="font-display-lg text-2xl uppercase text-primary leading-tight">
        THREASURE BARBER · ILO
      </h2>
    </div>

    <div className="flex flex-col md:flex-row gap-4">
      {/* Tarjeta ubicación */}
      <div className="flex-1 border border-outline/10 p-8 space-y-4">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
          <div>
            <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-1">DIRECCIÓN</p>
            <p className="font-body-main text-on-background/80 text-sm">Ilo, Moquegua, Perú</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-primary mt-0.5">schedule</span>
          <div>
            <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-1">HORARIO</p>
            <p className="font-body-main text-on-background/80 text-sm">Lun – Sáb · 8:00 a.m. – 6:00 p.m.</p>
            <p className="font-body-main text-on-background/40 text-xs mt-0.5">Domingos cerrado</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-primary mt-0.5">phone</span>
          <div>
            <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-1">WHATSAPP</p>
            <p className="font-body-main text-on-background/80 text-sm">930 561 385</p>
          </div>
        </div>
      </div>

      {/* Botón de redirección a Google Maps */}
      <a 
        href="https://maps.app.goo.gl/ktXvkpzw3TMJeQyC7" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex-1 min-h-[200px] bg-background border border-primary/30 flex flex-col items-center justify-center gap-4 hover:bg-primary hover:border-primary group transition-all duration-300 p-8 text-center active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-5xl text-primary group-hover:text-on-primary transition-colors">
          map
        </span>
        <div>
          <p className="font-nav-label text-[11px] uppercase tracking-widest text-primary group-hover:text-on-primary transition-colors">
            ABRIR EN GOOGLE MAPS
          </p>
          <p className="font-body-small text-xs text-on-background/40 group-hover:text-on-primary/70 transition-colors mt-1">
            Toca para ver la ruta
          </p>
        </div>
        <span className="material-symbols-outlined text-sm text-primary/40 group-hover:text-on-primary/60 transition-colors">
          arrow_forward
        </span>
      </a>
    </div>
  </div>
</section>

      {/* ── BOTÓN INSTALAR APP ── */}
      <InstallAppButton />

      <div className="h-32 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-surface-container-low diagonal-up z-10"></div>
      </div>
    </div>
  );
}

// ── Componente de instalación PWA ──
function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Capturar el evento beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('✅ beforeinstallprompt capturado — botón habilitado');
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detectar cuando se instala
    const installedHandler = () => {
      console.log('✅ App instalada');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Usuario eligió:', outcome);
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error('Error en prompt:', err);
      }
    } else {
      alert(
        'La opción de instalación no está disponible todavía.\n\n' +
        'Posibles causas:\n' +
        '• El Service Worker aún no terminó de activarse (espera unos segundos y recarga).\n' +
        '• El manifest no se cargó correctamente (revisa DevTools → Application → Manifest).\n' +
        '• En Chrome Desktop, puedes usar el menú ⋮ → "Instalar Threasure Barber".'
      );
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <section className="bg-background px-margin-mobile md:px-margin-desktop py-12 border-t border-outline/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-1">
              DISPONIBLE COMO APP
            </p>
            <p className="font-body-main text-on-background/70 text-sm">
              Instala Threasure Barber en tu celular para agendar más rápido
            </p>
          </div>
          <button
            onClick={handleInstall}
            className="flex items-center gap-3 border border-primary text-primary px-8 py-4 font-nav-label text-[11px] uppercase tracking-widest hover:bg-primary hover:text-on-primary active:scale-95 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            AGREGAR A PANTALLA DE INICIO
          </button>
        </div>
      </section>

      {/* Modal instrucciones iOS */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="bg-background border border-outline/20 p-8 w-full max-w-sm animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="font-nav-label text-[11px] uppercase tracking-widest text-primary">
                INSTALAR EN IPHONE
              </p>
              <button
                onClick={() => setShowIOSModal(false)}
                className="font-nav-label text-[10px] text-on-background/30 hover:text-primary transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-nav-label text-[10px] flex-shrink-0">
                  1
                </span>
                <p className="font-body-main text-sm text-on-background/70 leading-relaxed">
                  Abre esta página en <strong className="text-primary">Safari</strong> (no Chrome)
                </p>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-nav-label text-[10px] flex-shrink-0">
                  2
                </span>
                <p className="font-body-main text-sm text-on-background/70 leading-relaxed flex items-center gap-2 flex-wrap">
                  Toca el botón
                  <span className="inline-flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded">
                    <span className="material-symbols-outlined text-[14px] text-primary">ios_share</span>
                    <span className="font-nav-label text-[10px] text-primary">Compartir</span>
                  </span>
                  abajo en Safari
                </p>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-nav-label text-[10px] flex-shrink-0">
                  3
                </span>
                <p className="font-body-main text-sm text-on-background/70 leading-relaxed">
                  Selecciona{' '}
                  <strong className="text-primary">"Añadir a pantalla de inicio"</strong>
                  {' '}y toca <strong className="text-primary">"Añadir"</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <div className="flex flex-col items-center gap-1 animate-bounce">
                <span className="font-nav-label text-[9px] uppercase tracking-widest text-on-background/30">
                  botón compartir abajo
                </span>
                <span className="material-symbols-outlined text-primary">arrow_downward</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}