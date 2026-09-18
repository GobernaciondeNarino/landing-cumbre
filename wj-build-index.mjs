/**
 * Genera el index.html de la RAÍZ del repositorio a partir del que compila Vite.
 *
 * Por qué hace falta
 * ------------------
 * El index.html de la raíz era la plantilla del servidor de desarrollo: cargaba
 * `main.tsx`, que sólo existe sin compilar. Quien desplegaba el repositorio y
 * abría `/` se encontraba una página en blanco, porque el sitio de verdad
 * estaba en dist/ y nada llevaba hasta allí salvo un .htaccess que nunca
 * llegó a existir.
 *
 * Ahora la plantilla vive en `wj-includes/index.html` y este script escribe en
 * la raíz la página de producción: el mismo HTML que compila Vite, con las
 * rutas de los recursos apuntando a `wj-content/dist/`. Así, abrir la raíz del
 * despliegue carga el sitio entero — escena WebGL, vídeos, asistente — sin
 * depender de ninguna reescritura del servidor.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = dirname(fileURLToPath(import.meta.url));
const CARPETA_BUILD = "wj-content/dist";

const compilado = await readFile(join(raiz, CARPETA_BUILD, "index.html"), "utf8");

// Vite emite rutas relativas («./assets/…», «./favicon.svg»). Desde la raíz
// del repositorio, esas rutas cuelgan de wj-content/dist/.
const reescrito = compilado.replace(
  /(src|href)="\.\/([^"]+)"/g,
  (_, atributo, ruta) => `${atributo}="./${CARPETA_BUILD}/${ruta}"`,
);

const aviso = `<!--
  ARCHIVO GENERADO — no lo edites a mano.

  Lo escribe wj-build-index.mjs en cada \`npm run build\`, a partir de
  ${CARPETA_BUILD}/index.html. Para cambiar el <title>, la descripción o el
  favicon, edita la plantilla en wj-includes/index.html y vuelve a compilar.
-->
`;

await writeFile(join(raiz, "index.html"), aviso + reescrito, "utf8");

const recursos = [...reescrito.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map((m) => m[1]);
console.log(`index.html de la raíz generado · ${recursos.length} recursos:`);
for (const recurso of recursos) console.log(`  ${recurso}`);
