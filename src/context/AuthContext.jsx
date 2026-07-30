import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';

// Lista de correos autorizados como administrador.
// Se define en Vercel como variable de entorno VITE_ADMIN_EMAILS
// separando varios correos con coma, ej: "tucorreo@gmail.com,otro@gmail.com"
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingAuth(false);
    });
    return unsub;
  }, []);

  // El admin solo cuenta como tal si inició sesión con correo/contraseña
  // (nunca con Google), aunque use el mismo correo. Así se garantiza que
  // el panel /admin solo se abra con tu usuario y contraseña privados.
  const signedInWithPassword =
    !!user && user.providerData.some(p => p.providerId === 'password');
  const isAdmin =
    !!user && signedInWithPassword && ADMIN_EMAILS.includes((user.email || '').toLowerCase());

  // Login de clientes: Google, con popup (no saca al usuario de la página)
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  // Login de admin: correo y contraseña privados, creados por ti en Firebase Auth
  const loginAdmin = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (!ADMIN_EMAILS.includes((result.user.email || '').toLowerCase())) {
      await signOut(auth);
      throw new Error('Esta cuenta no tiene permisos de administrador.');
    }
    return result.user;
  };

  const logout = () => signOut(auth);

  const value = { user, loadingAuth, isAdmin, loginWithGoogle, loginAdmin, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
