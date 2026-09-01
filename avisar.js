/* ============================================================
   AVISAR — enlace entre el formulario y la funcion de avisos
   ------------------------------------------------------------
   Se llama despues de guardar en Firestore. Manda solo la
   coleccion y el id: la funcion del servidor lee el documento
   real, asi nadie puede inventarse un aviso.

   Nunca lanza error ni bloquea nada. Si el aviso falla, el
   visitante no se entera y su registro ya quedo guardado.
   ============================================================ */
window.avisar = function (coleccion, id) {
  try {
    if (!coleccion || !id) return;
    var datos = JSON.stringify({ coleccion: coleccion, id: String(id) });

    // sendBeacon sobrevive aunque la pagina se cierre o salte a WhatsApp.
    if (navigator.sendBeacon) {
      var ok = navigator.sendBeacon('/api/notify', new Blob([datos], { type: 'application/json' }));
      if (ok) return;
    }
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: datos,
      keepalive: true
    }).catch(function () {});
  } catch (e) {}
};
