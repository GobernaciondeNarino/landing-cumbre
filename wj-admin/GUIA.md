# Guía de administración — Cumbre IA Nariño

Todo lo editable del sitio vive en la carpeta **`wj-content/`**. No necesitas tocar
`wj-includes/` (el código de la aplicación) para cambiar textos, enlaces o vídeos.

> El sitio está publicado en su **versión clara** — fondo blanco y letras negras. La
> versión oscura sigue guardada en el historial: para volver a ella, ver
> **[`RESTAURAR.md`](../RESTAURAR.md)**.

## Estructura del proyecto

```
wj-admin/       Esta guía de administración.
  VOZ.md            Asistente de voz: dónde se guarda la clave de ElevenLabs.
api/            Endpoint PHP del asistente de voz (sólo si el agente es privado).
RESTAURAR.md    Cómo volver a la versión oscura.
wj-content/     TODO lo editable: textos, capítulos, enlaces y archivos subidos.
  wj-textos.ts      Textos del banner, cabecera, sección de inscripción y pie.
  wj-capitulos.ts   Los 5 capítulos del recorrido con scroll (títulos, párrafos, CTA).
  wj-enlaces.ts     URL del formulario, rutas de los vídeos y datos de contacto.
  uploads/          Archivos estáticos: vídeos y favicon.
    videos/cumbre-principal.mp4    Vídeo del banner (scrub con el ratón).
    videos/cumbre-secuencia.mp4    Vídeo del recorrido por capítulos (scrub con scroll).
wj-includes/    Código de la aplicación (React): componentes, hooks, estilos.
  webgl/            Escena three.js (shaders y render). No hace falta tocarla.
dist/           El sitio COMPILADO — esto es lo que se sirve en Plesk.
index.html      Punto de entrada (Vite y Apache exigen este nombre exacto).
wj-vite.config.ts  Configuración del compilador.
.htaccess       Reescribe las peticiones hacia dist/ en Apache/Plesk.
```

## Dónde se cambia cada cosa

| Quiero cambiar…                                | Archivo                      | Qué editar |
|------------------------------------------------|------------------------------|------------|
| Título del banner ("CUMBRE DE TECNOLOGÍA E IA") | `wj-content/wj-textos.ts`   | `HERO.tituloLineas` y `HERO.tituloAcento` |
| Párrafo del banner                              | `wj-content/wj-textos.ts`   | `HERO.parrafo` |
| Etiquetas pequeñas del banner                   | `wj-content/wj-textos.ts`   | `HERO.notaSuperior`, `HERO.etiqueta`, `HERO.notaDerecha…` |
| Marca de la cabecera                            | `wj-content/wj-textos.ts`   | `CABECERA` |
| Textos de los 5 capítulos (título, párrafo…)    | `wj-content/wj-capitulos.ts`| `CHAPTERS[n].title`, `.kicker`, `.body`, `.services` |
| Texto del botón "Quiero inscribirme"            | `wj-content/wj-capitulos.ts`| `CHAPTERS[4].ctaTexto` |
| Cifra y nota de asistentes (capítulo Comunidad) | `wj-content/wj-capitulos.ts`| `avataresCifra`, `avataresNota`, `AVATARS` |
| Sección de inscripción (título, datos, botón)   | `wj-content/wj-textos.ts`   | `INSCRIPCION` |
| **Enlace del botón de inscripción**             | `wj-content/wj-enlaces.ts`  | `FORM_URL` — ahora `https://tic.narino.gov.co/eventos/` (vacío = botón deshabilitado) |
| Agente del asistente de voz                     | `wj-content/wj-voz.ts`      | `AGENTE_VOZ_ID` — **la clave de API NO va aquí**, ver `VOZ.md` |
| Textos del asistente (saludo, avisos)           | `wj-content/wj-voz.ts`      | `VOZ` |
| Vídeos (cambiar el archivo)                     | `wj-content/uploads/videos/`| Reemplaza el `.mp4` conservando el nombre |
| Vídeos (usar un CDN externo)                    | `wj-content/wj-enlaces.ts`  | `VIDEO_PRINCIPAL_URL` / `VIDEO_SECUENCIA_URL` |
| Correo y web del pie de página                  | `wj-content/wj-enlaces.ts`  | `CONTACTO` |
| Columnas del pie de página                      | `wj-content/wj-textos.ts`   | `PIE` |
| Colores de la paleta                            | `wj-includes/index.css`     | Bloque `@theme` (tokens `--color-…`) |
| Fondo y color del texto (claro/oscuro)          | `wj-includes/index.css`     | `--color-abyss` y `--color-ink`; ver `RESTAURAR.md` |
| Encuadre del personaje en móvil                 | `wj-includes/components/HeroStage.tsx` | `FOCO_PRINCIPAL` (0 = izquierda, 1 = derecha) |
| Densidad y color del campo de partículas        | `wj-includes/webgl/CumbreScene.ts` | `FIELD_PALETTE` y el `count` de `createField` |
| Título/descripción de la pestaña (SEO)          | `index.html`                | `<title>` y `<meta name="description">` |

## ¿Por qué los vídeos están "duplicados"? (wj-content/uploads y dist/videos)

- `wj-content/uploads/videos/` es la **fuente**: lo que tú editas.
- `dist/videos/` es la **copia compilada**: lo que Plesk sirve al público.

Al ejecutar `npm run build`, Vite borra `dist/` y lo regenera copiando los archivos
de `uploads/` dentro. **Importante:** si reemplazas un vídeo directamente en
`dist/` (como se hizo por GitHub web), el siguiente build lo sobreescribirá con el
de `uploads/`. Cambia siempre el vídeo en `wj-content/uploads/videos/` y luego
compila; el sitio ya está configurado para mantener ambos en sincronía.

