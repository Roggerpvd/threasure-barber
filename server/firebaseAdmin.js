// Inicializa Firebase Admin SDK (solo se usa dentro de las funciones
// serverless en /api — nunca se importa desde el código del navegador).
//
// Requiere la variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY en Vercel,
// con el contenido COMPLETO del JSON de la cuenta de servicio (Firebase
// Console → Configuración del proyecto → Cuentas de servicio → Generar
// nueva clave privada), pegado como un solo string.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app;

export function getAdminApp() {
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      'Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY en Vercel.'
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY no es un JSON válido. Debe ser el contenido completo del archivo de la cuenta de servicio.'
    );
  }

  app = initializeApp({
    credential: cert(serviceAccount),
  });
  return app;
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
