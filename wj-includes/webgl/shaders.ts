// ============================================================================
// SHADERS GLSL DE LA ESCENA WEBGL
//
// Dos modos, seleccionados con el define `WJ_LIGHT`, porque el fondo cambia
// la física de la composición:
//
//  · Oscuro — todo escribe en aditivo puro (src·1 + dst·1) en color y en alfa;
//    el alfa que emiten es la luminancia de lo pintado, así el lienzo queda
//    transparente donde no hay nada y el navegador compone
//        resultado = aporte + (1 − luminancia) · fondo,
//    que es el equivalente WebGL del `mix-blend-screen` de los <video>.
//    La figura se recorta por luminancia: se rodó sobre un plató casi negro.
//
//  · Claro — sobre blanco el aditivo lo quema todo, así que se compone «encima»
//    con alfa premultiplicado. Y NO se recorta por luminancia: los clips claros
//    llevan a la figura blanca sobre plató blanco, donde figura y fondo
//    comparten luminancia y cualquier recorte le abriría agujeros en la
//    armadura. El plano se pinta opaco y son los degradados del DOM los que lo
//    funden con la página, que es como estaban pensados desde el principio.
//
// Paleta: identidad visual de la Gobernación de Nariño (#FF6300 ember,
// #009EDB sky, #FEB100 amber).
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

    #ifdef WJ_LIGHT
      // Encima, con alfa premultiplicado: puntos de color sobre el papel.
      float a = halo * vAlpha;
      gl_FragColor = vec4(vColor * a, a);
    #else
      vec3 rgb = vColor * halo * vAlpha;
      gl_FragColor = vec4(rgb, wjLuma(rgb));
    #endif
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
  uniform float uPlateLift;
  uniform vec2  uFocus;

  varying vec2 vUv;

  /**
   * object-fit: cover sobre las UV del plano, con punto de interés.
   *
   * uFocus dice qué parte del fotograma tiene que sobrevivir al recorte. Con
   * el centro fijo, un móvil en vertical recorta tanto a los lados que deja
   * fuera a una figura rodada a un tercio del encuadre y enseña plató vacío.
   * La ventana se desplaza hacia el punto y se topa con los bordes del vídeo.
   */
  vec2 coverUv(vec2 uv) {
    float rs = uResolution.x / max(uResolution.y, 1.0);
    float rm = uMediaSize.x / max(uMediaSize.y, 1.0);
    vec2 st = uv;
    if (rs > rm) {
      float escala = rm / rs;                  // pantalla ancha: recorta arriba y abajo
      float mitad = 0.5 * escala;
      float centro = clamp(uFocus.y, mitad, 1.0 - mitad);
      st.y = (st.y - 0.5) * escala + centro;
    } else {
      float escala = rs / rm;                  // pantalla alta: recorta a los lados
      float mitad = 0.5 * escala;
      float centro = clamp(uFocus.x, mitad, 1.0 - mitad);
      st.x = (st.x - 0.5) * escala + centro;
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

    float l = wjLuma(color);

    #ifdef WJ_LIGHT
      // El plató es un gris muy claro con su propio degradado. Se empuja hacia
      // el blanco del papel lo justo para que el plano no se lea como un panel
      // gris, sin llegar a aplastar los medios que dan forma a la figura.
      color = mix(color, vec3(1.0), smoothstep(0.45, 0.95, l) * uPlateLift);
      // Etalonaje de marca, al revés que en oscuro: aquí manda la sombra.
      color = mix(color, uCool * 0.9, (1.0 - smoothstep(0.10, 0.55, l)) * 0.22);
    #else
      // Recorte por luminancia: la figura está rodada sobre #000A22 casi negro,
      // así que la luz la separa del fondo sin arrastrar el plató.
      float key = smoothstep(0.035, 0.28, l);

      // Etalonaje de marca: altas luces al acento cálido, medios-bajos al cian.
      color = mix(color, uWarm, smoothstep(0.38, 0.95, l) * 0.26);
      color = mix(color, uCool, (1.0 - smoothstep(0.06, 0.46, l)) * 0.30);
    #endif

    // Barrido y grano: textura, siempre por debajo del umbral molesto.
    float scan = 0.965 + 0.035 * sin(vUv.y * uResolution.y * 1.5 + uTime * 2.0);
    float grain = (wjHash(vUv * uResolution * 0.5 + uTime) - 0.5) * (0.030 + uEnergy * 0.045);
    color = color * scan + grain;

    // Aura: el halo de marca que antes hacían los blur blobs de CSS.
    vec2 auraCenter = vec2(0.5, 0.52) + uPointer * vec2(0.09, -0.05);
    vec2 ac = vec2((vUv.x - auraCenter.x) * aspect, vUv.y - auraCenter.y);
    float aura = exp(-dot(ac, ac) * (3.2 / max(uAuraSize, 0.05)));

    #ifdef WJ_LIGHT
      // Sobre blanco un aditivo no se ve: el aura tiñe el plató.
      color = mix(color, uWarm, aura * uAura * 0.45);
      float alpha = uOpacity * uHasFrame;
      gl_FragColor = vec4(clamp(color, 0.0, 1.0) * alpha, alpha);
    #else
      vec3 auraColor = uWarm * aura * uAura;
      float vignette = smoothstep(1.05, 0.25, edge);
      vec3 rgb = max(color, 0.0) * key * vignette * uOpacity * uHasFrame + auraColor;
      gl_FragColor = vec4(rgb, wjLuma(rgb));
    #endif
  }
`;
