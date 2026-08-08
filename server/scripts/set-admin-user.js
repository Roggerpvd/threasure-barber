// Script para crear o cambiar la contraseña del usuario admin, guardado en
// Firestore (colección "admins") con la contraseña protegida por bcrypt.
// Es lo que usa /api/admin-login.js para dejarte entrar a /admin con un
// usuario y contraseña propios (ya no con correo de Firebase Auth).
//
// CÓMO USARLO:
//   1) Consigue tu clave de cuenta de servicio (si no la tienes aún):
//      Firebase Console → ⚙️ Configuración del proyecto → Cuentas de servicio
//      → "Generar nueva clave privada" → se descarga un archivo .json.
//   2) Guarda ese archivo como service-account.json en la raíz del proyecto
//      (junto a package.json). NUNCA lo subas a git (ya está en .gitignore).
//   3) Corre en la terminal, desde la raíz del proyecto:
//        node server/scripts/set-admin-user.js miusuario "TuContraseñaNueva123"
//   4) Prueba entrar a /admin con ese usuario y esa contraseña.
//
// Requisitos: haber corrido "npm install" (necesita firebase-admin y bcryptjs).
//
// Nota: si tenías un usuario admin antiguo (por correo, con Firebase Auth),
// ya no se usa para /admin — puedes dejarlo o borrarlo desde Firebase
// Console → Authentication, no afecta a este sistema nuevo.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');
const keyPath = path.join(projectRoot, 'service-account.json');

const [, , usernameArg, password] = process.argv;
const username = (usernameArg || '').trim().toLowerCase();

if (!username || !password) {
  console.error('\nUso: node server/scripts/set-admin-user.js miusuario "ContraseñaNueva123"\n');
  process.exit(1);
}

if (password.length < 8) {
  console.error('\nUsa una contraseña de al menos 8 caracteres.\n');
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
const db = getFirestore();

try {
  const passwordHash = await bcrypt.hash(password, 10);
  await db.collection('admins').doc(username).set({
    passwordHash,
    updatedAt: new Date().toISOString(),
  });
  console.log(`\n✔ Listo. Ya puedes entrar a /admin con:\n  usuario: ${username}\n  contraseña: ${password}\n`);
} catch (err) {
  console.error('\nError:', err.message);
  process.exit(1);
}
