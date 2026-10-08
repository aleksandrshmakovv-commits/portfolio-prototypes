const viewer = document.querySelector('#viewer');
const picture = document.querySelector('#viewer-image');
const title = document.querySelector('#viewer-title');
document.querySelectorAll('[data-image]').forEach(button => {
  button.addEventListener('click', () => {
    picture.src = button.dataset.image;
    picture.alt = button.querySelector('img').alt;
    title.textContent = button.dataset.title;
    viewer.showModal();
  });
});
document.querySelector('#close-viewer').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => {
  const r = viewer.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) viewer.close();
});
