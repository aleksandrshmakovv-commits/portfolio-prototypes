const viewer = document.querySelector('#viewer');
const image = document.querySelector('#viewer-image');
const title = document.querySelector('#viewer-title');
document.querySelectorAll('[data-image]').forEach(button => {
  button.addEventListener('click', () => {
    image.src = button.dataset.image;
    image.alt = button.querySelector('img').alt;
    title.textContent = button.dataset.title;
    viewer.showModal();
  });
});
document.querySelector('#close-viewer').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => {
  if (event.target !== viewer) return;
  const bounds = viewer.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
});
