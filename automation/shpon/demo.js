(() => {
  const messages=document.querySelector('#messages'), replies=document.querySelector('#quick-replies');
  const form=document.querySelector('#message-form'), field=document.querySelector('#message-input');
  const engine=ShponPublicDemo.create();
  function bubble(text,side){const node=document.createElement('div');node.className='message '+side;const copy=document.createElement('p');copy.textContent=text;node.append(copy);messages.append(node);messages.scrollTop=messages.scrollHeight;}
  function send(text,photo=false){
    document.querySelector('#chat-error').textContent='';
    if(text!=='/start'&&!photo)bubble(text,'user');
    if(photo){const node=document.createElement('div');node.className='message user';const image=document.createElement('img');image.src='assets/reference.svg';image.alt='Модельная схема шкафа';node.append(image);messages.append(node);}
    const data=engine.send(text,photo);replies.replaceChildren();
    for(const item of data.replies){bubble(item.text,'bot');for(const row of item.reply_markup?.keyboard||[])for(const option of row){const button=document.createElement('button');button.type='button';button.textContent=option.text;button.addEventListener('click',()=>send(option.text));replies.append(button);}}
    field.value='';document.querySelector('#attach-example').disabled=engine.snapshot().step!=='reference';
    document.querySelector('#chat-status').textContent=engine.snapshot().completed?'Демо завершено · без отправки':'Демо в браузере · без Telegram';
  }
  form.addEventListener('submit',event=>{event.preventDefault();if(field.value.trim())send(field.value);});
  document.querySelector('#attach-example').addEventListener('click',()=>send('',true));
  document.querySelector('#restart-chat').addEventListener('click',()=>send('Заполнить заново'));
  send('/start');
})();
