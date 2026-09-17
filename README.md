# Cumbre IA Nariño — Landing

Landing interactiva de scroll total para la **Cumbre IA Nariño** (Gobernación de Nariño).
Dos escenarios `sticky` de vídeo cuyo tiempo de reproducción está atado al cursor y al
scroll, cinco capítulos superpuestos, widgets flotantes persistentes y sección final de
inscripción.

> **¿Quieres cambiar textos, enlaces o vídeos?** Todo lo editable está en
> `wj-content/` y la guía completa de administración en **[`wj-admin/GUIA.md`](wj-admin/GUIA.md)**.

## Estructura

```
wj-admin/      Guía de administración (dónde se cambia cada cosa).
wj-content/    Contenido editable: wj-textos.ts, wj-capitulos.ts, wj-enlaces.ts
               y uploads/ (vídeos, favicon).
wj-includes/   Código de la aplicación: componentes React, hooks y estilos.
dist/          Sitio compilado y versionado — es lo que se sirve en Plesk.
index.html     Punto de entrada (Vite y Apache exigen este nombre exacto).
wj-vite.config.ts  Configuración de Vite (base relativa + publicDir en uploads).
.htaccess      Reescribe todas las peticiones hacia dist/ bajo Apache/Plesk.
```

`package.json`, `tsconfig.json` e `index.html` conservan sus nombres porque npm,
TypeScript, Vite y Apache los buscan exactamente así.

## Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS v4 (`@tailwindcss/vite`) · `motion`
(Framer Motion v12, importado desde `motion/react`) · `lucide-react`. Sin librerías de
smooth-scroll: el scrub se resuelve con `useScroll`, `useSpring`, `useTransform`,
`useMotionValueEvent` y un bucle `requestAnimationFrame` con easing para el banner.

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

- `.claude/skills/` — skill [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
  y sus sub-skills de diseño para Claude Code.
- `.github/workflows/claude.yml` — [claude-code-action](https://github.com/anthropics/claude-code-action):
  responde a menciones `@claude` en issues y PRs. Requiere el secret `ANTHROPIC_API_KEY`.
- `.github/workflows/security-review.yml` — [claude-code-security-review](https://github.com/anthropics/claude-code-security-review):
  revisión de seguridad automática en cada PR. Usa el mismo secret `ANTHROPIC_API_KEY`.
