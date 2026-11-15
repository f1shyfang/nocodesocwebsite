const photos = [...document.querySelectorAll('.event-photo img')];
const viewer = document.querySelector('#photo-viewer');
const image = viewer.querySelector('.viewer-image');
const count = viewer.querySelector('.viewer-count');
let current = 0;
let opener;
let swipeStart = null;

// Track only single-finger gestures; leave pinching and zoomed-image panning native.
viewer.addEventListener('touchstart', event => {
  swipeStart = null;
  if (event.touches.length !== 1 || event.target.closest('button') ||
      (window.visualViewport?.scale ?? 1) > 1) return;
  const touch = event.touches[0];
  swipeStart = { x: touch.clientX, y: touch.clientY, id: touch.identifier };
}, { passive: true });
viewer.addEventListener('touchmove', event => {
  if (event.touches.length !== 1) swipeStart = null;
}, { passive: true });
viewer.addEventListener('touchcancel', () => { swipeStart = null; });
viewer.addEventListener('touchend', event => {
  const start = swipeStart;
  swipeStart = null;
  if (!start || event.touches.length || (window.visualViewport?.scale ?? 1) > 1) return;
  const touch = [...event.changedTouches].find(item => item.identifier === start.id);
  if (!touch) return;
  const dx = touch.clientX - start.x;
  const dy = touch.clientY - start.y;
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  // Suppress the synthetic click so a swipe on the backdrop doesn't close it.
  event.preventDefault();
  showPhoto(current + (dx < 0 ? 1 : -1));
}, { passive: false });

function showPhoto(index) {
  current = (index + photos.length) % photos.length;
  const photo = photos[current];
  const source = new URL(photo.src);
  // Remove thumbnail resizing so the viewer receives the uncropped original.
  for (const key of ['w', 'h', 'fit', 'q']) source.searchParams.delete(key);
  image.src = source.href;
  image.alt = photo.alt;
  count.textContent = `${current + 1} / ${photos.length}`;
}

photos.forEach((photo, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'photo-open';
  button.setAttribute('aria-label', `Open photo ${index + 1}: ${photo.alt}`);
  button.setAttribute('aria-haspopup', 'dialog');
  photo.replaceWith(button);
  button.append(photo);
  button.addEventListener('click', () => {
    opener = button;
    showPhoto(index);
    viewer.showModal();
    document.body.classList.add('photo-viewer-open');
  });
});

viewer.querySelector('.viewer-previous').addEventListener('click', () => showPhoto(current - 1));
viewer.querySelector('.viewer-next').addEventListener('click', () => showPhoto(current + 1));
viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showPhoto(current + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
viewer.addEventListener('click', event => {
  if (event.target === viewer) viewer.close();
});
viewer.addEventListener('close', () => {
  swipeStart = null;
  document.body.classList.remove('photo-viewer-open');
  image.removeAttribute('src');
  opener?.focus();
});
