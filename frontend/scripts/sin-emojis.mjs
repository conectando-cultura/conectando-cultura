// Falla (salida 1) si encuentra emojis en el código fuente. Uso: node scripts/sin-emojis.mjs src
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const EXTENSIONES = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.md']);
const EMOJI = /\p{Extended_Pictographic}|\uFE0F/u;
let hallazgos = 0;

function recorrer(ruta) {
  for (const nombre of readdirSync(ruta)) {
    if (nombre === 'node_modules' || nombre.startsWith('.')) continue;
    const completa = join(ruta, nombre);
    if (statSync(completa).isDirectory()) recorrer(completa);
    else if (EXTENSIONES.has(extname(nombre))) {
      readFileSync(completa, 'utf8').split('\n').forEach((linea, i) => {
        if (EMOJI.test(linea)) {
          hallazgos += 1;
          console.error(`${completa}:${i + 1}: ${linea.trim().slice(0, 80)}`);
        }
      });
    }
  }
}

recorrer(process.argv[2] ?? 'src');
if (hallazgos) {
  console.error(`\n${hallazgos} línea(s) con emojis. Usar íconos de lucide-react.`);
  process.exit(1);
}
console.log('Sin emojis.');
