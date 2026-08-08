// FUNCIÓN de Vercel — POST /api/admin-login
//
// Reemplaza el login por correo/Firebase Auth por un login de usuario +
// contraseña propio, guardado en Firestore (colección "admins"), con la
// contraseña protegida por bcrypt (nunca se guarda en texto plano).
//
// Cómo funciona:
//   1) Recibe { username, password } desde el formulario de /admin.
//   2) Busca el documento admins/{username} en Firestore.
//   3) Compara la contraseña con el hash guardado (bcrypt.compare).
//   4) Si coincide, genera un "custom token" de Firebase Auth con el
//      claim admin: true, y se lo devuelve al navegador.
//   5) El navegador usa ese token para iniciar sesión con
//      signInWithCustomToken (ver src/context/AuthContext.jsx). Así el
//      admin queda autenticado en Firebase igual que antes, y todas las
//      reglas de Firestore (firestore.rules) lo reconocen sin cambiar
//      cómo funciona el resto del panel.
//
// No necesitas crear ninguna base de datos nueva ni variable de entorno
// nueva en Vercel: reutiliza FIREBASE_SERVICE_ACCOUNT_KEY, que ya usan
// /api/push.js y /api/cron-check.js.
//
// Para crear o cambiar el usuario admin, usa:
//   node server/scripts/set-admin-user.js tuUsuario "TuContraseñaNueva123"

import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, getAdminDb } from '../server/firebaseAdmin.js';
import bcrypt from 'bcryptjs';

// Pequeño freno anti fuerza-bruta: si en los últimos 15 minutos hubo
// demasiados intentos fallidos para un mismo usuario, se corta antes de
// siquiera consultar Firestore. No es un sistema perfecto (se reinicia si
// la función serverless se "enfría"), pero cubre el caso común de bots
// probando contraseñas seguidas.
const MAX_INTENTOS = 8;
const VENTANA_MS = 15 * 60 * 1000;
const intentosFallidos = new Map();

function demasiadosIntentos(username) {
  const registro = intentosFallidos.get(username);
  if (!registro) return false;
  if (Date.now() - registro.desde > VENTANA_MS) {
    intentosFallidos.delete(username);
    return false;
  }
  return registro.count >= MAX_INTENTOS;
}

function registrarIntentoFallido(username) {
  const registro = intentosFallidos.get(username);
  if (!registro || Date.now() - registro.desde > VENTANA_MS) {
    intentosFallidos.set(username, { count: 1, desde: Date.now() });
  } else {
    registro.count += 1;
  }
}

function limpiarIntentos(username) {
  intentosFallidos.delete(username);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { username, password } = req.body || {};
  const cleanUsername = (username || '').trim().toLowerCase();

  if (!cleanUsername || !password) {
    res.status(400).json({ error: 'Falta usuario o contraseña' });
    return;
  }

  if (demasiadosIntentos(cleanUsername)) {
    res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
    return;
  }

  try {
    const db = getAdminDb();
    const doc = await db.collection('admins').doc(cleanUsername).get();

    if (!doc.exists) {
      registrarIntentoFallido(cleanUsername);
      res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
      return;
    }

    const { passwordHash } = doc.data();
    const coincide = await bcrypt.compare(password, passwordHash || '');

    if (!coincide) {
      registrarIntentoFallido(cleanUsername);
      res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
      return;
    }

    limpiarIntentos(cleanUsername);

    // uid fijo y estable por usuario admin (no es el password, es solo un
    // identificador interno de Firebase Auth).
    const uid = `admin_${cleanUsername}`;
    const token = await getAuth(getAdminApp()).createCustomToken(uid, { admin: true });

    res.status(200).json({ token });
  } catch (err) {
    console.error('Error en /api/admin-login:', err);
    res.status(500).json({ error: 'Error interno', detail: err.message });
  }
}
