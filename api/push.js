// FUNCIÓN 1/2 de Vercel — POST: guarda una suscripción push. DELETE: la borra.
// Verifica el ID token de Firebase Auth para saber quién es (admin o
// cliente) antes de guardar nada; nunca confía en un uid que venga del body.
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, getAdminDb } from '../server/firebaseAdmin.js';
import crypto from 'crypto';

async function resolveIdentity(idToken) {
  const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
  const email = (decoded.email || '').toLowerCase();
  // El admin ya no inicia sesión con correo: se reconoce por el claim
  // admin: true que pone /api/admin-login.js al crear su custom token.
  const role = decoded.admin === true ? 'admin' : 'client';
  return { uid: decoded.uid, email, role };
}

function endpointId(endpoint) {
  return crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 24);
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { idToken, subscription, endpoint } = req.body || {};

  if (!idToken) {
    res.status(401).json({ error: 'Falta idToken' });
    return;
  }

  let identity;
  try {
    identity = await resolveIdentity(idToken);
  } catch (err) {
    res.status(401).json({ error: 'Token inválido', detail: err.message });
    return;
  }

  const db = getAdminDb();

  try {
    if (req.method === 'POST') {
      if (!subscription || !subscription.endpoint) {
        res.status(400).json({ error: 'Falta la suscripción' });
        return;
      }
      const docId =
        identity.role === 'admin' ? `admin_${endpointId(subscription.endpoint)}` : identity.uid;

      await db.collection('pushSubscriptions').doc(docId).set({
        subscription,
        role: identity.role,
        uid: identity.uid,
        email: identity.email,
        updatedAt: new Date().toISOString(),
      });

      res.status(200).json({ ok: true });
      return;
    }

    // DELETE
    const targetEndpoint = endpoint || subscription?.endpoint;
    const docId =
      identity.role === 'admin' && targetEndpoint
        ? `admin_${endpointId(targetEndpoint)}`
        : identity.uid;

    await db.collection('pushSubscriptions').doc(docId).delete();
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error en /api/push:', err);
    res.status(500).json({ error: 'Error interno', detail: err.message });
  }
}
