const photos = [...document.querySelectorAll('.event-photo img')];
const viewer = document.querySelector('#photo-viewer');
const image = viewer.querySelector('.viewer-image');
const count = viewer.querySelector('.viewer-count');
let current = 0;
let opener;

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
  document.body.classList.remove('photo-viewer-open');
  image.removeAttribute('src');
  opener?.focus();
});
