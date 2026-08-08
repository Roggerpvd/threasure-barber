// Script para crear o resetear la contraseña del usuario admin directamente
// con Firebase Admin SDK — evita depender del correo de "reset password" de
// Firebase (que a veces no llega o cae en spam).
//
// CÓMO USARLO:
//   1) Consigue tu clave de cuenta de servicio (si no la tienes aún):
//      Firebase Console → ⚙️ Configuración del proyecto → Cuentas de servicio
//      → "Generar nueva clave privada" → se descarga un archivo .json.
//   2) Guarda ese archivo como service-account.json en la raíz del proyecto
//      (junto a package.json). NUNCA lo subas a git (ya está en .gitignore).
//   3) Corre en la terminal, desde la raíz del proyecto:
//        node server/scripts/set-admin-password.js correo@gmail.com "TuContraseñaNueva123"
//   4) Prueba entrar a /admin con ese correo y esa contraseña.
//
// Requisitos: haber corrido "npm install" (necesita el paquete firebase-admin).

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');
const keyPath = path.join(projectRoot, 'service-account.json');

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('\nUso: node server/scripts/set-admin-password.js correo@gmail.com "ContraseñaNueva123"\n');
  process.exit(1);
}

if (password.length < 6) {
  console.error('\nLa contraseña debe tener al menos 6 caracteres (lo exige Firebase).\n');
  process.exit(1);
}

if (!existsSync(keyPath)) {
  console.error(
    `\nNo encontré "service-account.json" en la raíz del proyecto (${projectRoot}).\n` +
    'Descárgalo desde Firebase Console → Configuración del proyecto → Cuentas de servicio → ' +
    'Generar nueva clave privada, y guárdalo con ese nombre exacto ahí.\n'
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

try {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`Usuario existente encontrado (uid: ${user.uid}). Actualizando contraseña...`);
    await auth.updateUser(user.uid, { password });
    console.log('✔ Contraseña actualizada correctamente.');
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('No existía ese usuario. Creándolo...');
      user = await auth.createUser({ email, password, emailVerified: true });
      console.log(`✔ Usuario creado correctamente (uid: ${user.uid}).`);
    } else {
      throw err;
    }
  }
  console.log(`\nListo. Ya puedes entrar a /admin con:\n  correo: ${email}\n  contraseña: ${password}\n`);
} catch (err) {
  console.error('\nError:', err.message);
  process.exit(1);
}
