const about = document.querySelector('#about');
document.querySelector('#about-open').addEventListener('click', () => about.showModal());
document.querySelector('#about-close').addEventListener('click', () => about.close());
document.querySelector('#about-done').addEventListener('click', () => about.close());
about.addEventListener('click', event => {
  if (event.target !== about) return;
  const bounds = about.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) about.close();
});
