/* ============================================================
   SERVICE WORKER DEL PANEL — SOLO NOTIFICACIONES
   ------------------------------------------------------------
   A proposito NO guarda nada en cache y NO intercepta peticiones.

   Por que: si cachea, subes un cambio a GitHub, Vercel lo publica
   y el telefono te sigue mostrando la version vieja durante dias.
   Ese problema no lo queremos. Sin listener de 'fetch', el
   navegador va siempre a la red como si el service worker
   no existiera, y este solo se despierta cuando llega un push.
   ============================================================ */

const VERSION = "panel-push-1";

self.addEventListener("install", (e) => {
  // Toma el control sin esperar a que se cierren las pestañas viejas.
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // Por si alguna version anterior llego a dejar caches, se limpian.
    try {
      const nombres = await caches.keys();
      await Promise.all(nombres.map((n) => caches.delete(n)));
    } catch (err) {}
    await self.clients.claim();
  })());
});

/* ---------- Llega una notificacion ---------- */
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {
    d = { title: "Novedad en tu panel", body: e.data ? e.data.text() : "" };
  }

  const titulo = d.title || "Novedad en tu panel";
  const opciones = {
    body: d.body || "",
    icon: "/icono-panel-192.png",
    badge: "/icono-panel-192.png",
    tag: d.tag || "panel",
    renotify: true,
    data: { url: d.url || "/panel.html" }
  };

  e.waitUntil(self.registration.showNotification(titulo, opciones));
});

/* ---------- El usuario toca la notificacion ---------- */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const destino = (e.notification.data && e.notification.data.url) || "/panel.html";

  e.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });
    // Si el panel ya esta abierto, lo trae al frente en vez de duplicarlo.
    for (const c of abiertas) {
      if (c.url.indexOf("/panel.html") >= 0 && "focus" in c) {
        try { await c.navigate(destino); } catch (err) {}
        return c.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(destino);
  })());
});
