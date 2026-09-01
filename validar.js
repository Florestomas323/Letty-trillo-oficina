#!/usr/bin/env node
/* ============================================================
   VALIDAR ANTES DE PUBLICAR
   ------------------------------------------------------------
   Impide publicar una oficina que todavia tenga datos del
   distribuidor maestro o marcadores sin rellenar.

   Se ejecuta:
     - a mano:         node validar.js
     - en cada deploy: Vercel lo lanza como "build" (package.json)
                       y si sale con error, NO publica.

   Lee distribuidor.json para saber quien DEBE aparecer en el
   sitio. Todo lo que pertenezca al maestro y no coincida con
   ese distribuidor es un residuo y bloquea la publicacion.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const CONFIG = path.join(RAIZ, 'distribuidor.json');

// --- Datos del maestro. Si aparecen en una oficina ajena, es un error. ---
const MAESTRO = {
  nombre:   ['Tomas Flores', 'Tomás Flores', 'Tomas', 'Tomás'],
  telefono: ['6823811576', '682) 381-1576', '682 381 1576', '682-381-1576'],
  correo:   ['florestomas323@gmail.com'],
  dominio:  ['tomasflores.com'],
  redes:    ['tomasflores_23', 'titoflores45'],
  empresa:  ['Impact Enterprises', 'Angiemar'],
  firebase: ['oficina-digital-tomas', 'AIzaSyD5EuL7'],
  vapid:    ['BEgTY0Dot5hBxapYRjg5E'],
  logros:   ['Blue Network', 'Royal Lion', 'territorio de Texas', 'New Orleans'],
};

// --- Marcadores que el instalador deja y hay que rellenar a mano ---
const MARCADORES = [
  /TU [A-ZÁÉÍÓÚÑ ]+ AQU[IÍ]/g,
  /NOMBRE APELLIDO/g,
  /sudominio\.com/g,
  /sucorreo@gmail\.com/g,
  /PEGAR-DE-SU-FIREBASE/g,
  /PENDIENTE-CALENDARIO/g,
  /\[DISTRIBUIDOR_[A-Z_]+\]/g,
  /SU EMPRESA|SU ZONA|SU CIUDAD|SU ESTADO/g,
];

const EXT = ['.html', '.js', '.json', '.xml', '.webmanifest', '.txt', '.md'];
const IGNORAR = ['node_modules', '.git', 'validar.js', 'instalador.py', 'INSTALAR.md',
                 'FOTOS.md', 'PROMPT-NUEVA-OFICINA.md', 'firestore-PLANTILLA_rules.txt',
                 'distribuidor.json', 'package.json', 'package-lock.json'];

function archivos(dir, acc = []) {
  for (const n of fs.readdirSync(dir)) {
    if (IGNORAR.includes(n)) continue;
    const p = path.join(dir, n);
    const st = fs.statSync(p);
    if (st.isDirectory()) archivos(p, acc);
    else if (EXT.includes(path.extname(n).toLowerCase())) acc.push(p);
  }
  return acc;
}

function main() {
  const fallos = [];
  const avisos = [];

  if (!fs.existsSync(CONFIG)) {
    console.error('\n✖ Falta distribuidor.json. Sin el no se puede saber de quien es esta oficina.\n');
    process.exit(1);
  }
  const d = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));

  // ¿Esta oficina ES la del maestro? Entonces sus datos son legitimos.
  const esMaestro = (d.dominio || '').toLowerCase() === 'tomasflores.com';

  // 1. El propio distribuidor.json no puede traer marcadores
  const cfgTxt = JSON.stringify(d);
  for (const re of MARCADORES) {
    const m = cfgTxt.match(re);
    if (m) fallos.push(`distribuidor.json: marcador sin rellenar "${m[0]}"`);
  }
  if (!d.nombre || !d.telefono || !d.dominio || !d.correoAdmin) {
    fallos.push('distribuidor.json: faltan nombre, telefono, dominio o correoAdmin');
  }
  if (d.firebase && /^(PEGAR|000000|AIzaSyD5EuL7)/.test(d.firebase.apiKey || '') && !esMaestro) {
    fallos.push('distribuidor.json: la apiKey de Firebase es la del maestro o esta vacia');
  }

  // 2. Recorrer todos los archivos publicables
  const lista = archivos(RAIZ);
  for (const f of lista) {
    const rel = path.relative(RAIZ, f);
    const t = fs.readFileSync(f, 'utf8');

    for (const re of MARCADORES) {
      const m = t.match(re);
      if (m) fallos.push(`${rel}: marcador sin rellenar "${m[0]}" (x${m.length})`);
    }

    if (!esMaestro) {
      for (const [grupo, agujas] of Object.entries(MAESTRO)) {
        for (const a of agujas) {
          const n = t.split(a).length - 1;
          if (n > 0) {
            // Los logros son texto largo; el resto son identificadores exactos
            const nivel = grupo === 'logros' ? avisos : fallos;
            nivel.push(`${rel}: ${grupo} del maestro "${a}" (x${n})`);
          }
        }
      }
    }

    // 3. El sitio debe apuntar al distribuidor declarado
    if (rel.endsWith('.html') && d.telefono) {
      // Solo numeros escritos a mano; los que se arman con una variable no cuentan.
      const literales = [...t.matchAll(/wa\.me\/(\d{7,15})/g)].map((m) => m[1]);
      const ajenos = literales.filter((n) => n !== d.telefono);
      if (ajenos.length) fallos.push(`${rel}: WhatsApp con numero ajeno ${[...new Set(ajenos)].join(', ')}`);
    }
  }

  // 4. El emisor de avisos no puede tener un destinatario fijo ajeno
  const notify = path.join(RAIZ, 'api', 'notify.js');
  if (fs.existsSync(notify)) {
    const t = fs.readFileSync(notify, 'utf8');
    if (/CORREO_AVISOS\s*=\s*['"][^'"]+@/.test(t)) fallos.push('api/notify.js: correo de destino fijo en el codigo');
    if (!esMaestro && t.includes('tomasflores.com')) fallos.push('api/notify.js: dominio del maestro en el codigo');
  }

  // --- Informe ---
  console.log('\n=== VALIDACION DE LA OFICINA ===');
  console.log(`Distribuidor declarado: ${d.nombre} · ${d.dominio}${esMaestro ? ' (maestro)' : ''}`);
  console.log(`Archivos revisados: ${lista.length}\n`);

  if (avisos.length) {
    console.log('AVISOS (revisar, no bloquean):');
    avisos.slice(0, 20).forEach((x) => console.log('  ~ ' + x));
    console.log('');
  }
  if (fallos.length) {
    console.error('✖ BLOQUEADO. Residuos criticos: ' + fallos.length);
    fallos.slice(0, 40).forEach((x) => console.error('  ✖ ' + x));
    if (fallos.length > 40) console.error(`  ... y ${fallos.length - 40} mas`);
    console.error('\nCorrige y vuelve a validar. No se publica hasta que salga limpio.\n');
    process.exit(1);
  }
  console.log('✔ LIMPIO. Esta oficina puede publicarse.\n');
}

main();
