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
// Sample the supplied logo once so its crescent, stippling, and lettering
// are all rendered with ASCII glyphs rather than a raster overlay.
const logoCells = [];
const logoColumns = 180;
const logoRows = 112;
const logo = new Image();
logo.addEventListener('load', () => {
  const sample = document.createElement('canvas');
  sample.width = logoColumns;
  sample.height = logoRows;
  const sampleContext = sample.getContext('2d', { willReadFrequently: true });
  sampleContext.drawImage(logo, 0, 0, logoColumns, logoRows);
  const pixels = sampleContext.getImageData(0, 0, logoColumns, logoRows).data;
  const glyphs = '.:+=*#@';
  for (let row = 0; row < logoRows; row++) {
    for (let col = 0; col < logoColumns; col++) {
      // Give the small Society line its own legible ASCII bitmap below.
      const sourceX = (col + .5) / logoColumns;
      const sourceY = (row + .5) / logoRows;
      if (sourceX > .37 && sourceX < .62 && sourceY > .55 && sourceY < .61) continue;
      const index = (row * logoColumns + col) * 4;
      const brightness = (pixels[index] * .2126 + pixels[index + 1] * .7152 + pixels[index + 2] * .0722) / 255 * pixels[index + 3] / 255;
      if (brightness < .055) continue;
      logoCells.push({
        x: (col + .5) / logoColumns - .5,
        y: (row + .5) / logoRows - .44,
        glyph: glyphs[Math.min(glyphs.length - 1, Math.floor(brightness * glyphs.length))],
        alpha: .25 + brightness * .75,
      });
    }
  }
  canvas.dataset.logoReady = 'true';
  draw();
});
logo.src = new URL('./assets/no-code-society-logo.png', import.meta.url).href;
const societyLetters = [
  ['01111','10000','10000','01110','00001','00001','11110'],
  ['00000','00000','01110','10001','10001','10001','01110'],
  ['00000','00000','01111','10000','10000','10000','01111'],
  ['00100','00000','01100','00100','00100','00100','01110'],
  ['00000','00000','01110','10001','11111','10000','01111'],
  ['00100','00100','01110','00100','00100','00100','00011'],
  ['00000','00000','10001','10001','01111','00001','01110'],
];
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
  const radius = Math.min(width*.29, height*.29, 225);
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
  const logoSize = radius * 2.85;
  const fontSize = logoSize / logoRows * 1.08;
  ctx.font = `${fontSize}px "Courier New", monospace`;
  for (const cell of logoCells) {
    ctx.fillStyle = `rgba(232,236,226,${cell.alpha})`;
    ctx.fillText(cell.glyph, cx + cell.x * logoSize, cy + cell.y * logoSize);
  }
  // Hand-set ASCII lettering keeps the small subtitle readable on phones.
  const letterStep = logoSize * .0048;
  ctx.font = `${letterStep * 1.6}px "Courier New", monospace`;
  ctx.fillStyle = 'rgba(232,236,226,.95)';
  societyLetters.forEach((letter, letterIndex) => {
    letter.forEach((row, y) => {
      [...row].forEach((pixel, x) => {
        if (pixel === '1') ctx.fillText('@', cx + (letterIndex * 7 + x - 23) * letterStep, cy + logoSize * .138 + (y - 3) * letterStep);
      });
    });
  });
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
