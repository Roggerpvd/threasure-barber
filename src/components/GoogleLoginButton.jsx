import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function GoogleLoginButton({ onSuccess, label = 'Continuar con Google' }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (onSuccess) onSuccess(user);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('No se pudo iniciar sesión. Intenta de nuevo.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center justify-center gap-3 border border-outline/20 bg-surface text-on-surface px-6 py-3 font-nav-label text-nav-label tracking-wide hover:bg-outline/5 active:scale-95 transition disabled:opacity-50 w-full max-w-xs"
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20.5H24v7h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.6 29.6 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.9-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l5.7 4.2C13.6 15.1 18.4 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.6 29.6 3.5 24 3.5c-7.4 0-13.8 4.2-17 10.3z" />
          <path fill="#4CAF50" d="M24 44.5c5.5 0 10.4-2 14-5.4l-6.5-5.4c-2 1.4-4.6 2.3-7.5 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.9 40.1 16.4 44.5 24 44.5z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20.5H24v7h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.4C41.5 35.4 44.5 30.2 44.5 24c0-1.2-.1-2.4-.9-3.5z" />
        </svg>
        {loading ? 'Ingresando...' : label}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
