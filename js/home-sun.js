/* Procedural solar surface. No images, dependencies, or network requests. */
(() => {
  'use strict';
  const canvas = document.getElementById('sunCanvas');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return; // The CSS sun remains visible when WebGL is unavailable.
  const vertex = `attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.0,1.0);}`;
  const fragment = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    float hash(vec3 p) {p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.09+vec3(11.2,7.1,3.4);a*=.49;}return v;}
    void main(){
      vec2 uv=gl_FragCoord.xy/u_resolution;
      float mobile=1.-step(600.,u_resolution.x);
      float radius=mix(min(u_resolution.x*.164,u_resolution.y*.245),u_resolution.x*.355,mobile);
      vec2 center=vec2(u_resolution.x*.5,u_resolution.y*mix(.295,.355,mobile));
      vec2 p=(gl_FragCoord.xy-center)/radius;
      float r=length(p),t=u_time*.035;
      vec3 color=vec3(.012,.01,.009);
      float angle=atan(p.y,p.x);
      float coronaNoise=fbm(vec3(cos(angle)*7.,sin(angle)*7.,t*.45));
      float corona=exp(-max(r-1.,0.)*(14.+coronaNoise*14.));
      float halo=exp(-r*r*.85)*.075;
      color+=vec3(1.,.185,.022)*halo;
      if(r>1.){
        float rays=pow(noise(vec3(cos(angle)*36.,sin(angle)*36.,t*.2)),3.);
        color+=vec3(1.,.22,.025)*corona*(.38+coronaNoise*.8);
        color+=vec3(.9,.12,.012)*rays*exp(-(r-1.)*7.)*.33;
        color+=vec3(.36,.06,.01)*exp(-(r-1.)*3.8)*.18;
      } else {
        float z=sqrt(max(0.,1.-r*r));
        vec3 n=vec3(p,z);
        vec3 q=n*4.2+vec3(t*.22,t*.09,0.);
        vec3 warp=vec3(fbm(q+vec3(0.,0.,t)),fbm(q+vec3(5.2,1.3,t)),fbm(q+vec3(2.7,9.1,t)));
        float plasma=fbm(q*3.8+warp*3.1);
        float granules=noise(n*170.+warp*6.);
        float filaments=abs(fbm(q*5.+warp*5.)-.48);
        float cells=smoothstep(.015,.17,filaments);
        float heat=clamp(plasma*.85+granules*.15,0.,1.);
        color=mix(vec3(.52,.045,.001),vec3(1.,.36,.025),smoothstep(.17,.5,heat));
        color=mix(color,vec3(1.,.73,.22),smoothstep(.45,.73,heat));
        color*=.63+.55*cells;
        color*=.58+.42*pow(z,.45);
        float spots=smoothstep(.70,.80,fbm(q*1.8+vec3(2.,4.,1.)));
        color*=1.-spots*.78;
        float edge=pow(1.-z,5.);
        color+=vec3(1.,.38,.065)*edge*.55;
        float fine=noise(n*380.);
        color+=vec3(.14,.048,.005)*fine;
      }
      // Sparse stars stay subtle so the sun is the single visual focus.
      vec2 starCell=floor(gl_FragCoord.xy/3.);
      float star=step(.9996,hash(vec3(starCell,1.)))*(.16+.35*hash(vec3(starCell,3.)));
      color+=vec3(star)*smoothstep(1.35,2.4,r);
      color*=smoothstep(0.,.1,uv.y);
      gl_FragColor=vec4(color,1.);
    }`;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
    return shader;
  }
  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, 'u_resolution');
  const time = gl.getUniformLocation(program, 'u_time');
  let inView = true, frame = 0, last = 0;
  const start = performance.now();
  function resize() {
    // Cap the drawing buffer to keep the animated hero light on mobile GPUs.
    const scale = Math.min(1, 1440 / canvas.clientWidth);
    canvas.width = Math.round(canvas.clientWidth * scale);
    canvas.height = Math.round(canvas.clientHeight * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    draw(performance.now());
  }
  function draw(now) {
    gl.uniform1f(time, reducedMotion.matches ? 0 : (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function tick(now) {
    frame = 0;
    if (!inView || document.hidden || reducedMotion.matches) return;
    if (now - last >= 65) { draw(now); last = now; }
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (!document.hidden && inView) {
      draw(performance.now());
      if (!reducedMotion.matches) frame = requestAnimationFrame(tick);
    }
  }
  resize();
  canvas.parentElement.classList.add('is-ready');
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; resume(); }).observe(canvas);
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener('change', resume);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    canvas.parentElement.classList.remove('is-ready');
  });
})();
