import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';

// Dominio interno "falso" que se usa solo para poder crear el usuario admin
// en Firebase Authentication (Firebase exige formato de correo). Nunca se
// envían correos a este dominio, es solo un identificador interno.
const ADMIN_EMAIL_DOMAIN = 'admin.local';

// Lista de usuarios (sin @) autorizados como administrador.
// Se define en Vercel como variable de entorno VITE_ADMIN_USERNAMES
// separando varios usuarios con coma, ej: "rogger,otroadmin"
const ADMIN_USERNAMES = (import.meta.env.VITE_ADMIN_USERNAMES || '')
  .split(',')
  .map(u => u.trim().toLowerCase())
  .filter(Boolean);

// Convierte "rogger" -> "rogger@admin.local" para poder usarlo con
// signInWithEmailAndPassword, que exige formato de correo.
const toAdminEmail = (username) =>
  `${username.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;

// Dado el correo interno del usuario logeado, devuelve el nombre de usuario
// (sin el dominio falso) para mostrarlo en pantalla, ej: "rogger".
const usernameFromEmail = (email) => (email || '').split('@')[0];

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

  // El admin solo cuenta como tal si inició sesión con usuario/contraseña
  // (nunca con Google) usando el dominio interno @admin.local, y ese usuario
  // está en la lista autorizada. Así el panel /admin nunca se abre con una
  // cuenta de Google de un cliente, sin importar cuál sea su correo.
  const signedInWithPassword =
    !!user && user.providerData.some(p => p.providerId === 'password');
  const isAdmin =
    !!user &&
    signedInWithPassword &&
    (user.email || '').toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`) &&
    ADMIN_USERNAMES.includes(usernameFromEmail(user.email));

  // Nombre de usuario admin para mostrar en pantalla (ej. "rogger")
  const adminUsername = isAdmin ? usernameFromEmail(user.email) : null;

  // Login de clientes: Google, con popup (no saca al usuario de la página)
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  // Login de admin: usuario y contraseña privados (ej. rogger / rogger123),
  // creados por ti en Firebase Auth como rogger@admin.local
  const loginAdmin = async (username, password) => {
    const email = toAdminEmail(username);
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (!ADMIN_USERNAMES.includes(usernameFromEmail(result.user.email))) {
      await signOut(auth);
      throw new Error('Este usuario no tiene permisos de administrador.');
    }
    return result.user;
  };

  const logout = () => signOut(auth);

  const value = { user, loadingAuth, isAdmin, adminUsername, loginWithGoogle, loginAdmin, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
