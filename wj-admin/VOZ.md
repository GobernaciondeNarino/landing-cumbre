# Asistente de voz — dónde va la clave de ElevenLabs

## Lo primero: la clave que circuló hay que cambiarla

La clave de ElevenLabs que se compartió por chat para montar esto **se
considera quemada**. Ha pasado por un canal que no es un gestor de secretos y
queda en el historial de esa conversación. Antes de poner nada en producción:

1. Entra en **ElevenLabs → Profile → API Keys**.
2. Revoca la clave que empieza por `227d79ff…`.
3. Crea una nueva y guárdala como se explica más abajo.

No está escrita en ningún archivo de este repositorio, y no debe estarlo.

## Por qué no se puede poner la clave en la web

Esta landing es un sitio **estático**: se compila a HTML y JavaScript y Plesk
los sirve tal cual. No hay proceso de servidor que guarde nada.

Todo lo que entra en ese JavaScript es **público**. No importa si está en un
archivo de configuración, en una constante o «escondido» entre el código: se lee
con «ver código fuente» o abriendo la pestaña de red del navegador. Una clave de
API ahí es una clave regalada — quien la copie factura a la cuenta de la
Gobernación hasta agotar los créditos.

Hay dos formas correctas de resolverlo. La primera no necesita clave.

---

## Opción A — Agente público (recomendada, sin clave)

ElevenLabs permite marcar un agente como **público**. Entonces el navegador se
conecta con el **ID del agente**, que no es un secreto: identifica al agente
pero no autoriza a gastar créditos de la cuenta ni a tocar nada más.

1. En **ElevenLabs → Agents**, abre tu agente.
2. En sus ajustes de seguridad, actívalo como público.
3. En la misma pantalla, añade la **lista de dominios permitidos**
   (`tic.narino.gov.co`). Esto evita que el agente se pueda incrustar desde
   otro sitio.
4. Copia el **Agent ID**.
5. Pégalo en `wj-content/wj-voz.ts`:

   ```ts
   export const AGENTE_VOZ_ID = "agent_xxxxxxxxxxxxxxxxxxxxxxxxx";
   ```

6. `npm run build` y despliega.

Con esto el micrófono funciona y **no hay ninguna clave que proteger**.

---

## Opción B — Agente privado (con clave, en el servidor)

Si el agente tiene que ser privado, el navegador no puede conectarse solo:
necesita un **token efímero** que sólo se consigue con la clave. Ese
intercambio ocurre en el servidor.

En el repositorio está el endpoint listo: **`wj-content/api/voz-token.php`**.

### 1. Dónde va la clave

**Fuera del document root.** Si el sitio vive en

```
/var/www/vhosts/tudominio.gov.co/httpdocs/
```

la clave va un nivel por encima, donde Apache no puede servirla ni
equivocándose:

```
/var/www/vhosts/tudominio.gov.co/private/elevenlabs.ini
```

(El endpoint la busca tres niveles por encima de sí mismo, que es justo ahí
cuando el repositorio está desplegado en `httpdocs`.)

Contenido del archivo:

```ini
api_key  = "la_clave_nueva_de_elevenlabs"
agent_id = "agent_xxxxxxxxxxxxxxxxxxxxxxxxx"
```

Permisos, para que sólo lo lea el usuario de PHP:

```bash
mkdir -p /var/www/vhosts/tudominio.gov.co/private
chmod 700 /var/www/vhosts/tudominio.gov.co/private
chmod 600 /var/www/vhosts/tudominio.gov.co/private/elevenlabs.ini
chown <usuario_del_sitio>:psacln /var/www/vhosts/tudominio.gov.co/private/elevenlabs.ini
```

**Alternativa sin archivo:** en Plesk, *Websites & Domains → PHP Settings →
Additional configuration directives*:

```
env[ELEVENLABS_API_KEY] = la_clave_nueva_de_elevenlabs
env[ELEVENLABS_AGENT_ID] = agent_xxxxxxxxxxxxxxxxxxxxxxxxx
```

El endpoint mira primero las variables de entorno y después el `.ini`.

### 2. Apuntar la web al endpoint

En `wj-content/wj-voz.ts`:

```ts
export const ENDPOINT_TOKEN_VOZ = "/wj-content/api/voz-token.php";
```

El `.htaccess` del repositorio ya deja pasar `/wj-content/api/` para que el PHP
se ejecute con normalidad; no hay nada que añadir.

### 3. Revisar los dominios permitidos

En `wj-content/api/voz-token.php`, arriba del todo, `ORIGENES_PERMITIDOS` tiene que
contener el dominio real desde el que se sirve la landing. Sin eso, cualquiera
que descubra la URL del endpoint puede pedir tokens y gastar la cuota.

### 4. Comprobar

```bash
curl -H "Referer: https://tic.narino.gov.co/" \
  https://tudominio.gov.co/wj-content/api/voz-token.php
```

Debe devolver `{"token":"..."}`. Si devuelve un error, el detalle queda en el
log de errores de PHP del sitio — a propósito: al navegador no se le cuenta
nada de la cuenta de ElevenLabs.

---

## Cómo se usa, ya montado

- El **micrófono** flotante (abajo a la izquierda) abre el asistente y pide
  conversación por voz.
- Dentro del asistente, el botón del micrófono llama y el botón rojo cuelga.
- Lo hablado y lo escrito van al **mismo hilo**: se puede empezar hablando y
  terminar escribiendo.
- Cerrar el panel cuelga la llamada.

Mientras `AGENTE_VOZ_ID` y `ENDPOINT_TOKEN_VOZ` estén vacíos, el micrófono avisa
de que el asistente de voz todavía no está configurado y el chat escrito sigue
respondiendo con el mensaje de cortesía.

## Requisitos del navegador

- **HTTPS obligatorio.** Sin certificado, el navegador no da acceso al
  micrófono. En el dominio de la Gobernación ya lo hay.
- El visitante tiene que **conceder el permiso de micrófono**. Si lo deniega, el
  asistente lo dice en lugar de quedarse colgado.

## Lo que nunca hay que hacer

- Poner la clave en `wj-content/`, en `wj-includes/` o en cualquier archivo que
  acabe dentro de `dist/`.
- Poner la clave en una variable `VITE_…`. Vite las incrusta en el bundle
  **a propósito**: son para valores públicos.
- Subir el `.ini` al repositorio. La raíz tiene un `.gitignore` que ignora
  `.env` y similares, pero la regla de oro es que el secreto no sale del
  servidor.
