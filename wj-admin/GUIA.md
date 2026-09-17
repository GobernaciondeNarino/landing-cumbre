# Guía de administración — Cumbre IA Nariño

Todo lo editable del sitio vive en la carpeta **`wj-content/`**. No necesitas tocar
`wj-includes/` (el código de la aplicación) para cambiar textos, enlaces o vídeos.

## Estructura del proyecto

```
wj-admin/       Esta guía de administración.
wj-content/     TODO lo editable: textos, capítulos, enlaces y archivos subidos.
  wj-textos.ts      Textos del banner, cabecera, sección de inscripción y pie.
  wj-capitulos.ts   Los 5 capítulos del recorrido con scroll (títulos, párrafos, CTA).
  wj-enlaces.ts     URL del formulario, rutas de los vídeos y datos de contacto.
  uploads/          Archivos estáticos: vídeos y favicon.
    videos/cumbre-principal.mp4    Vídeo del banner (scrub con el ratón).
    videos/cumbre-secuencia.mp4    Vídeo del recorrido por capítulos (scrub con scroll).
wj-includes/    Código de la aplicación (React): componentes, hooks, estilos.
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
| **Enlace del formulario de inscripción**        | `wj-content/wj-enlaces.ts`  | `FORM_URL` (vacío = botón deshabilitado) |
| Vídeos (cambiar el archivo)                     | `wj-content/uploads/videos/`| Reemplaza el `.mp4` conservando el nombre |
| Vídeos (usar un CDN externo)                    | `wj-content/wj-enlaces.ts`  | `VIDEO_PRINCIPAL_URL` / `VIDEO_SECUENCIA_URL` |
| Correo y web del pie de página                  | `wj-content/wj-enlaces.ts`  | `CONTACTO` |
| Columnas del pie de página                      | `wj-content/wj-textos.ts`   | `PIE` |
| Colores de la paleta                            | `wj-includes/index.css`     | Bloque `@theme` (tokens `--color-…`) |
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

## Requisitos del vídeo de secuencia

- MP4 H.264, sin audio, con `faststart` (el átomo `moov` al inicio).
- El vídeo se reparte en partes iguales entre los 5 capítulos: con 20 s, cada
  capítulo corresponde a un tramo de 4 s. Si cambias la duración, la sincronía
  se mantiene proporcional automáticamente.
