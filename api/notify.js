/* ============================================================
   AVISOS DE LA OFICINA DIGITAL
   ------------------------------------------------------------
   Una sola funcion que hace dos cosas cuando entra un registro:
     1. Te manda un correo (siempre que haya RESEND_API_KEY).
     2. Te manda una notificacion al panel instalado (si hay
        claves VAPID y alguna suscripcion guardada).

   Si falta la configuracion de una de las dos, la otra sigue
   funcionando. Nunca devuelve error al visitante.

   POR QUE LEE EL DOCUMENTO EN VEZ DE FIARSE DEL ENVIO
   El navegador solo manda la coleccion y el id. La funcion va a
   Firestore y lee el documento real. Asi nadie puede llamar a
   esta direccion e inventarse un aviso con datos falsos.
   ============================================================ */

const webpush = require('web-push');
const admin = require('firebase-admin');

// --- Colecciones permitidas. Cualquier otra se rechaza. ---
const PERMITIDAS = {
  leads:            { titulo: 'Nuevo prospecto',        origen: 'Trabaja conmigo' },
  appointments:     { titulo: 'Nueva reserva',          origen: 'Agenda' },
  helpRequests:     { titulo: 'Nueva solicitud',        origen: 'Clientes y solicitudes' },
  giftParticipants: { titulo: 'Nuevo participante',     origen: 'Regala y Gana' },
  giftClaims:       { titulo: 'Nuevo participante',     origen: 'Regala y Gana' },
  passportUsers:    { titulo: 'Nuevo en el Pasaporte',  origen: 'Pasaporte de Sabores' },
};

let listo = false;
function iniciarFirebase() {
  if (listo || admin.apps.length) { listo = true; return; }
  const cred = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!cred) throw new Error('Falta FIREBASE_SERVICE_ACCOUNT');
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(cred)) });
  listo = true;
}

function resumen(d) {
  // Arma una linea legible con lo que traiga el documento.
  const partes = [];
  if (d.nombre) partes.push(d.nombre + (d.apellido ? ' ' + d.apellido : ''));
  if (d.name) partes.push(d.name);
  if (d.phone) partes.push(d.phone);
  if (d.ciudad || d.city) partes.push(d.ciudad || d.city);
  if (d.fecha) partes.push(d.fecha + (d.hora ? ' ' + d.hora : ''));
  if (Array.isArray(d.metas) && d.metas.length) partes.push(d.metas.join(', '));
  return partes.filter(Boolean).join(' · ') || 'Sin detalles';
}

async function mandarCorreo(info, texto) {
  const key = process.env.RESEND_API_KEY;
  const para = process.env.CORREO_AVISOS;
  if (!key || !para) return 'sin configurar';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Oficina Digital <onboarding@resend.dev>',
      to: [para],
      subject: info.titulo + ' — ' + info.origen,
      text: info.titulo + '\n' + info.origen + '\n\n' + texto +
            '\n\nAbrir el panel: https://lettytrillo.com/panel.html',
    }),
  });
  return r.ok ? 'enviado' : 'fallo ' + r.status;
}

async function mandarPush(info, texto) {
  const pub = (process.env.VAPID_PUBLICA || '').trim();
  const priv = (process.env.VAPID_PRIVADA || '').trim();
  if (!pub || !priv) return 'sin configurar';
  try {
    webpush.setVapidDetails('mailto:' + (process.env.CORREO_AVISOS || 'admin@lettytrillo.com').trim(), pub, priv);
  } catch (e) {
    return 'claves VAPID invalidas: ' + e.message;
  }

  const db = admin.firestore();
  const subs = await db.collection('pushSubs').get();
  if (subs.empty) return 'sin dispositivos';

  let ok = 0, muertas = 0; const fallos = [];
  await Promise.all(subs.docs.map(async (doc) => {
    const s = doc.data();
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: info.titulo, body: texto, url: '/panel.html', tag: info.origen })
      );
      ok++;
    } catch (e) {
      // 404 y 410 significan que el dispositivo ya no existe: se limpia sola.
      if (e.statusCode === 404 || e.statusCode === 410) {
        await doc.ref.delete().catch(() => {});
        muertas++;
      } else {
        fallos.push((e.statusCode || '?') + ' ' + String(e.body || e.message).slice(0, 90));
      }
    }
  }));
  return ok + ' enviadas de ' + subs.size +
         (muertas ? ', ' + muertas + ' caducadas borradas' : '') +
         (fallos.length ? ' | fallos: ' + fallos.join(' ; ') : '');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  try {
    const cuerpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { coleccion, id } = cuerpo;
    const info = PERMITIDAS[coleccion];
    if (!info || !id) return res.status(400).json({ ok: false, error: 'peticion invalida' });

    iniciarFirebase();
    const snap = await admin.firestore().collection(coleccion).doc(String(id)).get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: 'no existe' });

    const texto = resumen(snap.data());
    const [correo, push] = await Promise.all([
      mandarCorreo(info, texto).catch((e) => 'error: ' + e.message),
      mandarPush(info, texto).catch((e) => 'error: ' + e.message),
    ]);
    // Queda en los Logs de Vercel: sin esto, un fallo del push es invisible.
    console.log('[aviso]', coleccion, '| correo:', correo, '| push:', push);
    return res.status(200).json({ ok: true, correo, push });
  } catch (e) {
    // Se responde 200 a proposito: un fallo del aviso no debe
    // ensuciar la experiencia de quien acaba de llenar el formulario.
    return res.status(200).json({ ok: false, error: e.message });
  }
};
