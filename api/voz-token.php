<?php
/**
 * Token efímero para el asistente de voz — Cumbre IA Nariño.
 *
 * Por qué existe este archivo
 * ---------------------------
 * La landing es un sitio estático: se compila a HTML y JavaScript y se sirve
 * tal cual. Todo lo que entra en ese JavaScript es público — se lee con «ver
 * código fuente». Una clave de ElevenLabs puesta ahí la puede copiar cualquiera
 * y gastar los créditos de la entidad.
 *
 * Este endpoint es la pieza que falta: vive en el servidor, guarda la clave
 * donde el navegador no llega y entrega al visitante sólo un token que caduca
 * y sirve para una conversación.
 *
 * Sólo hace falta si el agente de ElevenLabs es PRIVADO. Si el agente es
 * público basta con poner su ID en wj-content/wj-voz.ts y no hay ninguna clave
 * que proteger. Ver wj-admin/VOZ.md.
 *
 * Instalación: ver wj-admin/VOZ.md.
 */

declare(strict_types=1);

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

/**
 * Dominios que pueden pedir un token. Sin esto, cualquiera que descubra la URL
 * del endpoint puede sacar tokens y consumir la cuota de la entidad.
 * Deja el array vacío sólo para depurar, nunca en producción.
 */
const ORIGENES_PERMITIDOS = [
    'https://tic.narino.gov.co',
    'https://narino.gov.co',
];

/**
 * Archivo de configuración, FUERA del document root.
 * En Plesk, si el sitio está en /var/www/vhosts/tudominio/httpdocs, este
 * archivo va en /var/www/vhosts/tudominio/private/elevenlabs.ini — un nivel por
 * encima, donde Apache no lo sirve ni por accidente.
 */
const ARCHIVO_CONFIG = __DIR__ . '/../../private/elevenlabs.ini';

/** 'webrtc' (recomendado, menos latencia) o 'websocket'. */
const MODO = 'webrtc';

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

// Comprobación de origen. Se acepta Origin y, si no viene, Referer: algunos
// navegadores no mandan Origin en peticiones GET del mismo sitio.
if (ORIGENES_PERMITIDOS !== []) {
    $origen = $_SERVER['HTTP_ORIGIN'] ?? null;
    if ($origen === null && isset($_SERVER['HTTP_REFERER'])) {
        $partes = parse_url($_SERVER['HTTP_REFERER']);
        if (isset($partes['scheme'], $partes['host'])) {
            $origen = $partes['scheme'] . '://' . $partes['host'];
        }
    }
    if ($origen === null || !in_array($origen, ORIGENES_PERMITIDOS, true)) {
        fallar(403, 'Origen no autorizado');
    }
    header('Access-Control-Allow-Origin: ' . $origen);
    header('Vary: Origin');
}

// La clave: primero variable de entorno (Plesk → PHP Settings), después el
// archivo ini. Nunca se escribe en la respuesta ni en los logs.
$claveApi = getenv('ELEVENLABS_API_KEY') ?: null;
$idAgente = getenv('ELEVENLABS_AGENT_ID') ?: null;

if ($claveApi === null || $idAgente === null) {
    $config = is_readable(ARCHIVO_CONFIG) ? parse_ini_file(ARCHIVO_CONFIG) : false;
    if ($config === false) {
        fallar(500, 'El asistente de voz no está configurado en el servidor');
    }
    $claveApi ??= $config['api_key'] ?? null;
    $idAgente ??= $config['agent_id'] ?? null;
}

if (!is_string($claveApi) || $claveApi === '' || !is_string($idAgente) || $idAgente === '') {
    fallar(500, 'El asistente de voz no está configurado en el servidor');
}

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
