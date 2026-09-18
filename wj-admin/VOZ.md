# Asistente de voz — dónde va la clave de ElevenLabs

## Nota sobre la clave anterior

La primera clave de ElevenLabs de este proyecto se compartió por chat para
montar la integración, así que quedó comprometida y **ya fue sustituida**. Si
alguna vez vuelve a pasar, el remedio es el mismo: **ElevenLabs → Profile →
API Keys**, revocar la antigua y crear otra.

Ninguna clave está escrita en este repositorio, y ninguna debe estarlo.

## Dónde se configura: respuesta corta

**En el servidor, y sólo en el servidor.** La web no lleva ninguna
configuración del asistente: se la pregunta a `wj-content/api/voz-token.php`
cada vez que alguien pulsa el micrófono. Cambiar de agente o rotar la clave **no
obliga a recompilar ni a tocar el repositorio**.

En Plesk, el sitio recomendado es este:

> **Websites & Domains → PHP Settings → Additional configuration directives**
>
> ```
> env[ELEVENLABS_AGENT_ID] = agent_xxxxxxxxxxxxxxxxxxxxxxxxx
> env[ELEVENLABS_API_KEY] = sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
> ```
>
> Guardar y listo. No hay que subir ningún archivo ni recompilar.

Es el recomendado porque **no está en el repositorio** (así que la clave no
puede acabar publicada en GitHub) y **sobrevive a los despliegues** (un `git
pull` no lo toca).

### Si el agente es público, no hace falta clave

Deja sólo `ELEVENLABS_AGENT_ID` y borra la otra línea. El ID identifica al
agente pero no autoriza a gastar nada, así que no hay secreto que proteger.
Es la opción más sencilla y la que menos puede salir mal.

Para marcarlo como público: **ElevenLabs → Agents → tu agente → seguridad**,
actívalo como público y añade `tic.narino.gov.co` a la lista de dominios
permitidos, para que nadie lo incruste desde otro sitio.

---

## Las cuatro formas de configurarlo

El endpoint busca `ELEVENLABS_AGENT_ID` y `ELEVENLABS_API_KEY` por cuatro
sitios, **en este orden**. El primero que traiga un valor gana, y los que no se
usen no estorban:

| # | Dónde | ¿En el repositorio? | ¿Sobrevive a un despliegue? | Cómo se edita |
| --- | --- | --- | --- | --- |
| 1 | `SetEnv` en el `.htaccess` | **Sí** ⚠ | **No** ⚠ | Editor de texto |
| 2 | **Plesk → PHP Settings → `env[…]`** ★ | No | **Sí** | Panel de Plesk |
| 3 | `wj-content/api/config.php` ★ | No (en `.gitignore`) | **Sí** | File Manager |
| 4 | `<vhost>/private/elevenlabs.ini` | No | **Sí** | File Manager / SSH |

### 1 · En el `.htaccess` — lo que preguntaste

Funciona: el `.htaccess` del repositorio ya trae las dos líneas preparadas,
comentadas, al principio del archivo. Basta con quitarles la almohadilla y
poner los valores:

```apache
SetEnv ELEVENLABS_AGENT_ID "agent_xxxxxxxxxxxxxxxxxxxxxxxxx"
SetEnv ELEVENLABS_API_KEY  "sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Apache las pasa a PHP y el endpoint las lee. **Pero tiene dos pegas serias**, y
por eso no es la opción recomendada:

- **El `.htaccess` está versionado.** Si escribes la clave ahí y haces commit,
  la clave acaba publicada en GitHub. Sólo es seguro si lo editas **en el
  servidor** y nunca en tu copia local.
- **Un despliegue por Git lo sobreescribe.** Cada `git pull` de Plesk devuelve
  el archivo a como está en el repositorio y se lleva tus valores por delante.
  Tendrás que volver a ponerlos cada vez.

Si el sitio se despliega a mano por FTP y no por Git, la segunda pega
desaparece y esta opción es perfectamente válida.

### 2 · Variables de entorno de Plesk ★ recomendada

Ya explicada arriba. Sin archivos, sin repositorio, sin sorpresas.

### 3 · `wj-content/api/config.php` ★ buena alternativa

Un archivo PHP junto al endpoint. Está en el `.gitignore`, así que ni se sube
al repositorio ni lo pisa un despliegue.

1. En el File Manager de Plesk, entra en `wj-content/api/`.
2. Copia `config.example.php` y llámalo `config.php`.
3. Rellena los dos valores:

```php
<?php
return [
    'ELEVENLABS_AGENT_ID' => 'agent_xxxxxxxxxxxxxxxxxxxxxxxxx',
    'ELEVENLABS_API_KEY'  => 'sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
];
```

PHP ejecuta ese archivo, no lo entrega, así que la clave no se puede descargar.
Además el `.htaccess` niega explícitamente el acceso directo a `config.php`, por
si algún día PHP quedara desactivado en esa carpeta.

### 4 · Un `.ini` fuera del document root

La más conservadora: el archivo queda fuera de lo que Apache sirve.

```
/var/www/vhosts/tudominio.gov.co/private/elevenlabs.ini
```

```ini
api_key  = "sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
agent_id = "agent_xxxxxxxxxxxxxxxxxxxxxxxxx"
```

```bash
mkdir -p /var/www/vhosts/tudominio.gov.co/private
chmod 700 /var/www/vhosts/tudominio.gov.co/private
chmod 600 /var/www/vhosts/tudominio.gov.co/private/elevenlabs.ini
```

---

## Comprobar que quedó bien

```bash
curl -H "Referer: https://tic.narino.gov.co/" \
  https://tudominio.gov.co/wj-content/api/voz-token.php
