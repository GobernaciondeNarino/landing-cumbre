// ============================================================================
// SHADERS GLSL DE LA ESCENA WEBGL
// Todos escriben en additive puro (src·1 + dst·1) tanto en color como en alfa:
// el alfa que emiten es la luminancia de lo que pintan, así el lienzo queda
// transparente donde no hay nada y el navegador compone
//     resultado = aporte + (1 − luminancia) · fondo
// que es el equivalente WebGL del `mix-blend-screen` que usaban los <video>.
// Paleta: identidad visual de la Gobernación de Nariño (#00133D fondo,
// #FF6300 ember, #009EDB sky, #FEB100 amber).
// ============================================================================

/** Utilidades compartidas: luminancia Rec.709 y ruido barato para el grano. */
const COMMON = /* glsl */ `
  float wjLuma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
  }

  float wjHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
`;

// ---------------------------------------------------------------------------
// Campo de partículas: el "polvo de datos" que da profundidad tras la figura.
// ---------------------------------------------------------------------------

export const FIELD_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uProgress;
  uniform float uEnergy;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uDepth;
  uniform float uFieldAlpha;

  attribute vec3  aColor;
  attribute float aSeed;
  attribute float aScale;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vec3 p = position;

    // Deriva lenta en suspensión: cada punto tiene su propia fase.
    float t = uTime * 0.12 + aSeed * 6.2831853;
    p.x += sin(t) * 0.9;
    p.y += cos(t * 0.8) * 0.7;

    // El scroll empuja el campo hacia la cámara: sensación de avanzar por el
    // recorrido. El módulo recicla los puntos que salen por detrás.
    p.z = mod(p.z + uProgress * 18.0 + uTime * 0.3, uDepth) - (uDepth - 4.0);

    // Paralaje: los puntos cercanos acusan más el movimiento del puntero.
    float depth = clamp((p.z + (uDepth - 4.0)) / uDepth, 0.0, 1.0);
    p.xy += uPointer * (0.9 + depth * 3.2) * (0.7 + uEnergy * 0.7);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (11.0 / max(-mv.z, 0.001));

    // Se funden al nacer y al morir en los extremos del túnel. Los que pasan
    // cerca se atenúan además por tamaño: si no, se leen como manchas.
    vAlpha = smoothstep(0.0, 0.2, depth)
           * (1.0 - smoothstep(0.7, 1.0, depth))
           * (1.0 - depth * 0.45)
           * uFieldAlpha;
  }
`;

export const FIELD_FRAGMENT = /* glsl */ `
  precision mediump float;
${COMMON}
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;

    float halo = smoothstep(0.25, 0.0, d);
    vec3 rgb = vColor * halo * vAlpha;
    gl_FragColor = vec4(rgb, wjLuma(rgb));
  }
`;

// ---------------------------------------------------------------------------
// Plano del personaje: el <video> scrubbeado entra como textura y sale
// recortado por luminancia, con lente de cursor, aberración cromática,
// grano y un aura de marca que sustituye a los blur blobs de CSS.
// ---------------------------------------------------------------------------

export const FIGURE_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const FIGURE_FRAGMENT = /* glsl */ `
  precision highp float;
${COMMON}
  uniform sampler2D uMap;
  uniform vec2  uResolution;
  uniform vec2  uMediaSize;
  uniform vec2  uPointer;
  uniform float uTime;
  uniform float uEnergy;
  uniform float uOpacity;
  uniform float uHasFrame;
  uniform vec3  uWarm;
  uniform vec3  uCool;
  uniform float uAura;
  uniform float uAuraSize;

  varying vec2 vUv;

  /** Réplica exacta de object-fit: cover sobre las UV del plano. */
  vec2 coverUv(vec2 uv) {
    float rs = uResolution.x / max(uResolution.y, 1.0);
    float rm = uMediaSize.x / max(uMediaSize.y, 1.0);
    vec2 st = uv;
    if (rs > rm) {
      st.y = (st.y - 0.5) * (rm / rs) + 0.5;   // pantalla ancha: recorta arriba y abajo
    } else {
      st.x = (st.x - 0.5) * (rs / rm) + 0.5;   // pantalla alta: recorta a los lados
    }
    return st;
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = coverUv(vUv);

    // Lente del cursor: el plano se comba alrededor del puntero.
    vec2 pointerUv = uPointer * 0.5 + 0.5;
    vec2 toPointer = vUv - pointerUv;
    vec2 corrected = vec2(toPointer.x * aspect, toPointer.y);
    float lens = exp(-dot(corrected, corrected) * 5.0);
    uv -= toPointer * lens * (0.030 + uEnergy * 0.045);
    uv = clamp(uv, vec2(0.0), vec2(1.0));

    // Aberración cromática: crece con la energía y hacia los bordes.
    float edge = length(vUv - 0.5);
    float split = (0.0009 + uEnergy * 0.0038) * (0.35 + edge);
    vec2 dir = normalize(toPointer + vec2(1e-5));
    float r = texture2D(uMap, clamp(uv + dir * split, 0.0, 1.0)).r;
    vec3  g = texture2D(uMap, uv).rgb;
    float b = texture2D(uMap, clamp(uv - dir * split, 0.0, 1.0)).b;
    vec3 color = vec3(r, g.g, b);

    // Recorte por luminancia: la figura está rodada sobre #000A22 casi negro,
    // así que la luz la separa del fondo sin arrastrar el plató.
    float l = wjLuma(color);
    float key = smoothstep(0.035, 0.28, l);

    // Etalonaje de marca: altas luces hacia el acento cálido, medios-bajos al cian.
    color = mix(color, uWarm, smoothstep(0.38, 0.95, l) * 0.26);
    color = mix(color, uCool, (1.0 - smoothstep(0.06, 0.46, l)) * 0.30);

    // Barrido y grano: textura de emisión, siempre por debajo del umbral molesto.
    float scan = 0.965 + 0.035 * sin(vUv.y * uResolution.y * 1.5 + uTime * 2.0);
    float grain = (wjHash(vUv * uResolution * 0.5 + uTime) - 0.5) * (0.030 + uEnergy * 0.045);
    color = color * scan + grain;

    // Aura: el halo de marca que antes hacían los blur blobs de CSS.
    vec2 auraCenter = vec2(0.5, 0.52) + uPointer * vec2(0.09, -0.05);
    vec2 ac = vec2((vUv.x - auraCenter.x) * aspect, vUv.y - auraCenter.y);
    float aura = exp(-dot(ac, ac) * (3.2 / max(uAuraSize, 0.05)));
    vec3 auraColor = uWarm * aura * uAura;

    float vignette = smoothstep(1.05, 0.25, edge);
    vec3 rgb = max(color, 0.0) * key * vignette * uOpacity * uHasFrame + auraColor;

    gl_FragColor = vec4(rgb, wjLuma(rgb));
  }
`;
