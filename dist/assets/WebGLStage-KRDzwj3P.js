var $=Object.defineProperty;var X=(r,e,t)=>e in r?$(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var i=(r,e,t)=>X(r,typeof e!="symbol"?e+"":e,t);import{u as Y,r as c,j}from"./index-C5kp9N4L.js";import{S as k,C as J,V as x,W as K,P as Q,a as Z,M as ee,b as te,c as re,d as ie,L as H,e as T,B as ae,f as C,g as q,h as se,A as _,O as M}from"./three-BRHULVxx.js";const G=`
  float wjLuma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
  }

  float wjHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
`,oe=`
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
`,ne=`
  precision mediump float;
${G}
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
`,le=`
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,ue=`
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
`;function ce(){if(typeof window>"u"||typeof document>"u")return!1;try{const r=document.createElement("canvas"),e=r.getContext("webgl2")??r.getContext("webgl")??r.getContext("experimental-webgl");if(!e)return!1;const t=e.getExtension("WEBGL_lose_context");return t==null||t.loseContext(),!0}catch{return!1}}function E(r=2){return typeof window>"u"?1:Math.min(window.devicePixelRatio||1,r)}const W=[["#009edb",.36],["#dce9ff",.28],["#ff6300",.22],["#feb100",.14]],S=34,de=26,fe=16;class he{constructor({canvas:e,variant:t,onContextLost:a}){i(this,"renderer");i(this,"fieldScene",new k);i(this,"figureScene",new k);i(this,"fieldCamera");i(this,"figureCamera",new J);i(this,"field");i(this,"fieldMaterial");i(this,"figure");i(this,"figureMaterial");i(this,"videoTexture",null);i(this,"video",null);i(this,"rvfcHandle",null);i(this,"pointerTarget",new x(0,0));i(this,"pointer",new x(0,0));i(this,"warmAlpha",.45);i(this,"auraIntensity",.32);i(this,"progressTarget",0);i(this,"progress",0);i(this,"energy",0);i(this,"opacity",1);i(this,"frameId",null);i(this,"running",!1);i(this,"disposed",!1);i(this,"clock",0);i(this,"lastTime",0);i(this,"onContextLost");i(this,"handleContextLost",e=>{var t;e.preventDefault(),this.stop(),(t=this.onContextLost)==null||t.call(this)});i(this,"tick",e=>{if(!this.running||this.disposed)return;this.frameId=requestAnimationFrame(this.tick);const t=Math.min((e-this.lastTime)/1e3,.05);this.lastTime=e,this.clock+=t;const a=this.pointerTarget.distanceTo(this.pointer),f=Math.abs(this.progressTarget-this.progress);this.energy=y(this.energy*.92+a*1.6+f*14,0,1),this.pointer.lerp(this.pointerTarget,1-Math.pow(.0015,t)),this.progress+=(this.progressTarget-this.progress)*(1-Math.pow(.002,t)),this.updateVideoTexture();const n=this.figureMaterial.uniforms;n.uPointer.value.copy(this.pointer),n.uTime.value=this.clock,n.uEnergy.value=this.energy,n.uOpacity.value=this.opacity,n.uHasFrame.value=this.video&&this.video.readyState>=2&&this.video.videoWidth>0?1:0,this.video&&this.video.videoWidth>0&&n.uMediaSize.value.set(this.video.videoWidth,this.video.videoHeight);const o=this.fieldMaterial.uniforms;o.uPointer.value.copy(this.pointer),o.uTime.value=this.clock,o.uProgress.value=this.progress,o.uEnergy.value=this.energy,this.renderer.clear(),this.renderer.render(this.fieldScene,this.fieldCamera),this.renderer.render(this.figureScene,this.figureCamera)});this.onContextLost=a,this.renderer=new K({canvas:e,alpha:!0,antialias:!1,powerPreference:"high-performance",depth:!1,stencil:!1}),this.renderer.setPixelRatio(E()),this.renderer.setClearColor(0,0),this.renderer.autoClear=!1,e.addEventListener("webglcontextlost",this.handleContextLost),this.fieldCamera=new Q(55,1,.1,120),this.fieldCamera.position.set(0,0,6);const f=t==="hero"?950:1300,{geometry:n,material:o}=pe(f,t);this.fieldMaterial=o,this.field=new Z(n,o),this.field.frustumCulled=!1,this.fieldScene.add(this.field),this.figureMaterial=me(),this.figure=new ee(new te(2,2),this.figureMaterial),this.figure.frustumCulled=!1,this.figureScene.add(this.figure)}setVideo(e){if(this.disposed||e===this.video||(this.releaseVideo(),!e))return;this.video=e;const t=new re(e);t.colorSpace=ie,t.minFilter=H,t.magFilter=H,t.generateMipmaps=!1,this.videoTexture=t,this.figureMaterial.uniforms.uMap.value=t,typeof this.video.requestVideoFrameCallback=="function"&&this.scheduleFrameCallback()}setPalette(e,t="#009edb"){this.disposed||(this.warmAlpha=be(e),O(this.figureMaterial.uniforms.uWarm.value,e),O(this.figureMaterial.uniforms.uCool.value,t),this.applyAura())}setAura(e,t){this.disposed||(this.auraIntensity=e,this.figureMaterial.uniforms.uAuraSize.value=t,this.applyAura())}applyAura(){this.figureMaterial.uniforms.uAura.value=this.auraIntensity*(.6+this.warmAlpha)}setPointer(e,t){this.pointerTarget.set(y(e,-1,1),y(t,-1,1))}setProgress(e){this.progressTarget=y(e,0,1)}setOpacity(e){this.opacity=y(e,0,1)}resize(e,t){this.disposed||e===0||t===0||(this.renderer.setPixelRatio(E()),this.renderer.setSize(e,t,!1),this.fieldCamera.aspect=e/t,this.fieldCamera.updateProjectionMatrix(),this.figureMaterial.uniforms.uResolution.value.set(e,t),this.fieldMaterial.uniforms.uPixelRatio.value=E())}start(){this.disposed||this.running||(this.running=!0,this.lastTime=performance.now(),this.frameId=requestAnimationFrame(this.tick))}stop(){this.running=!1,this.frameId!==null&&(cancelAnimationFrame(this.frameId),this.frameId=null)}updateVideoTexture(){const e=this.videoTexture,t=this.video;!e||!t||typeof t.requestVideoFrameCallback!="function"&&t.readyState>=2&&(e.needsUpdate=!0)}scheduleFrameCallback(){const e=this.video;!e||typeof e.requestVideoFrameCallback!="function"||(this.rvfcHandle=e.requestVideoFrameCallback(()=>{this.disposed||(this.videoTexture&&(this.videoTexture.needsUpdate=!0),this.scheduleFrameCallback())}))}releaseVideo(){var e;this.video&&this.rvfcHandle!==null&&this.video.cancelVideoFrameCallback(this.rvfcHandle),this.rvfcHandle=null,(e=this.videoTexture)==null||e.dispose(),this.videoTexture=null,this.figureMaterial.uniforms.uMap.value=null,this.video=null}dispose(){this.disposed||(this.stop(),this.disposed=!0,this.releaseVideo(),this.renderer.domElement.removeEventListener("webglcontextlost",this.handleContextLost),this.field.geometry.dispose(),this.fieldMaterial.dispose(),this.figure.geometry.dispose(),this.figureMaterial.dispose(),this.renderer.dispose())}}function pe(r,e){const t=new Float32Array(r*3),a=new Float32Array(r*3),f=new Float32Array(r),n=new Float32Array(r),o=new T;for(let u=0;u<r;u+=1)t[u*3]=(Math.random()*2-1)*de,t[u*3+1]=(Math.random()*2-1)*fe,t[u*3+2]=Math.random()*S-(S-4),o.set(ve()),a[u*3]=o.r,a[u*3+1]=o.g,a[u*3+2]=o.b,f[u]=Math.random(),n[u]=.35+Math.pow(Math.random(),3.5)*1.1;const m=new ae;m.setAttribute("position",new C(t,3)),m.setAttribute("aColor",new C(a,3)),m.setAttribute("aSeed",new C(f,1)),m.setAttribute("aScale",new C(n,1));const v=new q({vertexShader:oe,fragmentShader:ne,uniforms:{uTime:{value:0},uPointer:{value:new x(0,0)},uProgress:{value:0},uEnergy:{value:0},uPixelRatio:{value:E()},uSize:{value:e==="hero"?7.5:5.5},uDepth:{value:S},uFieldAlpha:{value:e==="hero"?.62:.5}},transparent:!0,depthTest:!1,depthWrite:!1});return B(v),{geometry:m,material:v}}function me(){const r=new q({vertexShader:le,fragmentShader:ue,uniforms:{uMap:{value:null},uResolution:{value:new x(1,1)},uMediaSize:{value:new x(1920,1080)},uPointer:{value:new x(0,0)},uTime:{value:0},uEnergy:{value:0},uOpacity:{value:1},uHasFrame:{value:0},uWarm:{value:new T("#ff6300")},uCool:{value:new T("#009edb")},uAura:{value:.32},uAuraSize:{value:.8}},transparent:!0,depthTest:!1,depthWrite:!1});return B(r),r}function B(r){r.blending=se,r.blendEquation=_,r.blendSrc=M,r.blendDst=M,r.blendEquationAlpha=_,r.blendSrcAlpha=M,r.blendDstAlpha=M}function ve(){const r=Math.random();let e=0;for(const[t,a]of W)if(e+=a,r<=e)return t;return W[0][0]}function O(r,e){try{r.setStyle(ge(e))}catch{r.set("#ff6300")}}function ge(r){const e=/^rgba\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)[,)]/i.exec(r.trim());return e?`rgb(${e[1].trim()}, ${e[2].trim()}, ${e[3].trim()})`:r}function be(r){const e=/^rgba\(\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([^)]+)\)$/i.exec(r.trim());if(!e)return 1;const t=e[1].trim(),a=t.endsWith("%")?Number(t.slice(0,-1))/100:Number(t);return Number.isFinite(a)?y(a,0,1):1}function y(r,e,t){return Math.max(e,Math.min(t,r))}function Ce({video:r,variant:e,progress:t,opacity:a,glowColor:f,glowIntensity:n,glowSize:o,className:m,onActiveChange:v}){const u=Y(),[N]=c.useState(ce),[d,A]=c.useState(!1),F=c.useRef(null),R=c.useRef(null),g=c.useRef(null),P=N&&u!==!0;return c.useEffect(()=>{if(!P)return;const s=R.current,h=F.current;if(!s||!h)return;let p;try{p=new he({canvas:s,variant:e,onContextLost:()=>A(!1)})}catch{return}g.current=p;const L=h.getBoundingClientRect();p.resize(L.width,L.height),A(!0);const z=new ResizeObserver(b=>{var V;const l=(V=b[0])==null?void 0:V.contentRect;l&&p.resize(l.width,l.height)});z.observe(h);let D=!0;const w=()=>{D&&document.visibilityState==="visible"?p.start():p.stop()},I=new IntersectionObserver(b=>{var l;D=((l=b[0])==null?void 0:l.isIntersecting)??!0,w()},{threshold:0});I.observe(h),document.addEventListener("visibilitychange",w),w();const U=b=>{const l=h.getBoundingClientRect();l.width===0||l.height===0||p.setPointer((b.clientX-l.left)/l.width*2-1,-((b.clientY-l.top)/l.height*2-1))};return window.addEventListener("pointermove",U,{passive:!0}),()=>{window.removeEventListener("pointermove",U),document.removeEventListener("visibilitychange",w),I.disconnect(),z.disconnect(),p.dispose(),g.current=null,A(!1)}},[P,e]),c.useEffect(()=>{var s;d&&((s=g.current)==null||s.setVideo(r))},[d,r]),c.useEffect(()=>{if(!d)return;const s=g.current;s&&(s.setPalette(f),s.setAura(.16*n,o/110))},[d,f,n,o]),c.useEffect(()=>{if(!d)return;const s=g.current;if(s)return s.setProgress(t.get()),t.on("change",h=>s.setProgress(h))},[d,t]),c.useEffect(()=>{if(!d)return;const s=g.current;if(s){if(!a){s.setOpacity(1);return}return s.setOpacity(a.get()),a.on("change",h=>s.setOpacity(h))}},[d,a]),c.useEffect(()=>{v==null||v(d)},[d,v]),P?j.jsx("div",{ref:F,"aria-hidden":"true",className:m,children:j.jsx("canvas",{ref:R,className:"block size-full"})}):null}export{Ce as default};
