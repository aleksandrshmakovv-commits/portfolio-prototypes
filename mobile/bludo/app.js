(() => {
 const main=document.querySelector('#main'),nav=document.querySelector('#bottom-nav');
 const state={category:'Все',search:'',address:BludoStore.order()?.address||''};let toastTimer;
 function toast(text){const node=document.querySelector('#toast');node.textContent=text;node.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.hidden=true,2200);}
 function render(scroll=true){
  const route=location.hash.slice(1)||'catalog';
  main.innerHTML=route==='cart'?BludoUI.cart():route==='checkout'?BludoUI.checkout(state.address):route==='order'?BludoUI.order():BludoUI.catalog(state);
  nav.innerHTML=BludoUI.nav(route==='checkout'?'cart':route);
  document.title=`${route==='cart'?'Корзина':route==='checkout'?'Оформление':route==='order'?'Заказ':'Каталог'} — блюдо`;
  if(scroll)window.scrollTo({top:0,behavior:'instant'});
 }
 document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-category')){state.category=b.dataset.category;render(false);document.querySelector(`[data-category="${state.category}"]`)?.focus({preventScroll:true});}
  else if(b.hasAttribute('data-add')){const ok=BludoStore.add(b.dataset.add);const position=window.scrollY;render(false);window.scrollTo(0,position);document.querySelector(`[data-add="${b.dataset.add}"]`)?.focus({preventScroll:true});toast(ok?'Добавлено в корзину':'До 9 порций одного блюда');}
  else if(b.hasAttribute('data-step')){const id=b.dataset.id,step=b.dataset.step;BludoStore.step(id,Number(step));render(false);document.querySelector(`[data-step="${step}"][data-id="${id}"]:not(:disabled)`)?.focus({preventScroll:true});}
  else if(b.hasAttribute('data-remove')){BludoStore.remove(b.dataset.remove);render(false);}
  else if(b.hasAttribute('data-clear-search')){state.search='';state.category='Все';render(false);}
  else if(b.hasAttribute('data-advance')){BludoStore.advance();render(false);document.querySelector('[data-advance]')?.focus({preventScroll:true});}
  else if(b.hasAttribute('data-address')){const d=document.querySelector('#address-dialog');d.querySelector('input').value=state.address;d.showModal();d.querySelector('input').focus();}
  else if(b.hasAttribute('data-close')){b.closest('dialog').close();}
  else if(b.hasAttribute('data-detail')){
   const p=BludoStore.product(b.dataset.detail);const detail=document.querySelector('#food-detail');detail.replaceChildren();
   const top=document.createElement('div');top.className='dialog-head';const name=document.createElement('h2');name.textContent=p.name;const close=document.createElement('button');close.type='button';close.dataset.close='';close.setAttribute('aria-label','Закрыть');close.textContent='×';top.append(name,close);
   const img=document.createElement('img');img.src=p.image;img.alt=p.name;img.width=1024;img.height=1024;const description=document.createElement('p');description.textContent=p.description;const weight=document.createElement('small');weight.textContent=p.weight;
   const add=document.createElement('button');add.className='primary';add.type='button';add.textContent='Добавить за '+BludoMoney(p.price);add.addEventListener('click',()=>{const ok=BludoStore.add(p.id);document.querySelector('#food-dialog').close();render(false);toast(ok?'Добавлено в корзину':'До 9 порций одного блюда');});detail.append(top,img,description,weight,add);document.querySelector('#food-dialog').showModal();
  }
 });
 main.addEventListener('input',event=>{if(event.target.closest('#checkout-form'))document.querySelector('#checkout-error').textContent='';if(event.target.id!=='food-search')return;const pos=event.target.selectionStart;state.search=event.target.value;render(false);const input=document.querySelector('#food-search');input.focus({preventScroll:true});try{input.setSelectionRange(pos,pos);}catch{}});
 document.querySelector('#address-form').addEventListener('submit',event=>{event.preventDefault();const f=event.target,field=f.elements.address,value=field.value.trim();if(value.length<5){field.setCustomValidity('Укажите улицу и дом.');field.reportValidity();return;}field.setCustomValidity('');state.address=value;document.querySelector('#address-dialog').close();render(false);});
 document.querySelector('#address-form input').addEventListener('input',event=>event.target.setCustomValidity(''));
 main.addEventListener('submit',event=>{if(event.target.id!=='checkout-form')return;event.preventDefault();const f=event.target,name=f.elements.name.value.trim(),address=f.elements.address.value.trim(),digits=f.elements.phone.value.replace(/\D/g,'');
  if(name.length<2||address.length<5||digits.length<10||digits.length>15){document.querySelector('#checkout-error').textContent='Проверьте имя, телефон (10–15 цифр) и полный адрес.';return;}
  state.address=address;const order=BludoStore.checkout(address);if(order){location.hash='order';if(!BludoStore.persistent())toast('Заказ доступен в текущей сессии; сохранение браузера отключено.');}
 });
 addEventListener('hashchange',()=>render());render();
 if('serviceWorker' in navigator&&['http:','https:'].includes(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
