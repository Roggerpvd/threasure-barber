import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppHome() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pt-20 gap-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt="Threasure Barber" className="w-20 h-20 object-contain" />
        <h1 className="font-headline-md text-headline-md text-primary">
          Threasure Barber
        </h1>
        {user && (
          <p className="font-body-small text-on-background/50 text-sm">
            Hola, {user.displayName || user.email}
          </p>
        )}
      </div>

      <div className="w-full max-w-xs flex flex-col gap-4">
        <Link
          to="/reserva"
          className="bg-primary text-on-primary text-center py-5 font-nav-label uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
        >
          Agendar Cita
        </Link>
        <Link
          to="/mis-citas"
          className="border border-outline/20 text-on-background text-center py-5 font-nav-label uppercase tracking-widest hover:bg-outline/5 active:scale-95 transition-all"
        >
          Mis Citas
        </Link>
      </div>
    </div>
  );
}
