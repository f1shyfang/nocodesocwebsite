const canvas = document.querySelector('#sky');
const ctx = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
const density = 240;
let width = 0, height = 0, time = 0, lastFrame = 0;
let pointer = { x: 0, y: 0 }, drift = { x: 0, y: 0 };
let seed = 85731;
function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
const stars = Array.from({ length: 600 }, () => ({ x: random(), y: random(), size: random(), speed: .3 + random(), offset: random() * Math.PI * 2, char: random() > .82 ? '+' : random() > .6 ? '*' : '.' }));
const craters = Array.from({ length: 40 }, () => ({ x: random() * 1.6 - .8, y: random() * 1.6 - .8, r: .035 + random() * .14, depth: .2 + random() * .5 }));
const moonCells = [];
for (let row = -33; row <= 33; row++) {
  for (let col = -57; col <= 57; col++) {
    const x = col / 57, y = row / 33;
    const radius = x*x + y*y;
    if (radius > 1) continue;
    const z = Math.sqrt(1 - radius);
    let texture = .72 + Math.sin(x*17 + y*8)*.07 + Math.cos(y*21-x*12)*.06;
    for (const crater of craters) {
      const d = Math.hypot(x-crater.x, y-crater.y) / crater.r;
      if (d < 1.5) texture -= Math.exp(-d*d*3)*crater.depth;
      if (d > .8 && d < 1.15) texture += .11;
    }
    texture += (random()-.5)*.24;
    moonCells.push({x,y,z,texture,noise:random()});
  }
}
function resize() {
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width; height = bounds.height;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width*ratio); canvas.height = Math.round(height*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);
  draw();
}
function draw() {
  ctx.clearRect(0,0,width,height);
  const cx = width*.5 + drift.x*12 + Math.sin(time*.18)*7;
  const cy = height*.48 + drift.y*9 + Math.cos(time*.21)*6;
  const radius = Math.min(width*.25, height*.32, 235);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for(let i=0;i<density;i++) {
    const star=stars[i];
    const x=(star.x*width + Math.sin(time*.06+star.offset)*8 + drift.x*(3+star.size*7)+width)%width;
    const y=(star.y*height + Math.cos(time*.05+star.offset)*6+drift.y*5+height)%height;
    if (Math.hypot(x-cx,y-cy)<radius*1.06) continue;
    let alpha=.18+star.size*.34+(Math.sin(time*star.speed+star.offset)+1)*.09;
    ctx.fillStyle=`rgba(209,219,204,${alpha})`;
    ctx.font=`${star.size>.93?15:star.size>.7?11:9}px monospace`;
    ctx.fillText(star.char,x,y);
  }
  // The orbit is a character field as well, not a stroked illustration.
  ctx.font='8px monospace';
  for(let i=0;i<150;i++) {
    const angle=i/150*Math.PI*2 + time*.012;
    const ox=Math.cos(angle)*radius*1.48;
    const oy=Math.sin(angle)*radius*.32;
    const tilt=-.43;
    const x=cx+ox*Math.cos(tilt)-oy*Math.sin(tilt);
    const y=cy+ox*Math.sin(tilt)+oy*Math.cos(tilt);
    if(Math.hypot(x-cx,y-cy)<radius*1.025)continue;
    ctx.fillStyle='rgba(171,184,165,.23)';ctx.fillText('.',x,y);
  }
  const glyphs=' .,:;+=*#%@';
  const light=.75;
  const fontSize=radius/33*1.07;
  ctx.font=`${fontSize}px "Courier New", monospace`;
  for(const cell of moonCells) {
    const lum=cell.x*Math.sin(light)+cell.z*Math.cos(light);
    const lit=lum>0;
    const shade=lit?Math.max(.12,cell.texture*(.52+lum*.48)):.05+cell.texture*.06;
    const index=Math.min(glyphs.length-1,Math.max(1,Math.floor(shade*(glyphs.length-1))));
    const alpha=lit?.36+shade*.62:.1;
    ctx.fillStyle=`rgba(219,225,203,${alpha})`;
    ctx.fillText(lit?glyphs[index]:'.',cx+cell.x*radius,cy+cell.y*radius);
  }
  // A rare, quiet shooting star crosses the upper sky.
  const meteor=time%19;
  if(meteor>15&&meteor<16.6){
    const progress=(meteor-15)/1.6;
    ctx.font='10px monospace';
    for(let i=0;i<8;i++){
      ctx.fillStyle=`rgba(218,226,208,${(1-i/8)*Math.sin(progress*Math.PI)*.6})`;
      ctx.fillText(i===0?'+':'.',width*.2+progress*width*.3-i*7,height*.08+progress*90-i*3);
    }
  }
}
let animationFrame = 0;
function frame(now) {
  animationFrame = 0;
  if (paused || document.hidden) return;
  animationFrame = requestAnimationFrame(frame);
  if (now - lastFrame < 33) return;
  const dt = Math.min((now - lastFrame) / 1000, .1);
  lastFrame = now;
  time += dt;
  drift.x += (pointer.x - drift.x) * .04;
  drift.y += (pointer.y - drift.y) * .04;
  draw();
}
function syncMotion() {
  paused = reducedMotion.matches;
  cancelAnimationFrame(animationFrame);
  lastFrame = performance.now();
  draw();
  if (!paused && !document.hidden) animationFrame = requestAnimationFrame(frame);
}
reducedMotion.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
window.addEventListener('pointermove', event => {
  pointer = { x: event.clientX / innerWidth * 2 - 1, y: event.clientY / innerHeight * 2 - 1 };
}, { passive: true });
document.documentElement.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 }; });
new ResizeObserver(resize).observe(canvas);
resize();
syncMotion();