```

| Respuesta | Qué significa |
| --- | --- |
| `{"agentId":"agent_…"}` | Agente público configurado. El micrófono ya funciona. |
| `{"token":"…"}` | Agente privado configurado. El micrófono ya funciona. |
| `{"error":"El asistente de voz no está configurado en el servidor"}` | No encontró el ID por ninguno de los cuatro sitios. |
| `{"error":"Origen no autorizado"}` | La petición no venía del propio dominio. Con `curl` es normal: hay que mandar el `Referer` como en el ejemplo. |
| `{"error":"No se pudo obtener el token del asistente"}` | Llegó a ElevenLabs y le dijo que no: clave incorrecta, revocada o sin créditos. El detalle queda en el log de errores de PHP. |
| Un 404 | El endpoint no está donde la web lo busca, o PHP no está activo. |

El mismo mensaje que devuelva el endpoint es el que verá quien pulse el
micrófono, así que si algo falla, se lee en pantalla.

## Quién puede usar el endpoint

Sólo la propia landing. El endpoint acepta las peticiones que vengan **del mismo
dominio desde el que se está sirviendo**, y lo deduce de cada petición: no hay
ninguna lista que mantener, ni nada que cambiar al mudar de dominio o al pasar
de pruebas a producción.

Si alguna vez hiciera falta permitir otro dominio —por ejemplo, si la landing se
incrusta desde otro sitio—, se añade en `ORIGENES_ADICIONALES`, arriba del
endpoint. Normalmente se queda vacío.

Por eso un `curl` a pelo responde `403`: no lleva ni `Origin` ni `Referer`. Para
probar hay que fingir uno, como en el ejemplo de arriba.

## Cómo se usa, ya montado

- El **micrófono** flotante (abajo a la izquierda) abre el asistente y pide
  conversación por voz.
- Dentro del asistente, el botón del micrófono llama y el botón rojo cuelga.
- Lo hablado y lo escrito van al **mismo hilo**: se puede empezar hablando y
  terminar escribiendo.
- Cerrar el panel cuelga la llamada.

Mientras el servidor no tenga configurado el agente, el micrófono lo dice al
pulsarlo y el chat escrito sigue respondiendo con el mensaje de cortesía.

## Requisitos del navegador

- **HTTPS obligatorio.** Sin certificado, el navegador no da acceso al
  micrófono. En el dominio de la Gobernación ya lo hay.
- El visitante tiene que **conceder el permiso de micrófono**. Si lo deniega, el
  asistente lo dice en lugar de quedarse colgado.

## Lo que nunca hay que hacer

- Poner la clave en `wj-content/wj-voz.ts`, en `wj-includes/` o en cualquier
  archivo que acabe dentro de `wj-content/dist/`. Todo eso se compila y se
  sirve al público.
- Hacer commit de un `.htaccess` con la clave dentro.
- Poner la clave en una variable `VITE_…`. Vite las incrusta en el bundle
  **a propósito**: son para valores públicos.
- Subir el `.ini` al repositorio. La raíz tiene un `.gitignore` que ignora
  `.env` y similares, pero la regla de oro es que el secreto no sale del
  servidor.
