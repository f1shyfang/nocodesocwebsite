const canvas = document.querySelector('#sky');
const ctx = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
let phase = 'waxing';
let density = 240;
let width = 0, height = 0, time = 0, lastFrame = 0;
let immersive = false;
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
  const mobile = width < 650;
  const cx = width*(immersive ? .5 : mobile ? .52 : .742) + drift.x*12 + Math.sin(time*.18)*7;
  const cy = (immersive ? height*.47 : mobile ? 175 : height*.425) + drift.y*9 + Math.cos(time*.21)*6;
  const radius = immersive ? Math.min(width*.28,height*.3) : mobile ? 105 : Math.min(width*.163, height*.29);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for(let i=0;i<density;i++) {
    const star=stars[i];
    const x=(star.x*width + Math.sin(time*.06+star.offset)*8 + drift.x*(3+star.size*7)+width)%width;
    const y=(star.y*height + Math.cos(time*.05+star.offset)*6+drift.y*5+height)%height;
    if (Math.hypot(x-cx,y-cy)<radius*1.06) continue;
    let alpha=.18+star.size*.34+(Math.sin(time*star.speed+star.offset)+1)*.09;
    if(!immersive && (mobile ? y>345&&y<720 : x<width*.53&&y>105&&y<height-95)) alpha*=.21;
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
  const light=phase==='full'?0:phase==='crescent'?1.95:.75;
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
function frame(now){
  requestAnimationFrame(frame);
  if(document.hidden){lastFrame=now;return;}
  if(now-lastFrame<33)return;
  const dt=Math.min((now-lastFrame)/1000,.1);lastFrame=now;
  if(paused)return;
  time+=dt;drift.x+=(pointer.x-drift.x)*.04;drift.y+=(pointer.y-drift.y)*.04;
  draw();
}
function updatePause(){
  document.querySelector('#pause').setAttribute('aria-pressed',String(paused));
  document.querySelector('#pause-icon').textContent=paused?'▷':'Ⅱ';
  document.querySelector('#pause-text').textContent=paused?'Resume sky':'Pause sky';
}
document.querySelector('#pause').addEventListener('click',()=>{paused=!paused;updatePause();});
reducedMotion.addEventListener('change',event=>{paused=event.matches;updatePause();});
document.querySelectorAll('[data-phase]').forEach(button=>button.addEventListener('click',()=>{
  phase=button.dataset.phase;
  document.querySelectorAll('[data-phase]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  const names={crescent:['THE CRESCENT MOON','Even a sliver can light the dark.'],waxing:['THE WAXING MOON','A little more light, every night.'],full:['THE FULL MOON','A sky with nothing held back.']};
  document.querySelector('#moon-title').textContent=names[phase][0];
  document.querySelector('#moon-detail').textContent=names[phase][1];draw();
}));
document.querySelector('#density').addEventListener('input',event=>{density=Number(event.target.value);document.querySelector('#star-count').textContent=density;draw();});
window.addEventListener('pointermove',event=>{pointer={x:event.clientX/innerWidth*2-1,y:event.clientY/innerHeight*2-1};},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{pointer={x:0,y:0};});
const about=document.querySelector('#about');
document.querySelector('#about-open').addEventListener('click',()=>about.showModal());
document.querySelector('#about-close').addEventListener('click',()=>about.close());
document.querySelector('#back-to-sky').addEventListener('click',()=>about.close());
about.addEventListener('click',event=>{if(event.target===about){const r=about.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)about.close();}});
function setImmersive(value){
  immersive=value;document.body.classList.toggle('immersive',value);
  document.querySelector('#leave-immersive').hidden=!value;
  resize();(value?document.querySelector('#leave-immersive'):document.querySelector('#wander')).focus();
}
document.querySelector('#wander').addEventListener('click',()=>setImmersive(true));
document.querySelector('#leave-immersive').addEventListener('click',()=>setImmersive(false));
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&immersive)setImmersive(false);});
new ResizeObserver(resize).observe(canvas);
updatePause();resize();requestAnimationFrame(frame);
