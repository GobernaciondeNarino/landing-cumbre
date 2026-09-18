<?php
/**
 * Puerta de entrada del asistente de voz — Cumbre IA Nariño.
 *
 * Qué resuelve
 * ------------
 * La landing es un sitio estático: se compila a HTML y JavaScript y se sirve
 * tal cual. Todo lo que entra en ese JavaScript es público — se lee con «ver
 * código fuente». Una clave de ElevenLabs puesta ahí la puede copiar cualquiera
 * y gastar los créditos de la entidad.
 *
 * Este archivo es la única pieza que se ejecuta en el servidor, y por eso es el
 * único sitio donde puede vivir la clave. La web no lleva ninguna
 * configuración del asistente: se la pregunta aquí en cada llamada. Cambiar de
 * agente o de clave no obliga a recompilar ni a tocar el repositorio.
 *
 * Responde de tres maneras, según lo que encuentre configurado:
 *
 *   · Clave + ID de agente  →  {"token":"…"}    agente privado, token efímero
 *   · Sólo ID de agente     →  {"agentId":"…"}  agente público, sin secreto
 *   · Nada                  →  503 y un mensaje que lo explica
 *
 * Dónde se configura: wj-admin/VOZ.md.
 */

declare(strict_types=1);

// ---------------------------------------------------------------------------
// Ajustes del propio endpoint (esto sí vive en el repositorio: no es secreto)
// ---------------------------------------------------------------------------

/**
 * Dominios EXTRA que pueden pedir un token, además del propio.
 *
 * El dominio desde el que se sirve la landing se acepta siempre y se deduce
 * solo de la petición: no hay lista que mantener ni nada que cambiar al pasar
 * de pruebas a producción o al mudar de dominio. Esta constante es únicamente
 * para el caso de que la landing se incruste desde OTRO dominio.
 *
 * Sin esta comprobación, cualquiera que descubra la URL del endpoint podría
 * sacar tokens y consumir la cuota de la entidad.
 */
const ORIGENES_ADICIONALES = [];

/** Configuración local, junto a este archivo. No se versiona. */
const ARCHIVO_LOCAL = __DIR__ . '/config.php';

/**
 * Configuración fuera del document root. Con el sitio en
 * /var/www/vhosts/tudominio/httpdocs, el archivo va en
 * /var/www/vhosts/tudominio/private/elevenlabs.ini — donde Apache no llega.
 * Desde aquí (httpdocs/wj-content/api/) son tres niveles hacia arriba.
 */
const ARCHIVO_INI = __DIR__ . '/../../../private/elevenlabs.ini';

/** 'webrtc' (recomendado, menos latencia) o 'websocket'. */
const MODO = 'webrtc';

// ---------------------------------------------------------------------------
// De dónde sale cada ajuste
// ---------------------------------------------------------------------------

/**
 * Busca un ajuste por los cuatro sitios donde puede estar, en orden de
 * prioridad. El primero que traiga un valor no vacío gana.
 *
 * Los cuatro existen porque cada hosting se administra de una forma, y el que
 * no se use no estorba. En Plesk, lo recomendado es el segundo — sobrevive a
 * los despliegues y no deja el secreto en ningún archivo del repositorio.
 */
function ajuste(string $nombre): ?string
{
    foreach (fuentes() as $fuente) {
        $valor = $fuente[$nombre] ?? null;
        if (is_string($valor) && trim($valor) !== '') {
            return trim($valor);
        }
    }
    return null;
}

function fuentes(): array
{
    static $fuentes = null;
    if ($fuentes !== null) {
        return $fuentes;
    }

    $fuentes = [];

    // 1 · SetEnv del .htaccess o del vhost. Apache lo deja en $_SERVER (y con
    //     el prefijo REDIRECT_ si por el camino hubo una reescritura interna).
    //     Las cabeceras del visitante llegan a $_SERVER con el prefijo HTTP_,
    //     así que nadie puede inyectar un valor desde fuera.
    $desdeApache = [];
    foreach (['ELEVENLABS_API_KEY', 'ELEVENLABS_AGENT_ID'] as $clave) {
        $desdeApache[$clave] = $_SERVER[$clave] ?? $_SERVER['REDIRECT_' . $clave] ?? null;
    }
    $fuentes[] = $desdeApache;

    // 2 · Variables de entorno: en Plesk, Websites & Domains → PHP Settings →
    //     Additional configuration directives → env[ELEVENLABS_API_KEY] = …
    $fuentes[] = [
        'ELEVENLABS_API_KEY'  => getenv('ELEVENLABS_API_KEY') ?: null,
        'ELEVENLABS_AGENT_ID' => getenv('ELEVENLABS_AGENT_ID') ?: null,
    ];

    // 3 · config.php junto a este archivo. Está en .gitignore, así que un
    //     despliegue por Git no lo pisa.
    if (is_readable(ARCHIVO_LOCAL)) {
        $local = require ARCHIVO_LOCAL;
        if (is_array($local)) {
            $fuentes[] = $local;
        }
    }

    // 4 · .ini fuera del document root.
    if (is_readable(ARCHIVO_INI)) {
        $ini = parse_ini_file(ARCHIVO_INI);
        if (is_array($ini)) {
            $fuentes[] = [
                'ELEVENLABS_API_KEY'  => $ini['api_key'] ?? null,
                'ELEVENLABS_AGENT_ID' => $ini['agent_id'] ?? null,
            ];
        }
    }

    return $fuentes;
}

