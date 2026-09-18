import {
  AddEquation,
  BufferAttribute,
  BufferGeometry,
  Camera,
  Color,
  CustomBlending,
  LinearFilter,
  Mesh,
  OneFactor,
  OneMinusSrcAlphaFactor,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  VideoTexture,
  WebGLRenderer,
} from "three";
import { FIELD_FRAGMENT, FIELD_VERTEX, FIGURE_FRAGMENT, FIGURE_VERTEX } from "./shaders";
import { safePixelRatio, type SceneTheme } from "./support";

/**
 * Escena WebGL de los dos escenarios de la landing.
 *
 * Reparte el fotograma en dos pasadas sobre el mismo lienzo transparente:
 *   1. el campo de partículas, con cámara en perspectiva, que aporta la
 *      profundidad y el paralaje del puntero;
 *   2. el plano del personaje, un quad a pantalla completa que consume el
 *      <video> scrubbeado como textura.
 *
 * Ambas escriben en aditivo puro, así que el lienzo se queda transparente
 * donde no pinta nada y el degradado y el título del DOM siguen leyéndose por
 * debajo — es el mismo apilado que tenía la versión con `mix-blend-screen`.
 *
 * La clase no sabe nada de React: recibe órdenes (`setPointer`, `setProgress`,
 * `setPalette`…) y las interpola en su propio bucle.
 */

export type SceneVariant = "hero" | "sequence";

interface CumbreSceneOptions {
  canvas: HTMLCanvasElement;
  variant: SceneVariant;
  /** Lo decide el CSS; ver `detectTheme`. */
  theme: SceneTheme;
  onContextLost?: () => void;
}

/**
 * Paleta institucional del campo. El azul lleva el peso y los cálidos puntúan:
 * con el reparto invertido el fondo se lee como confeti y no como el campo de
 * datos sobrio que pide la identidad de la Gobernación.
 *
 * Sobre blanco los mismos tonos se apagan, así que el tema claro usa las
 * variantes de texto (las que llegan a 4,5:1) más un neutro oscuro que hace de
 * polvo fino; los originales quedan para los rellenos de la interfaz.
 */
const FIELD_PALETTE: Record<SceneTheme, Array<[string, number]>> = {
  dark: [
    ["#009edb", 0.36],
    ["#dce9ff", 0.28],
    ["#ff6300", 0.22],
    ["#feb100", 0.14],
  ],
  light: [
    ["#007eaf", 0.34],
    ["#2a3242", 0.26],
    ["#c94e00", 0.24],
    ["#9d6e00", 0.16],
  ],
};

const FIELD_DEPTH = 34;
const FIELD_HALF_WIDTH = 26;
const FIELD_HALF_HEIGHT = 16;

export class CumbreScene {
  private readonly renderer: WebGLRenderer;
  private readonly fieldScene = new Scene();
  private readonly figureScene = new Scene();
  private readonly fieldCamera: PerspectiveCamera;
  /** El quad se proyecta desde su vertex shader: le basta una cámara vacía. */
  private readonly figureCamera = new Camera();

  private readonly field: Points;
  private readonly fieldMaterial: ShaderMaterial;
  private readonly figure: Mesh;
  private readonly figureMaterial: ShaderMaterial;

  private videoTexture: VideoTexture | null = null;
  private video: HTMLVideoElement | null = null;
  private hasFrame = false;
  private rvfcHandle: number | null = null;

  private readonly pointerTarget = new Vector2(0, 0);
  private readonly pointer = new Vector2(0, 0);
  private warmAlpha = 0.45;
  private auraIntensity = 0.32;
  private progressTarget = 0;
  private progress = 0;
  private energy = 0;
  private opacity = 1;

  private frameId: number | null = null;
  private running = false;
  private disposed = false;
  private clock = 0;
  private lastTime = 0;

  private readonly theme: SceneTheme;
  private readonly onContextLost?: () => void;
  private readonly handleContextLost = (event: Event) => {
    event.preventDefault();
    this.stop();
    this.onContextLost?.();
  };

