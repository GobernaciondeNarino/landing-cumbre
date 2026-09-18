# Cumbre IA Nariño — Landing

Landing interactiva de scroll total para la **Cumbre IA Nariño** (Gobernación de Nariño).
Dos escenarios `sticky` de vídeo cuyo tiempo de reproducción está atado al cursor y al
scroll, cinco capítulos superpuestos, widgets flotantes persistentes y sección final de
inscripción.

El personaje y el recorrido no se pintan como vídeo plano: cada escenario entrega su
`<video>` a una escena **three.js** que lo compone sobre un campo de partículas con la
paleta institucional. Si el navegador no tiene WebGL o el sistema pide movimiento
reducido, los mismos `<video>` siguen pintándose y la landing funciona igual.

La versión publicada es la **clara** — fondo blanco, tinta negra. La versión oscura
sigue en el historial y se restaura con un `checkout`: ver **[`RESTAURAR.md`](RESTAURAR.md)**.

> **¿Quieres cambiar textos, enlaces o vídeos?** Todo lo editable está en
> `wj-content/` y la guía completa de administración en **[`wj-admin/GUIA.md`](wj-admin/GUIA.md)**.

## Estructura

```
wj-admin/      Guía de administración (dónde se cambia cada cosa) y VOZ.md.
api/           Endpoint PHP del asistente de voz (sólo para agente privado).
RESTAURAR.md   Cómo volver a la versión oscura.
wj-content/    Contenido editable: wj-textos.ts, wj-capitulos.ts, wj-enlaces.ts
               y uploads/ (vídeos, favicon).
wj-includes/   Código de la aplicación: componentes React, hooks y estilos.
  webgl/       Escena three.js: shaders GLSL, clase de escena y detección de WebGL.
.claude/skills/ Skills de diseño para agentes (ver «Integraciones incluidas»).
dist/          Sitio compilado y versionado — es lo que se sirve en Plesk.
index.html     Punto de entrada (Vite y Apache exigen este nombre exacto).
wj-vite.config.ts  Configuración de Vite (base relativa + publicDir en uploads).
.htaccess      Reescribe todas las peticiones hacia dist/ bajo Apache/Plesk.
```

`package.json`, `tsconfig.json` e `index.html` conservan sus nombres porque npm,
TypeScript, Vite y Apache los buscan exactamente así.

## Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS v4 (`@tailwindcss/vite`) · `motion`
(Framer Motion v12, importado desde `motion/react`) · `three` · `lucide-react`. Sin
librerías de smooth-scroll: el scrub se resuelve con `useScroll`, `useSpring`,
`useTransform`, `useMotionValueEvent` y un bucle `requestAnimationFrame` con easing para
el banner.

three.js va en su propio chunk y el componente que lo usa se carga con `React.lazy`, así
que no entra en el camino crítico del primer pintado.

### La capa WebGL

| Archivo | Papel |
| --- | --- |
| `wj-includes/webgl/shaders.ts` | GLSL del campo de partículas y del plano del personaje. |
| `wj-includes/webgl/CumbreScene.ts` | Escena, materiales, bucle de render y ciclo de vida. Sin React. |
| `wj-includes/webgl/support.ts` | Detección de WebGL, píxel ratio acotado y lectura del tema. |
| `wj-includes/components/WebGLStage.tsx` | Puente React: observadores, punteros y degradación. |

### Dos modos, porque el papel cambia la física

El shader se compila con `WJ_LIGHT` o sin él, y la mezcla cambia con él:

| | Oscuro | Claro (actual) |
| --- | --- | --- |
| Mezcla | Aditiva en color y alfa | «Encima», alfa premultiplicado |
| La figura | Recortada por luminancia | Se pinta opaca, sin recorte |
| El plató | Se va a cero al recortar | Se empuja hacia el blanco del papel |
| El campo | Detrás de la figura | Delante |