// ---------------------------------------------------------------------------

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function fallar(int $codigo, string $mensaje): never
{
    http_response_code($codigo);
    echo json_encode(['error' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    fallar(405, 'Método no permitido');
}

/** El origen desde el que se está sirviendo este propio endpoint. */
function origenPropio(): ?string
{
    $host = $_SERVER['HTTP_HOST'] ?? null;
    if (!is_string($host) || $host === '') {
        return null;
    }
    // Detrás del proxy de Plesk o de Cloudflare, HTTPS llega en la cabecera.
    $esquema = 'http';
    if (
        (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['SERVER_PORT'] ?? null) === '443'
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? null) === 'https')
    ) {
        $esquema = 'https';
    }
    return $esquema . '://' . $host;
}

// Comprobación de origen. Se mira Origin y, si no viene, Referer: algunos
// navegadores no mandan Origin en peticiones GET del mismo sitio.
$origen = $_SERVER['HTTP_ORIGIN'] ?? null;
if ($origen === null && isset($_SERVER['HTTP_REFERER'])) {
    $partes = parse_url($_SERVER['HTTP_REFERER']);
    if (isset($partes['scheme'], $partes['host'])) {
        // El puerto forma parte del origen. En producción es el implícito y no
        // aparece, pero olvidarlo hace que nada case en cuanto el sitio corre
        // en un puerto propio — pruebas locales incluidas.
        $puerto = isset($partes['port']) ? ':' . $partes['port'] : '';
        $origen = $partes['scheme'] . '://' . $partes['host'] . $puerto;
    }
}

$permitidos = array_filter(array_merge([origenPropio()], ORIGENES_ADICIONALES));
if ($origen === null || !in_array($origen, $permitidos, true)) {
    fallar(403, 'Origen no autorizado');
}
header('Access-Control-Allow-Origin: ' . $origen);
header('Vary: Origin');

$claveApi = ajuste('ELEVENLABS_API_KEY');
$idAgente = ajuste('ELEVENLABS_AGENT_ID');

if ($idAgente === null) {
    fallar(503, 'El asistente de voz no está configurado en el servidor');
}

// Agente público: el ID identifica al agente pero no autoriza a gastar nada,
// así que puede viajar al navegador tal cual. Sin clave, este es el modo.
if ($claveApi === null) {
    echo json_encode(['agentId' => $idAgente], JSON_UNESCAPED_SLASHES);
    exit;
}

// Agente privado: la clave se queda aquí y al navegador sólo le llega un token
// que caduca y sirve para una conversación.
$ruta = MODO === 'websocket'
    ? 'https://api.elevenlabs.io/v1/convai/conversation/get-signed-url'
    : 'https://api.elevenlabs.io/v1/convai/conversation/token';

$peticion = curl_init($ruta . '?agent_id=' . rawurlencode($idAgente));
curl_setopt_array($peticion, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => ['xi-api-key: ' . $claveApi, 'Accept: application/json'],
]);

$respuesta = curl_exec($peticion);
$estado    = (int) curl_getinfo($peticion, CURLINFO_RESPONSE_CODE);
curl_close($peticion);

if ($respuesta === false || $estado !== 200) {
    // El detalle se queda en el servidor: al navegador no le sirve y puede
    // filtrar información de la cuenta.
    error_log('voz-token: ElevenLabs respondió ' . $estado);
    fallar(502, 'No se pudo obtener el token del asistente');
}

$datos = json_decode((string) $respuesta, true);
if (!is_array($datos)) {
    fallar(502, 'Respuesta inesperada del asistente');
}

if (MODO === 'websocket') {
    $firmada = $datos['signed_url'] ?? null;
    if (!is_string($firmada)) {
        fallar(502, 'Respuesta inesperada del asistente');
    }
    echo json_encode(['signedUrl' => $firmada], JSON_UNESCAPED_SLASHES);
    exit;
}

$token = $datos['token'] ?? null;
if (!is_string($token)) {
    fallar(502, 'Respuesta inesperada del asistente');
}

echo json_encode(['token' => $token], JSON_UNESCAPED_SLASHES);
