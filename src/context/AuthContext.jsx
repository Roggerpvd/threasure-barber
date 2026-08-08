import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // El admin se reconoce por el claim "admin: true" del token, que
      // solo trae la sesión creada vía /api/admin-login (custom token).
      // Un login normal de Google nunca tiene ese claim.
      if (firebaseUser) {
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult();
          setIsAdmin(idTokenResult.claims.admin === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      setLoadingAuth(false);
    });
    return unsub;
  }, []);

  // Login de clientes: Google, con popup (no saca al usuario de la página)
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  // Login de admin: usuario y contraseña propios, guardados en Firestore
  // (colección "admins", contraseña con hash bcrypt). Se validan en el
  // backend (/api/admin-login) y, si son correctos, ese backend entrega un
  // "custom token" de Firebase con el claim admin: true, con el que se
  // inicia sesión aquí.
  const loginAdmin = async (username, password) => {
    const cleanUsername = (username || '').trim().toLowerCase();

    const resp = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      throw new Error(data.error || 'Usuario o contraseña incorrectos.');
    }

    const result = await signInWithCustomToken(auth, data.token);
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
