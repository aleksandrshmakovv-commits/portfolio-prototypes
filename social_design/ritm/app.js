const viewer=document.querySelector('#viewer');
const image=document.querySelector('#viewer-image');
const title=document.querySelector('#viewer-title');
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{image.src=button.dataset.image;image.alt=button.dataset.title;title.textContent=button.dataset.title;viewer.showModal();}));
document.querySelector('#close-viewer').addEventListener('click',()=>viewer.close());
viewer.addEventListener('click',event=>{if(event.target===viewer){const box=viewer.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)viewer.close();}});
