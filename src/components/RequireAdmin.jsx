import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function RequireAdmin({ children }) {
  const { user, loadingAuth, isAdmin, loginAdmin, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(email, password);
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    setLoading(false);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-on-background/60">Cargando...</p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div>
        <div className="flex justify-end px-6 pt-4">
          <button
            onClick={logout}
            className="text-sm text-on-background/60 hover:text-on-background underline"
          >
            Cerrar sesión ({user.email})
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Sin permisos de admin: siempre se muestra el formulario de correo y
  // contraseña privados, aunque ya haya una sesión de Google activa
  // (p.ej. porque se usó la app como cliente). Al enviar el formulario,
  // la sesión de Google se reemplaza automáticamente por la de admin.
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm bg-surface border border-outline/10 p-8 flex flex-col gap-4 ${shake ? 'animate-shake' : ''}`}
      >
        <h1 className="font-headline-md text-headline-md text-on-surface text-center mb-2">
          Acceso Administrador
        </h1>

        {user && (
          <p className="text-xs text-on-background/50 text-center -mt-2 mb-1">
            Conectado como {user.email}. Ingresa tus credenciales de admin para continuar.
          </p>
        )}

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-outline/20 px-4 py-3 bg-background text-on-background"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-outline/20 px-4 py-3 bg-background text-on-background"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-on-primary py-3 font-nav-label uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
