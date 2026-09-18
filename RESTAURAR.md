# Restaurar una versión anterior

La landing existe en dos versiones visuales completas. Las dos están en el
historial de este repositorio; cambiar de una a otra es un `checkout`, no una
reconstrucción.

| Versión | Papel | Personaje | Commit |
| --- | --- | --- | --- |
| **Clara** (actual) | Blanco `#FFFFFF`, tinta negra | Rodado sobre plató blanco | rama `claude/affectionate-maxwell-dc81hi` |
| **Oscura** | Azul `#00133D`, tinta blanca | Rodado sobre plató casi negro | `d59b93e` |

## Volver a la versión oscura

```bash
git fetch origin
git checkout d59b93e       # árbol completo de la versión oscura
```

Para dejarla como estado de la rama y desplegarla desde ahí:

```bash
git checkout claude/affectionate-maxwell-dc81hi
git revert --no-commit d59b93e..HEAD
git commit -m "Volver a la versión oscura"
git push origin claude/affectionate-maxwell-dc81hi
```

Después, en Plesk: **Git → Pull/Deploy**, y purga la caché de Cloudflare.

> **Si ya tienes una copia de la versión oscura en el servidor**, restaurarla es
> simplemente volver a subir esa carpeta: `dist/` es autocontenido y no
> necesita Node.js en producción.

## Marcar la versión con una etiqueta

El entorno desde el que se hizo este trabajo tiene bloqueado el envío de
etiquetas (`git push origin <tag>` responde HTTP 403; las ramas sí pasan). La
etiqueta queda pendiente de crear desde una máquina con permisos:

```bash
git tag -a v1.0-oscura d59b93e -m "Versión oscura"
git push origin v1.0-oscura
```

## Qué cambia entre las dos versiones

Restaurar a medias no funciona: las tres piezas van juntas.

1. **Los vídeos.** `wj-content/uploads/videos/` — los clips claros están
   rodados sobre plató blanco y los oscuros sobre plató casi negro. Un clip
   oscuro sobre papel blanco se ve como un rectángulo negro.
2. **Los tokens de color.** `wj-includes/index.css` — el bloque `@theme`
   define el papel (`--color-abyss`), la tinta (`--color-ink`) y las variantes
   accesibles de los acentos.
3. **El modo de la escena WebGL.** No hay nada que tocar: la escena lee el color
   de `--color-abyss` con `detectTheme()` y elige sola entre componer en
   aditivo (papel oscuro, la figura se recorta por luminancia) o «encima» con
   alfa (papel claro, la figura se pinta opaca). Cambiar el token basta para que
   WebGL le siga.

Lo que **no** cambia entre versiones: los textos, los capítulos, los enlaces,
el formulario de inscripción y la estructura de la página.