  constructor({ canvas, variant, theme, onContextLost }: CumbreSceneOptions) {
    this.onContextLost = onContextLost;
    this.theme = theme;

    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
      // El escenario no necesita profundidad ni stencil: todo va en aditivo.
      depth: false,
      stencil: false,
    });
    this.renderer.setPixelRatio(safePixelRatio());
    this.renderer.setClearColor(0x000000, 0);
    // Dos pasadas por fotograma: el borrado lo hacemos nosotros una sola vez.
    this.renderer.autoClear = false;
    canvas.addEventListener("webglcontextlost", this.handleContextLost);

    this.fieldCamera = new PerspectiveCamera(55, 1, 0.1, 120);
    this.fieldCamera.position.set(0, 0, 6);

    const count = variant === "hero" ? 950 : 1300;
    const { geometry, material } = createField(count, variant, theme);
    this.fieldMaterial = material;
    this.field = new Points(geometry, material);
    this.field.frustumCulled = false;
    this.fieldScene.add(this.field);

    this.figureMaterial = createFigureMaterial(theme);
    this.figure = new Mesh(new PlaneGeometry(2, 2), this.figureMaterial);
    this.figure.frustumCulled = false;
    this.figureScene.add(this.figure);
  }

  // --- entradas -------------------------------------------------------------

  /** Conecta el <video> scrubbeado; pasar `null` lo desconecta y libera. */
  setVideo(video: HTMLVideoElement | null): void {
    if (this.disposed || video === this.video) return;
    this.releaseVideo();
    if (!video) return;

    this.video = video;
    const texture = new VideoTexture(video);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    this.videoTexture = texture;
    this.figureMaterial.uniforms.uMap.value = texture;

    // Con el vídeo pausado y buscando fotograma, `requestVideoFrameCallback` es
    // la única señal fiable de "hay imagen nueva"; si no existe, el bucle sube
    // la textura en cada vuelta.
    if (typeof this.video.requestVideoFrameCallback === "function") {
      this.scheduleFrameCallback();
    }
  }

  /** Acento cálido (el del Ambient Glow Studio) y acento frío de contraste. */
  setPalette(warm: string, cool = "#009edb"): void {
    if (this.disposed) return;
    this.warmAlpha = parseAlpha(warm);
    applyColor(this.figureMaterial.uniforms.uWarm.value as Color, warm);
    applyColor(this.figureMaterial.uniforms.uCool.value as Color, cool);
    this.applyAura();
  }

  /** Intensidad y tamaño del aura, mapeados desde los mandos del estudio. */
  setAura(intensity: number, size: number): void {
    if (this.disposed) return;
    this.auraIntensity = intensity;
    this.figureMaterial.uniforms.uAuraSize.value = size;
    this.applyAura();
  }

  /** El alfa de la muestra de color también pesa en la fuerza del halo. */
  private applyAura(): void {
    this.figureMaterial.uniforms.uAura.value = this.auraIntensity * (0.6 + this.warmAlpha);
  }

  /** Puntero normalizado a [-1, 1]; el bucle lo persigue con amortiguación. */
  setPointer(x: number, y: number): void {
    this.pointerTarget.set(clamp(x, -1, 1), clamp(y, -1, 1));
  }

  /** Progreso de scroll del escenario, en [0, 1]. */
  setProgress(progress: number): void {
    this.progressTarget = clamp(progress, 0, 1);
  }

  /** Opacidad de la figura: el escenario de secuencia la usa para entrar. */
  setOpacity(opacity: number): void {
    this.opacity = clamp(opacity, 0, 1);
  }

  /**
   * Punto del fotograma que debe sobrevivir al recorte `cover`, en [0, 1].
   * Con la figura rodada a un tercio del encuadre, un móvil en vertical
   * recortaría hasta dejarla fuera si el punto se quedara en el centro.
   */
  setFocus(x: number, y = 0.5): void {
    if (this.disposed) return;
    (this.figureMaterial.uniforms.uFocus.value as Vector2).set(
      clamp(x, 0, 1),
      clamp(y, 0, 1),
    );
  }

  resize(width: number, height: number): void {
    if (this.disposed || width === 0 || height === 0) return;
    this.renderer.setPixelRatio(safePixelRatio());
    this.renderer.setSize(width, height, false);
    this.fieldCamera.aspect = width / height;
    this.fieldCamera.updateProjectionMatrix();
    (this.figureMaterial.uniforms.uResolution.value as Vector2).set(width, height);
    this.fieldMaterial.uniforms.uPixelRatio.value = safePixelRatio();
  }

  // --- bucle ----------------------------------------------------------------

  start(): void {
    if (this.disposed || this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  private readonly tick = (now: number) => {
    if (!this.running || this.disposed) return;
    this.frameId = requestAnimationFrame(this.tick);

    // Delta acotado: al volver de una pestaña en segundo plano el salto sería
    // enorme y el campo pegaría un tirón.
    const delta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.clock += delta;

    // La energía sube con lo que se mueve el puntero y con la velocidad de
    // scroll, y se apaga sola: es lo que dosifica la aberración y el grano.
    const pointerDelta = this.pointerTarget.distanceTo(this.pointer);
    const progressDelta = Math.abs(this.progressTarget - this.progress);
    this.energy = clamp(
      this.energy * 0.92 + pointerDelta * 1.6 + progressDelta * 14,
      0,
      1,
    );

    this.pointer.lerp(this.pointerTarget, 1 - Math.pow(0.0015, delta));
    this.progress += (this.progressTarget - this.progress) * (1 - Math.pow(0.002, delta));

    this.updateVideoTexture();

    const figure = this.figureMaterial.uniforms;
    (figure.uPointer.value as Vector2).copy(this.pointer);
    figure.uTime.value = this.clock;
    figure.uEnergy.value = this.energy;
    figure.uOpacity.value = this.opacity;
    // Durante un seek el navegador baja `readyState` a 1 hasta que entrega el
    // fotograma nuevo. Apagar la figura en ese hueco la hacía parpadear en cada
    // movimiento del cursor, que es justo cuando hay que verla: en cuanto ha
    // subido un fotograma, la textura conserva el último y la figura se queda.
    if (!this.hasFrame && this.video && this.video.readyState >= 2 && this.video.videoWidth > 0) {
      this.hasFrame = true;
    }
    figure.uHasFrame.value = this.hasFrame ? 1 : 0;
    if (this.video && this.video.videoWidth > 0) {
      (figure.uMediaSize.value as Vector2).set(this.video.videoWidth, this.video.videoHeight);
    }

    const fieldUniforms = this.fieldMaterial.uniforms;
    (fieldUniforms.uPointer.value as Vector2).copy(this.pointer);
    fieldUniforms.uTime.value = this.clock;
    fieldUniforms.uProgress.value = this.progress;
    fieldUniforms.uEnergy.value = this.energy;

    this.renderer.clear();
    if (this.theme === "light") {
      // El plano se pinta opaco, así que va primero y el polvo queda delante de
      // la figura. En oscuro es al revés: el plano suma sobre el campo.
      this.renderer.render(this.figureScene, this.figureCamera);
      this.renderer.render(this.fieldScene, this.fieldCamera);
    } else {
      this.renderer.render(this.fieldScene, this.fieldCamera);
      this.renderer.render(this.figureScene, this.figureCamera);
    }
  };

  /**
   * Sin `requestVideoFrameCallback` no hay forma de saber si el decodificador
   * entregó imagen nueva, así que se sube la textura en cada vuelta mientras
   * el vídeo tenga datos. Con la API disponible basta con marcarla al recibir
   * el aviso, que es lo habitual salvo en Firefox.
   */
  private updateVideoTexture(): void {
    const texture = this.videoTexture;
    const video = this.video;
    if (!texture || !video) return;
    if (typeof video.requestVideoFrameCallback !== "function" && video.readyState >= 2) {
      texture.needsUpdate = true;
    }
  }

  private scheduleFrameCallback(): void {
    const video = this.video;
    if (!video || typeof video.requestVideoFrameCallback !== "function") return;
    this.rvfcHandle = video.requestVideoFrameCallback(() => {
      if (this.disposed) return;
      if (this.videoTexture) this.videoTexture.needsUpdate = true;
      this.scheduleFrameCallback();
    });
  }

  private releaseVideo(): void {
    if (this.video && this.rvfcHandle !== null) {
      this.video.cancelVideoFrameCallback(this.rvfcHandle);
    }
    this.rvfcHandle = null;
    this.hasFrame = false;
    this.videoTexture?.dispose();
    this.videoTexture = null;
    this.figureMaterial.uniforms.uMap.value = null;
    this.video = null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
    this.releaseVideo();
    this.renderer.domElement.removeEventListener("webglcontextlost", this.handleContextLost);
    this.field.geometry.dispose();
    this.fieldMaterial.dispose();
    this.figure.geometry.dispose();
    this.figureMaterial.dispose();
    this.renderer.dispose();
  }
}

// --- fábricas ---------------------------------------------------------------

function createField(count: number, variant: SceneVariant, theme: SceneTheme) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const scales = new Float32Array(count);
  const color = new Color();

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() * 2 - 1) * FIELD_HALF_WIDTH;
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * FIELD_HALF_HEIGHT;
    positions[i * 3 + 2] = Math.random() * FIELD_DEPTH - (FIELD_DEPTH - 4);

    color.set(pickPaletteColor(theme));
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    seeds[i] = Math.random();
    // Unos pocos puntos destacan; el resto se queda en polvo fino.
    scales[i] = 0.35 + Math.pow(Math.random(), 3.5) * 1.1;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new BufferAttribute(colors, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  geometry.setAttribute("aScale", new BufferAttribute(scales, 1));

  const material = new ShaderMaterial({
    vertexShader: FIELD_VERTEX,
    fragmentShader: FIELD_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uPointer: { value: new Vector2(0, 0) },
      uProgress: { value: 0 },
      uEnergy: { value: 0 },
      uPixelRatio: { value: safePixelRatio() },
      // El escenario de secuencia se lee con texto encima: polvo más discreto.
      uSize: { value: variant === "hero" ? 7.5 : 5.5 },
      uDepth: { value: FIELD_DEPTH },
      // Sobre blanco un punto opaco pesa más que uno que suma luz.
      uFieldAlpha: {
        value: theme === "light"
          ? (variant === "hero" ? 0.5 : 0.38)
          : (variant === "hero" ? 0.62 : 0.5),
      },
    },
    defines: themeDefines(theme),
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  applyBlending(material, theme);

  return { geometry, material };
}

function createFigureMaterial(theme: SceneTheme): ShaderMaterial {
  const material = new ShaderMaterial({
    vertexShader: FIGURE_VERTEX,
    fragmentShader: FIGURE_FRAGMENT,
    uniforms: {
      uMap: { value: null },
      uResolution: { value: new Vector2(1, 1) },
      uMediaSize: { value: new Vector2(1920, 1080) },
      uPointer: { value: new Vector2(0, 0) },
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uOpacity: { value: 1 },
      uHasFrame: { value: 0 },
      uWarm: { value: new Color("#ff6300") },
      uCool: { value: new Color("#009edb") },
      uAura: { value: 0.32 },
      uAuraSize: { value: 0.8 },
      // Cuánto se empuja el plató del rodaje hacia el blanco del papel.
      uPlateLift: { value: 0.45 },
      uFocus: { value: new Vector2(0.5, 0.5) },
    },
    defines: themeDefines(theme),
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  applyBlending(material, theme);
  return material;
}

function themeDefines(theme: SceneTheme): Record<string, string> {
  return theme === "light" ? { WJ_LIGHT: "1" } : {};
}

/**
 * Mezcla según el papel.
 *
 * Claro — «encima» con alfa premultiplicado (src·1 + dst·(1−α)). El shader ya
 * entrega el color multiplicado por su alfa.
 *
 * Oscuro — aditivo también en el canal alfa. El `AdditiveBlending` de three
 * deja el alfa en 1 allí donde dibuja, y como el quad cubre toda la pantalla el
 * lienzo se volvería opaco y taparía el degradado y el título del DOM. Sumando
 * el alfa que emite el shader — la luminancia de lo pintado — el lienzo sólo se
 * vuelve opaco en proporción a lo que ilumina.
 */
function applyBlending(material: ShaderMaterial, theme: SceneTheme): void {
  material.blending = CustomBlending;
  material.blendEquation = AddEquation;
  material.blendEquationAlpha = AddEquation;
  material.blendSrc = OneFactor;
  material.blendSrcAlpha = OneFactor;
  const dst = theme === "light" ? OneMinusSrcAlphaFactor : OneFactor;
  material.blendDst = dst;
  material.blendDstAlpha = dst;
}

function pickPaletteColor(theme: SceneTheme): string {
  const paleta = FIELD_PALETTE[theme];
  const roll = Math.random();
  let acc = 0;
  for (const [hex, weight] of paleta) {
    acc += weight;
    if (roll <= acc) return hex;
  }
  return paleta[0][0];
}

/**
 * Acepta `#rrggbb` y `rgb()/rgba()`, que es lo que emite el estudio de glow.
 * El alfa se recorta antes de entrar: `Color.setStyle` lo ignora y suelta un
 * aviso por consola en cada cambio de muestra.
 */
function applyColor(target: Color, value: string): void {
  try {
    target.setStyle(withoutAlpha(value));
  } catch {
    target.set("#ff6300");
  }
}

function withoutAlpha(value: string): string {
  const match = /^rgba\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)[,)]/i.exec(value.trim());
  return match ? `rgb(${match[1].trim()}, ${match[2].trim()}, ${match[3].trim()})` : value;
}

/** Alfa de un `rgba(...)`; 1 cuando el color no lo declara. */
function parseAlpha(value: string): number {
  const match = /^rgba\(\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([^)]+)\)$/i.exec(value.trim());
  if (!match) return 1;
  const raw = match[1].trim();
  const alpha = raw.endsWith("%") ? Number(raw.slice(0, -1)) / 100 : Number(raw);
  return Number.isFinite(alpha) ? clamp(alpha, 0, 1) : 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
