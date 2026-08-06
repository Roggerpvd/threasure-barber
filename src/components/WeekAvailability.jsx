import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import {
  ALL_TIME_SLOTS,
  getWeekDates,
  formatDayLabel,
  getTodayPeru,
  getCurrentHourPeru,
  addDays,
} from '../utils/schedule';

/**
 * Cuadrícula semanal de disponibilidad.
 *
 * - Si se le pasa `bloqueosByDate`, la usa directamente (modo admin, que ya
 *   tiene todos los bloqueos cargados).
 * - Si no, la trae ella misma de Firestore para la semana visible (modo cliente).
 *
 * Cada documento de "bloqueos/{fecha}" puede tener:
 *   - allDay: true            -> todo el día no disponible (lo puso el admin)
 *   - horasBloquedas: [hour]  -> esas horas puntuales no disponibles (el admin las cerró)
 *   - horasReservadas: [hour] -> esas horas ya tienen una cita confirmada (cliente)
 *
 * Verde = disponible (se puede reservar).
 * Rojo  = reservado (ya hay una cita confirmada en ese horario).
 * X     = no disponible (lo cerró el admin, o ya pasó / está fuera de rango).
 */
export default function WeekAvailability({
  bloqueosByDate: externalBloqueos,
  anchorDate,
  onAnchorDateChange,
  selectedDate,
  selectedTime,
  onSelectSlot,
  onDayHeaderClick,
  minDate,
}) {
  const today = getTodayPeru();
  const currentHour = getCurrentHourPeru();

  const [internalAnchor, setInternalAnchor] = useState(anchorDate || selectedDate || today);
  const anchor = anchorDate || internalAnchor;
  const setAnchor = onAnchorDateChange || setInternalAnchor;

  const weekDates = getWeekDates(anchor);
  const [fetchedBloqueos, setFetchedBloqueos] = useState({});
  const [loading, setLoading] = useState(false);

  const bloqueosByDate = externalBloqueos || fetchedBloqueos;

  useEffect(() => {
    if (externalBloqueos) return; // el padre ya provee los datos (admin)
    const start = weekDates[0];
    const end = weekDates[6];
    setLoading(true);
    const q = query(
      collection(db, 'bloqueos'),
      where(documentId(), '>=', start),
      where(documentId(), '<=', end)
    );
    getDocs(q)
      .then(snap => {
        const map = {};
        snap.forEach(d => { map[d.id] = d.data(); });
        setFetchedBloqueos(map);
      })
      .catch(err => console.error('Error cargando disponibilidad de la semana:', err))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates[0], weekDates[6], externalBloqueos]);

  // Ya pasó o está fuera del rango permitido para reservar.
  const isPast = (dateStr, hour) => {
    if (dateStr < (minDate || today)) return true;
    if (dateStr === today && hour <= currentHour) return true;
    return false;
  };

  // El admin marcó ese horario (o el día completo) como no disponible.
  const isAdminBlocked = (dateStr, hour) => {
    if (bloqueosByDate[dateStr]?.allDay) return true;
    return !!bloqueosByDate[dateStr]?.horasBloquedas?.includes(hour);
  };

  // Ya existe una cita confirmada en ese horario.
  const isReserved = (dateStr, hour) => {
    return !!bloqueosByDate[dateStr]?.horasReservadas?.includes(hour);
  };

  // "No disponible" (X) = ya pasó, o el admin lo cerró — pero no cuenta si
  // ya está reservado (eso se muestra en rojo, tiene prioridad visual).
  const isUnavailable = (dateStr, hour) =>
    !isReserved(dateStr, hour) && (isPast(dateStr, hour) || isAdminBlocked(dateStr, hour));

  const isTaken = (dateStr, hour) => isReserved(dateStr, hour) || isUnavailable(dateStr, hour);

  const isDayFullyClosed = (dateStr) => {
    if (bloqueosByDate[dateStr]?.allDay) return true;
    return ALL_TIME_SLOTS.every(s => isTaken(dateStr, s.hour));
  };

  return (
    <div className="w-full">
      {/* Navegación de semana + selector de fecha específica */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchor(addDays(anchor, -7))}
            className="w-8 h-8 flex items-center justify-center border border-outline/20 text-on-background/60 hover:border-primary hover:text-primary transition-colors"
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <span className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/60 min-w-[110px] text-center">
            {formatDayLabel(weekDates[0]).dayNum} {formatDayLabel(weekDates[0]).monthName} — {formatDayLabel(weekDates[6]).dayNum} {formatDayLabel(weekDates[6]).monthName}
          </span>
          <button
            type="button"
            onClick={() => setAnchor(addDays(anchor, 7))}
            className="w-8 h-8 flex items-center justify-center border border-outline/20 text-on-background/60 hover:border-primary hover:text-primary transition-colors"
            aria-label="Semana siguiente"
          >
            ›
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchor(today)}
            className="font-nav-label text-[10px] uppercase tracking-widest px-3 py-1.5 border border-outline/20 text-on-background/50 hover:border-primary hover:text-primary transition-colors"
          >
            Hoy
          </button>
          <input
            type="date"
            min={minDate || today}
            value={anchor}
            onChange={(e) => e.target.value && setAnchor(e.target.value)}
            className="bg-surface-container-low border border-outline/10 px-3 py-1.5 font-nav-label text-[11px] text-on-background/70"
          />
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mb-3 text-[10px] font-nav-label uppercase tracking-widest text-on-background/40 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 inline-block bg-green-500/20 border border-green-500/50" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 inline-block bg-red-500/20 border border-red-500/50" />
          Reservado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 inline-flex items-center justify-center border border-outline/30 text-[8px] text-on-background/40">✕</span>
          No disponible
        </span>
      </div>

      {loading && (
        <p className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/30 mb-2">
          Cargando disponibilidad...
        </p>
      )}

      {/* Cuadrícula */}
      <div className="overflow-x-auto border border-outline/10">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-background w-20 border-b border-r border-outline/10"></th>
              {weekDates.map(dateStr => {
                const { dayName, dayNum } = formatDayLabel(dateStr);
                const isToday = dateStr === today;
                const closed = isDayFullyClosed(dateStr);
                return (
                  <th
                    key={dateStr}
                    onClick={() => onDayHeaderClick && onDayHeaderClick(dateStr)}
                    className={`border-b border-outline/10 py-2 px-1 text-center font-nav-label text-[10px] uppercase tracking-widest ${
                      onDayHeaderClick ? 'cursor-pointer hover:bg-surface-container-low' : ''
                    } ${isToday ? 'text-primary' : 'text-on-background/50'} ${closed ? 'opacity-40' : ''} ${
                      selectedDate === dateStr ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div>{dayName}</div>
                    <div className="text-sm">{dayNum}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ALL_TIME_SLOTS.map(slot => (
              <tr key={slot.hour}>
                <td className="sticky left-0 bg-background border-r border-outline/10 px-2 py-2 font-nav-label text-[10px] text-on-background/40 whitespace-nowrap">
                  {slot.label}
                </td>
                {weekDates.map(dateStr => {
                  const reserved = isReserved(dateStr, slot.hour);
                  const unavailable = !reserved && isUnavailable(dateStr, slot.hour);
                  const taken = reserved || unavailable;
                  const isSelected = selectedDate === dateStr && selectedTime === slot.label;
                  const clickable = !taken && !!onSelectSlot;
                  return (
                    <td key={dateStr + slot.hour} className="border border-outline/5 p-0.5">
                      <button
                        type="button"
                        disabled={!clickable}
                        onClick={() => clickable && onSelectSlot(dateStr, slot)}
                        className={`w-full h-10 flex items-center justify-center transition-colors ${
                          reserved
                            ? 'bg-red-500/20 border border-red-500/50 cursor-not-allowed'
                            : unavailable
                              ? 'bg-outline/5 border border-outline/15 cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary border border-primary text-on-primary'
                                : clickable
                                  ? 'bg-green-500/20 border border-green-500/50 hover:border-primary hover:bg-primary/10 cursor-pointer'
                                  : 'bg-green-500/10 border border-green-500/30'
                        }`}
                        aria-label={`${dateStr} ${slot.label}${reserved ? ' — reservado' : unavailable ? ' — no disponible' : ' — disponible'}`}
                      >
                        {reserved && (
                          <span className="text-[7px] font-nav-label uppercase tracking-tight text-red-700 leading-none">
                            Reservado
                          </span>
                        )}
                        {unavailable && (
                          <span className="text-[10px] text-on-background/25 leading-none">✕</span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