El recorte por luminancia sólo funciona en oscuro. Los clips claros llevan a la figura
**blanca sobre plató blanco**: figura y fondo comparten luminancia, y cualquier umbral
le abriría agujeros en la armadura. Por eso en claro el plano se pinta entero y son los
velos del DOM (`.stage-fade`, `.stage-fade-bottom`) los que lo funden con la página.

El modo no se configura a mano: `detectTheme()` lee `--color-abyss` del CSS y decide.

Lo que hace la escena en cada fotograma:

- El `<video>` scrubbeado entra como `VideoTexture`.
- `object-fit: cover` se reproduce en las UV **con punto de interés**: el clip principal
  tiene a la figura a un tercio por la izquierda, así que un móvil en vertical que
  recortara por el centro enseñaría plató vacío. `FOCO_PRINCIPAL` ancla el recorte.
- El puntero comba el plano (lente) y abre una aberración cromática que crece con la
  «energía»: cuánto se mueve el ratón y a qué velocidad va el scroll.
- El campo de partículas avanza con el progreso de scroll y hace paralaje con el
  puntero; los puntos cercanos responden más que los lejanos.
- El aura de marca sustituye a los *blur blobs* de CSS y sigue al puntero. Los mandos
  del **Ambient Glow Studio** (color, tamaño, intensidad) la gobiernan.

Salvaguardas: el bucle sólo corre con el escenario en pantalla y la pestaña visible
(`IntersectionObserver` + `visibilitychange`), el píxel ratio se acota a 2, se libera
todo en el desmontaje y una pérdida de contexto WebGL devuelve el escenario a su
`<video>` sin dejar hueco.

## Mando por inclinación (móvil)

En escritorio el cursor recorre el clip del personaje. En móvil no hay cursor, así que
`useGyroscope` ofrece el giroscopio como sustituto, detrás de un botón (la brújula, junto
al control de sonido). Es una opción y no un automatismo por tres razones:

- iOS 13 y posteriores exigen `DeviceOrientationEvent.requestPermission()` y sólo lo
  conceden desde un gesto del usuario.
- Android sólo emite `deviceorientation` bajo HTTPS. Si no llega ninguna lectura en
  segundo y medio, el botón se retira en lugar de quedarse encendido sin efecto.
- La primera lectura fija el cero: nadie sostiene el teléfono perfectamente plano.

±30° de giro recorren el clip entero. Mientras está encendido, el scroll deja de buscar
fotograma para que los dos mandos no se peleen por el mismo vídeo.

## Asistente de voz

El micrófono flotante abre el asistente y pide conversación con un agente de
**ElevenLabs**: se habla, contesta en audio, y lo hablado y lo escrito van al
mismo hilo. El SDK arrastra `livekit-client`, así que `ChatDrawer` entra por
`React.lazy`: son 169 kB gzip que sólo descarga quien abre el asistente.

**La clave de la API no está en este repositorio y no debe estarlo.** Esta
landing se compila a archivos estáticos: cualquier valor que entre en el bundle
se sirve al público. Hay dos montajes correctos y
**[`wj-admin/VOZ.md`](wj-admin/VOZ.md)** explica los dos paso a paso:

| | Qué se configura | Dónde vive el secreto |
| --- | --- | --- |
| **Agente público** (recomendado) | `AGENTE_VOZ_ID` en `wj-content/wj-voz.ts` | No hay secreto: el ID no autoriza nada |
| **Agente privado** | `ENDPOINT_TOKEN_VOZ` apuntando a `api/voz-token.php` | En el servidor, fuera del document root |

Mientras las dos estén vacías el micrófono avisa de que la voz no está
configurada y el chat escrito sigue respondiendo.

## Accesibilidad del color

