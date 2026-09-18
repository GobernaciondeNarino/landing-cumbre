var X=Object.defineProperty;var Y=(r,e,t)=>e in r?X(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var i=(r,e,t)=>Y(r,typeof e!="symbol"?e+"":e,t);import{u as K,r as d,j as W}from"./index-BPgzvliR.js";import{S as k,C as Q,V as y,W as Z,P as ee,a as te,M as re,b as ae,c as ie,d as oe,L as V,e as T,B as se,f as F,g as O,h as ne,A as q,O as S,i as le}from"./three-oNsKUHeZ.js";const G=`
  float wjLuma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
  }

  float wjHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
`,ue=`
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
`,ce=`
  precision mediump float;
${G}
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
`,de=`
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,fe=`
  precision highp float;
${G}
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
`;function he(){if(typeof window>"u"||typeof document>"u")return!1;try{const r=document.createElement("canvas"),e=r.getContext("webgl2")??r.getContext("webgl")??r.getContext("experimental-webgl");if(!e)return!1;const t=e.getExtension("WEBGL_lose_context");return t==null||t.loseContext(),!0}catch{return!1}}function M(r=2){return typeof window>"u"?1:Math.min(window.devicePixelRatio||1,r)}function pe(){if(typeof window>"u"||typeof document>"u")return"light";const r=getComputedStyle(document.documentElement).getPropertyValue("--color-abyss").trim(),e=me(r);if(!e)return"light";const[t,a,s]=e;return(.2126*t+.7152*a+.0722*s)/255>.5?"light":"dark"}function me(r){const e=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(r);if(e){const a=e[1].length===3?e[1].replace(/./g,s=>s+s):e[1];return[parseInt(a.slice(0,2),16),parseInt(a.slice(2,4),16),parseInt(a.slice(4,6),16)]}const t=/^rgba?\(([^)]+)\)$/i.exec(r);if(t){const a=t[1].split(/[,/\s]+/).filter(Boolean).map(Number);if(a.length>=3&&a.slice(0,3).every(Number.isFinite))return[a[0],a[1],a[2]]}return null}const ve={dark:[["#009edb",.36],["#dce9ff",.28],["#ff6300",.22],["#feb100",.14]],light:[["#007eaf",.34],["#2a3242",.26],["#c94e00",.24],["#9d6e00",.16]]},A=34,ge=26,be=16;class ye{constructor({canvas:e,variant:t,theme:a,onContextLost:s}){i(this,"renderer");i(this,"fieldScene",new k);i(this,"figureScene",new k);i(this,"fieldCamera");i(this,"figureCamera",new Q);i(this,"field");i(this,"fieldMaterial");i(this,"figure");i(this,"figureMaterial");i(this,"videoTexture",null);i(this,"video",null);i(this,"hasFrame",!1);i(this,"rvfcHandle",null);i(this,"pointerTarget",new y(0,0));i(this,"pointer",new y(0,0));i(this,"warmAlpha",.45);i(this,"auraIntensity",.32);i(this,"progressTarget",0);i(this,"progress",0);i(this,"energy",0);i(this,"opacity",1);i(this,"frameId",null);i(this,"running",!1);i(this,"disposed",!1);i(this,"clock",0);i(this,"lastTime",0);i(this,"theme");i(this,"onContextLost");i(this,"handleContextLost",e=>{var t;e.preventDefault(),this.stop(),(t=this.onContextLost)==null||t.call(this)});i(this,"tick",e=>{if(!this.running||this.disposed)return;this.frameId=requestAnimationFrame(this.tick);const t=Math.min((e-this.lastTime)/1e3,.05);this.lastTime=e,this.clock+=t;const a=this.pointerTarget.distanceTo(this.pointer),s=Math.abs(this.progressTarget-this.progress);this.energy=b(this.energy*.92+a*1.6+s*14,0,1),this.pointer.lerp(this.pointerTarget,1-Math.pow(.0015,t)),this.progress+=(this.progressTarget-this.progress)*(1-Math.pow(.002,t)),this.updateVideoTexture();const n=this.figureMaterial.uniforms;n.uPointer.value.copy(this.pointer),n.uTime.value=this.clock,n.uEnergy.value=this.energy,n.uOpacity.value=this.opacity,!this.hasFrame&&this.video&&this.video.readyState>=2&&this.video.videoWidth>0&&(this.hasFrame=!0),n.uHasFrame.value=this.hasFrame?1:0,this.video&&this.video.videoWidth>0&&n.uMediaSize.value.set(this.video.videoWidth,this.video.videoHeight);const f=this.fieldMaterial.uniforms;f.uPointer.value.copy(this.pointer),f.uTime.value=this.clock,f.uProgress.value=this.progress,f.uEnergy.value=this.energy,this.renderer.clear(),this.theme==="light"?(this.renderer.render(this.figureScene,this.figureCamera),this.renderer.render(this.fieldScene,this.fieldCamera)):(this.renderer.render(this.fieldScene,this.fieldCamera),this.renderer.render(this.figureScene,this.figureCamera))});this.onContextLost=s,this.theme=a,this.renderer=new Z({canvas:e,alpha:!0,antialias:!1,powerPreference:"high-performance",depth:!1,stencil:!1}),this.renderer.setPixelRatio(M()),this.renderer.setClearColor(0,0),this.renderer.autoClear=!1,e.addEventListener("webglcontextlost",this.handleContextLost),this.fieldCamera=new ee(55,1,.1,120),this.fieldCamera.position.set(0,0,6);const n=t==="hero"?950:1300,{geometry:f,material:p}=xe(n,t,a);this.fieldMaterial=p,this.field=new te(f,p),this.field.frustumCulled=!1,this.fieldScene.add(this.field),this.figureMaterial=Ce(a),this.figure=new re(new ae(2,2),this.figureMaterial),this.figure.frustumCulled=!1,this.figureScene.add(this.figure)}setVideo(e){if(this.disposed||e===this.video||(this.releaseVideo(),!e))return;this.video=e;const t=new ie(e);t.colorSpace=oe,t.minFilter=V,t.magFilter=V,t.generateMipmaps=!1,this.videoTexture=t,this.figureMaterial.uniforms.uMap.value=t,typeof this.video.requestVideoFrameCallback=="function"&&this.scheduleFrameCallback()}setPalette(e,t="#009edb"){this.disposed||(this.warmAlpha=Me(e),U(this.figureMaterial.uniforms.uWarm.value,e),U(this.figureMaterial.uniforms.uCool.value,t),this.applyAura())}setAura(e,t){this.disposed||(this.auraIntensity=e,this.figureMaterial.uniforms.uAuraSize.value=t,this.applyAura())}applyAura(){this.figureMaterial.uniforms.uAura.value=this.auraIntensity*(.6+this.warmAlpha)}setPointer(e,t){this.pointerTarget.set(b(e,-1,1),b(t,-1,1))}setProgress(e){this.progressTarget=b(e,0,1)}setOpacity(e){this.opacity=b(e,0,1)}setFocus(e,t=.5){this.disposed||this.figureMaterial.uniforms.uFocus.value.set(b(e,0,1),b(t,0,1))}resize(e,t){this.disposed||e===0||t===0||(this.renderer.setPixelRatio(M()),this.renderer.setSize(e,t,!1),this.fieldCamera.aspect=e/t,this.fieldCamera.updateProjectionMatrix(),this.figureMaterial.uniforms.uResolution.value.set(e,t),this.fieldMaterial.uniforms.uPixelRatio.value=M())}start(){this.disposed||this.running||(this.running=!0,this.lastTime=performance.now(),this.frameId=requestAnimationFrame(this.tick))}stop(){this.running=!1,this.frameId!==null&&(cancelAnimationFrame(this.frameId),this.frameId=null)}updateVideoTexture(){const e=this.videoTexture,t=this.video;!e||!t||typeof t.requestVideoFrameCallback!="function"&&t.readyState>=2&&(e.needsUpdate=!0)}scheduleFrameCallback(){const e=this.video;!e||typeof e.requestVideoFrameCallback!="function"||(this.rvfcHandle=e.requestVideoFrameCallback(()=>{this.disposed||(this.videoTexture&&(this.videoTexture.needsUpdate=!0),this.scheduleFrameCallback())}))}releaseVideo(){var e;this.video&&this.rvfcHandle!==null&&this.video.cancelVideoFrameCallback(this.rvfcHandle),this.rvfcHandle=null,this.hasFrame=!1,(e=this.videoTexture)==null||e.dispose(),this.videoTexture=null,this.figureMaterial.uniforms.uMap.value=null,this.video=null}dispose(){this.disposed||(this.stop(),this.disposed=!0,this.releaseVideo(),this.renderer.domElement.removeEventListener("webglcontextlost",this.handleContextLost),this.field.geometry.dispose(),this.fieldMaterial.dispose(),this.figure.geometry.dispose(),this.figureMaterial.dispose(),this.renderer.dispose())}}function xe(r,e,t){const a=new Float32Array(r*3),s=new Float32Array(r*3),n=new Float32Array(r),f=new Float32Array(r),p=new T;for(let l=0;l<r;l+=1)a[l*3]=(Math.random()*2-1)*ge,a[l*3+1]=(Math.random()*2-1)*be,a[l*3+2]=Math.random()*A-(A-4),p.set(we(t)),s[l*3]=p.r,s[l*3+1]=p.g,s[l*3+2]=p.b,n[l]=Math.random(),f[l]=.35+Math.pow(Math.random(),3.5)*1.1;const m=new se;m.setAttribute("position",new F(a,3)),m.setAttribute("aColor",new F(s,3)),m.setAttribute("aSeed",new F(n,1)),m.setAttribute("aScale",new F(f,1));const C=new O({vertexShader:ue,fragmentShader:ce,uniforms:{uTime:{value:0},uPointer:{value:new y(0,0)},uProgress:{value:0},uEnergy:{value:0},uPixelRatio:{value:M()},uSize:{value:e==="hero"?7.5:5.5},uDepth:{value:A},uFieldAlpha:{value:t==="light"?e==="hero"?.5:.38:e==="hero"?.62:.5}},defines:B(t),transparent:!0,depthTest:!1,depthWrite:!1});return N(C,t),{geometry:m,material:C}}function Ce(r){const e=new O({vertexShader:de,fragmentShader:fe,uniforms:{uMap:{value:null},uResolution:{value:new y(1,1)},uMediaSize:{value:new y(1920,1080)},uPointer:{value:new y(0,0)},uTime:{value:0},uEnergy:{value:0},uOpacity:{value:1},uHasFrame:{value:0},uWarm:{value:new T("#ff6300")},uCool:{value:new T("#009edb")},uAura:{value:.32},uAuraSize:{value:.8},uPlateLift:{value:.45},uFocus:{value:new y(.5,.5)}},defines:B(r),transparent:!0,depthTest:!1,depthWrite:!1});return N(e,r),e}function B(r){return r==="light"?{WJ_LIGHT:"1"}:{}}function N(r,e){r.blending=ne,r.blendEquation=q,r.blendEquationAlpha=q,r.blendSrc=S,r.blendSrcAlpha=S;const t=e==="light"?le:S;r.blendDst=t,r.blendDstAlpha=t}function we(r){const e=ve[r],t=Math.random();let a=0;for(const[s,n]of e)if(a+=n,t<=a)return s;return e[0][0]}function U(r,e){try{r.setStyle(Fe(e))}catch{r.set("#ff6300")}}function Fe(r){const e=/^rgba\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)[,)]/i.exec(r.trim());return e?`rgb(${e[1].trim()}, ${e[2].trim()}, ${e[3].trim()})`:r}function Me(r){const e=/^rgba\(\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([^)]+)\)$/i.exec(r.trim());if(!e)return 1;const t=e[1].trim(),a=t.endsWith("%")?Number(t.slice(0,-1))/100:Number(t);return Number.isFinite(a)?b(a,0,1):1}function b(r,e,t){return Math.max(e,Math.min(t,r))}function Ae({video:r,variant:e,progress:t,opacity:a,glowColor:s,glowIntensity:n,glowSize:f,focusX:p=.5,tilt:m,className:C,onActiveChange:l}){const $=K(),[J]=d.useState(he),[u,E]=d.useState(!1),L=d.useRef(null),R=d.useRef(null),v=d.useRef(null),P=J&&$!==!0;return d.useEffect(()=>{if(!P)return;const o=R.current,h=L.current;if(!o||!h)return;let g;try{g=new ye({canvas:o,variant:e,theme:pe(),onContextLost:()=>E(!1)})}catch{return}v.current=g;const z=h.getBoundingClientRect();g.resize(z.width,z.height),E(!0);const I=new ResizeObserver(x=>{var H;const c=(H=x[0])==null?void 0:H.contentRect;c&&g.resize(c.width,c.height)});I.observe(h);let D=!0;const w=()=>{D&&document.visibilityState==="visible"?g.start():g.stop()},j=new IntersectionObserver(x=>{var c;D=((c=x[0])==null?void 0:c.isIntersecting)??!0,w()},{threshold:0});j.observe(h),document.addEventListener("visibilitychange",w),w();const _=x=>{const c=h.getBoundingClientRect();c.width===0||c.height===0||g.setPointer((x.clientX-c.left)/c.width*2-1,-((x.clientY-c.top)/c.height*2-1))};return window.addEventListener("pointermove",_,{passive:!0}),()=>{window.removeEventListener("pointermove",_),document.removeEventListener("visibilitychange",w),j.disconnect(),I.disconnect(),g.dispose(),v.current=null,E(!1)}},[P,e]),d.useEffect(()=>{var o;u&&((o=v.current)==null||o.setVideo(r))},[u,r]),d.useEffect(()=>{if(!u)return;const o=v.current;o&&(o.setPalette(s),o.setAura(.16*n,f/110))},[u,s,n,f]),d.useEffect(()=>{var o;u&&((o=v.current)==null||o.setFocus(p))},[u,p]),d.useEffect(()=>{if(!u||!m)return;const o=v.current;if(o)return o.setPointer(m.get(),0),m.on("change",h=>o.setPointer(h,0))},[u,m]),d.useEffect(()=>{if(!u)return;const o=v.current;if(o)return o.setProgress(t.get()),t.on("change",h=>o.setProgress(h))},[u,t]),d.useEffect(()=>{if(!u)return;const o=v.current;if(o){if(!a){o.setOpacity(1);return}return o.setOpacity(a.get()),a.on("change",h=>o.setOpacity(h))}},[u,a]),d.useEffect(()=>{l==null||l(u)},[u,l]),P?W.jsx("div",{ref:L,"aria-hidden":"true",className:C,children:W.jsx("canvas",{ref:R,className:"block size-full"})}):null}export{Ae as default};