## Publicar un cambio

1. Edita los archivos de `wj-content/` (o el vídeo en `uploads/videos/`).
2. En una terminal: `npm install` (solo la primera vez) y `npm run build`.
3. Confirma y sube los cambios (incluida la carpeta `dist/` regenerada):
   `git add -A && git commit -m "..." && git push`.
4. En Plesk: **Git → Pull/Deploy** del repositorio. Si el cambio no se ve,
   purga la caché de Cloudflare.

> Si no puedes ejecutar `npm run build` (cambio de emergencia), puedes editar un
> vídeo directamente en `dist/videos/` — pero replica el cambio en
> `wj-content/uploads/videos/` cuanto antes para que no se pierda en el próximo build.

## Requisitos de los vídeos

Los dos vídeos tienen que cumplir lo mismo:

- **Plató blanco.** Los clips actuales están rodados sobre fondo blanco porque el sitio
  es claro. Un clip rodado sobre negro se vería aquí como un rectángulo oscuro sobre el
  papel — si vas a cambiar el fondo del sitio, cambia los dos a la vez.
- **MP4 H.264** (`avc1`) en `yuv420p`, **sin pista de audio**.
- `faststart`: el átomo `moov` al principio del archivo.
- **GOP corto**: un fotograma clave cada 6–8. Es lo que hace que el scrub responda al
  instante; con keyframes cada dos segundos cada movimiento del ratón obliga al
  navegador a reconstruir medio segundo de vídeo.
- **Nada de H.265/HEVC.** Chrome y Firefox no lo decodifican dentro de un MP4: el
  escenario se quedaría en negro para la mayoría de visitantes.

Comando de conversión (sirve para cualquier origen, incluidos los clips de Higgsfield,
que salen en HEVC 10 bits):

```bash
ffmpeg -i origen.mp4 -an -c:v libx264 -preset slow -crf 24 \
  -profile:v high -pix_fmt yuv420p -g 8 -keyint_min 8 -sc_threshold 0 \
  -x264-params "bframes=0" -movflags +faststart cumbre-secuencia.mp4
```

Sobre la duración: el vídeo de secuencia se reparte en partes iguales entre los 5
capítulos — con 20 s, cada capítulo ocupa un tramo de 4 s. Si cambias la duración la
sincronía se mantiene proporcional sola; sólo conviene actualizar la constante
`DURACION_SECUENCIA` de `wj-includes/components/SequenceStage.tsx` (y la equivalente
`DURACION_PRINCIPAL` del banner), que es el valor de reserva mientras el navegador
todavía no ha leído los metadatos.

## El personaje y la escena WebGL

El banner y el recorrido entregan su `<video>` a una escena **three.js** que lo compone
sobre un campo de partículas con los colores de la Gobernación y responde al cursor
(lente, aberración cromática) y al scroll.

El `<video>` sigue en la página, invisible: es la fuente de la textura. Si el navegador
no tiene WebGL, o el sistema del visitante pide *movimiento reducido*, la escena no se
monta y el `<video>` vuelve a pintarse tal cual. **No hay nada que configurar**: cambiar
el vídeo en `uploads/videos/` es suficiente, la escena coge el nuevo automáticamente —
incluido el modo claro u oscuro, que deduce del color de fondo del CSS.

Los mandos del **Ambient Glow Studio** (el botón inferior derecho del sitio) gobiernan
el halo de la escena: color de la paleta institucional, tamaño e intensidad.

## El asistente de voz

El botón del micrófono, abajo a la izquierda, abre el asistente y pide
conversación hablada. Ocupa el sitio del antiguo interruptor de sonido: abrir el
asistente es ahora el gesto con el que el visitante acepta el audio de la
página, así que enciende también los sonidos de la interfaz.

Dentro del panel, el micrófono llama y el botón rojo cuelga. Lo hablado y lo
escrito van al mismo hilo, así que se puede empezar hablando y terminar
escribiendo. Cerrar el panel cuelga la llamada.

**Para ponerlo en marcha hace falta configurar el agente de ElevenLabs, y hay
una forma correcta y una peligrosa de guardar la clave.** Está todo en
**[`VOZ.md`](VOZ.md)** — léelo antes de tocar nada de esto.

## Mover el vídeo con el teléfono

En móvil aparece un botón con una brújula junto al control de sonido: enciende el
**giroscopio** y entonces inclinar el teléfono mueve el vídeo del banner, igual que el
ratón en un ordenador. Treinta grados de giro recorren el clip entero.

Es una opción y no algo automático porque iPhone exige pedir permiso al visitante, y ese
permiso sólo se puede pedir cuando alguien pulsa algo. Detalles a tener en cuenta:

- **Hace falta HTTPS.** En Android el navegador no entrega las lecturas del sensor por
  `http://`. En el dominio de la Gobernación, con el certificado puesto, funciona.
- Si el aparato no tiene sensor, el botón no aparece.
- Si el visitante deniega el permiso, el botón se queda apagado y lo explica al pasar el
  dedo por encima; se vuelve a conceder desde los ajustes del navegador.

## Contraste de los colores sobre blanco

Los acentos de la identidad (ember, sky, amber) no llegan por sí solos al contraste que
pide la Resolución 1519 cuando se usan como **texto** sobre blanco. Por eso hay dos
juegos de tokens en `index.css`:

- `--color-ember`, `--color-sky`, `--color-amber` — los colores de marca, para
  **rellenos**: botones, puntos, barras. Ahí no hay problema de contraste.
- `--color-ember-ink`, `--color-sky-ink`, `--color-amber-ink` — los mismos tonos algo
  más oscuros, para **texto**. Llegan a 4,5:1 sobre blanco.

Si añades texto en color, usa las variantes `-ink`.