Sobre blanco, los acentos de la identidad no llegan al contraste que pide la Resolución
1519 para texto: ember 2,98:1, sky 3,04:1 y amber 1,83:1 frente al 4,5:1 exigido. Los
tokens `--color-ember-ink`, `--color-sky-ink` y `--color-amber-ink` son los mismos tonos
bajados en valor hasta 4,5:1 y se usan **sólo para texto**; en relleno — botones, puntos,
barras — siguen los colores originales de la marca, que es donde se reconoce.

## Desarrollo

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # typecheck + build de producción (regenera dist/)
npm run preview   # sirve dist/
```

## Despliegue en Plesk

Este es un proyecto Vite: **nunca sirvas el código fuente**. Lo que se publica es la
carpeta **`dist/`**, compilada y versionada en este repositorio con rutas relativas
(funciona en `httpdocs` o en cualquier subcarpeta).

Opción A — Desplegar el repo completo (la más simple):

1. Despliega el repositorio entero (Git de Plesk, FTP o File Manager) a `httpdocs`
   **o a cualquier subcarpeta** (p. ej. `httpdocs/cumbre`).
2. Nada más: el `.htaccess` de la raíz reescribe todas las peticiones hacia `dist/`,
   así que `https://tudominio/` o `https://tudominio/cumbre/` sirven el build
   directamente. No se necesita Node.js en el servidor ni cambiar el document root.

Opción B — Document root a `dist`:

1. Despliega el repo y en **Hosting Settings → Document root** apunta a la carpeta
   `dist` del despliegue (p. ej. `httpdocs/dist`).

Opción C — Subida manual solo del build:

1. En tu máquina: `npm install && npm run build`.
2. Sube **el contenido de `dist/`** a `httpdocs` (o a la subcarpeta que quieras) con el
   File Manager o FTP.

Notas:

- No hay rutas de SPA: es una sola página, no se necesitan reglas de rewrite
  adicionales.
- Los MP4 llevan `faststart`; Apache/nginx de Plesk sirven `Range` por defecto, que es
  lo único que el scrub de vídeo necesita.
- Tras cambiar código o contenido, ejecuta `npm run build` y confirma el nuevo `dist/`
  antes de desplegar. Si el cambio no se ve en producción, purga la caché de Cloudflare.

## Integraciones incluidas

- `.claude/skills/apple-design/` — skill [apple-design](https://github.com/dickwu/apple-design-skill)
  (dickwu): revisor de diseño con las 122 páginas de las *Human Interface Guidelines* de
  Apple. Claude Code la carga sola al pedir una revisión de interfaz, o a mano con
  `/apple-design`. Para actualizarla: `npx skills update apple-design`.

## Vídeos

Ambos clips se generaron en Higgsfield (modelo `seedance_2_5`, 1920×1080, 24 fps) y se
recodifican antes de entrar al repositorio:

| Archivo | Duración | Papel |
| --- | --- | --- |
| `cumbre-principal.mp4` | 5,04 s | Personaje principal del banner, scrub con el cursor o la inclinación. |
| `cumbre-secuencia.mp4` | 20,04 s | Recorrido de los 5 capítulos, scrub con el scroll (4 s por capítulo). |

Requisitos de cualquier vídeo que los sustituya: **H.264** (`avc1`) en `yuv420p`, sin
pista de audio, con `faststart` y **GOP corto** — un keyframe cada 6–8 fotogramas. El
GOP es lo que hace que el scrub responda: con keyframes cada dos segundos el
decodificador tiene que reconstruir medio segundo de vídeo en cada seek. H.265/HEVC no
vale: Chrome y Firefox no lo decodifican en MP4.

Y el plató tiene que ser **blanco**, como el de los clips actuales. La versión oscura
pide justo lo contrario; ver [`RESTAURAR.md`](RESTAURAR.md).

```bash
ffmpeg -i origen.mp4 -an -c:v libx264 -preset slow -crf 24 \
  -profile:v high -pix_fmt yuv420p -g 8 -keyint_min 8 -sc_threshold 0 \
  -x264-params "bframes=0" -movflags +faststart destino.mp4
```
