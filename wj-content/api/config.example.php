<?php
/**
 * Plantilla de configuración del asistente de voz.
 *
 * CÓMO SE USA
 * -----------
 * 1. Copia este archivo a `config.php`, en esta misma carpeta.
 * 2. Rellena los dos valores.
 * 3. Listo — no hay que recompilar ni tocar nada más.
 *
 * `config.php` está en el .gitignore, así que ni se sube al repositorio ni lo
 * pisa un despliegue por Git. Este archivo de ejemplo sí se versiona, y por eso
 * no lleva ningún valor real.
 *
 * Si sólo rellenas el ID y dejas la clave vacía, el asistente funciona en modo
 * AGENTE PÚBLICO: el ID no es un secreto y el navegador se conecta con él.
 * Es el modo recomendado — no hay ninguna credencial que proteger.
 *
 * Esta es la forma recomendada en Plesk. NO uses `env[...]` en PHP Settings →
 * Additional configuration directives: en alt-php ese campo se valida como
 * php.ini, esa sintaxis no existe ahí y PHP-FPM se queda sin arrancar.
 *
 * Las otras formas de configurar lo mismo, en wj-admin/VOZ.md.
 */

return [
    // ElevenLabs → Agents → tu agente → Agent ID
    'ELEVENLABS_AGENT_ID' => '',

    // ElevenLabs → Profile → API Keys. Sólo para agentes PRIVADOS.
    // Déjala vacía si el agente es público.
    'ELEVENLABS_API_KEY'  => '',
];
