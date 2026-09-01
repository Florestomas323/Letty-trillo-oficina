/* ============================================================
   CONFIGURACIÓN DE LA OFICINA DIGITAL
   ------------------------------------------------------------
   Este es el ÚNICO archivo que cambia de un distribuidor a otro.
   Todo lo demás del sitio es idéntico para todos.

   Para instalar una oficina nueva:
     1. Copia todos los archivos del proyecto.
     2. Edita solo este archivo con los datos del distribuidor.
     3. Reemplaza las fotos propias (hero, retrato, galería).
     4. Sube las reglas a su proyecto de Firebase.

   No hace falta tocar ningún otro archivo de código.
   ============================================================ */

window.OFICINA = {

  /* ---------- Datos del distribuidor ---------- */
  nombre:       "Letty Trillo",
  nombreCorto:  "Letty",
  lema:         "Emprender es crecer y transformar vidas.",
  empresa:      "ALFA SUR-AMÉRICA",
  zona:         "DFW — Texas",

  /* Teléfono en formato internacional, solo dígitos.
     De aquí salen TODOS los enlaces de WhatsApp y de llamada. */
  telefono:     "19726070347",

  /* Dominio propio, sin barra final */
  dominio:      "https://lettytrillo.com",

  /* Correo con el que entra al panel administrativo */
  correoAdmin:  "Letty_trillo@hotmail.com",

  /* Calendario de reservas */
  calendly:     "https://lettytrillo.com/agendar.html",

  /* ---------- Redes sociales (solo el usuario, sin @) ---------- */
  redes: {
    instagram: "letty_trillodiaz",
    tiktok:    "SIN-TIKTOK",
    facebook:  "https://www.facebook.com/share/1PYXHzLX2a/",
    threads:   "letty_trillodiaz"
  },

  /* ---------- Proyecto de Firebase propio ----------
     Cada distribuidor necesita el suyo, para que sus clientes
     y sus datos queden separados de los demás.
     Se copia de: Firebase → Configuración del proyecto → Tus apps */
  firebase: {
    apiKey:            "AIzaSyCimM5FWZG317NKaXiFnTcXFEGA8YfgDrM",
    authDomain:        "letty-trillo-oficina.firebaseapp.com",
    projectId:         "letty-trillo-oficina",
    storageBucket:     "letty-trillo-oficina.firebasestorage.app",
    messagingSenderId: "725008463401",
    appId:             "1:725008463401:web:1ee068534188ba2bbece38"
  }
};

/* ============================================================
   A partir de aquí no hace falta cambiar nada.
   ============================================================ */
(function(){
  var O = window.OFICINA;
  if(!O) return;

  /* El teléfono, siempre en dígitos */
  var tel = String(O.telefono || "").replace(/\D/g, "");
  O.tel = tel;

  /* Formato legible: +1 (972) 607-0347 */
  O.telBonito = (function(){
    if(tel.length === 11 && tel[0] === "1")
      return "+1 (" + tel.slice(1,4) + ") " + tel.slice(4,7) + "-" + tel.slice(7);
    if(tel.length === 10)
      return "+1 (" + tel.slice(0,3) + ") " + tel.slice(3,6) + "-" + tel.slice(6);
    return "+" + tel;
  })();

  /* Enlace de WhatsApp con un mensaje ya escrito */
  O.wa = function(mensaje){
    return "https://wa.me/" + tel + (mensaje ? "?text=" + encodeURIComponent(mensaje) : "");
  };

  /* Deja todos los enlaces del sitio apuntando al distribuidor correcto.
     Se ejecuta en cuanto la página está lista, antes de que nadie toque nada. */
  function aplicar(){
    try{
      document.querySelectorAll('a[href*="wa.me/"]').forEach(function(a){
        a.href = a.href.replace(/wa\.me\/\d+/, "wa.me/" + tel);
      });
      document.querySelectorAll('a[href^="tel:"]').forEach(function(a){
        a.href = "tel:+" + tel;
      });
      if(O.calendly) window.CAL_URL = O.calendly;
    }catch(e){}
  }
  if(document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", aplicar);
  else
    aplicar();
})();
