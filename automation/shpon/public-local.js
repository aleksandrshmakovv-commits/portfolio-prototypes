/* Browser-only scripted furniture brief. No Telegram, API, persistence or orders. */
(() => {
  const fields = ['product','dimensions','material','budget','deadline','reference'];
  const titles = {product:'Изделие',dimensions:'Размеры',material:'Материал',budget:'Бюджет',deadline:'Срок',reference:'Пример'};
  const prompts = {
    product:['1/6 · Какое изделие хотите обсудить?', ['Шкаф','Стол','Стеллаж']],
    dimensions:['2/6 · Укажите ширину × высоту × глубину в мм. Например: 1200 × 2200 × 600.', ['1200 × 2200 × 600','Размеры обсудим']],
    material:['3/6 · Какой материал предпочитаете?', ['Дуб','Берёза','Материал обсудим']],
    budget:['4/6 · Какой ориентировочный бюджет? Сумма в рублях или «Бюджет обсудим».', ['80 000 ₽','150 000 ₽','Бюджет обсудим']],
    deadline:['5/6 · Когда понадобится изделие?', ['Через 2 месяца','Без срочности','Срок обсудим']],
    reference:['6/6 · Добавьте модельный пример кнопкой «Пример мебели» или пропустите.', ['Без примера']]
  };
  const reply = (text,options=[]) => ({replies:[{text,reply_markup:{keyboard:options.map(text=>[{text}])}}]});
  function create() {
    let step='product', draft={}, editing=false, completed=false;
    const summary=()=> 'Проверьте демонстрационный бриф:\n\n'+fields.map(key=>titles[key]+': '+draft[key]).join('\n')+'\n\nЭто модельные данные. Подтверждение только завершает сценарий в этой вкладке; заявка и уведомление не отправляются.';
    const question=()=>reply(prompts[step][0],prompts[step][1]);
    const reset=()=>{step='product';draft={};editing=false;completed=false;return reply('Здравствуйте! Это публичный демо-чат ШПОН. Данные живут только в памяти вкладки. Используйте вымышленные пожелания; имя, телефон и адрес не нужны.\n\n'+prompts.product[0],prompts.product[1]);};
    function send(raw='',photo=false) {
      const text=String(raw).trim();
      if (text==='/start'||text==='Заполнить заново'||text==='Начать заново') return reset();
      if (completed) return reply('Демо-бриф уже подтверждён в этой вкладке. Внешних отправок нет.', ['Заполнить заново']);
      if (step==='review') {
        if(text==='Подтвердить бриф'){completed=true;step='done';return reply('Демо-бриф подтверждён ✓\nСценарий завершён только в текущей вкладке. Ничего не сохранено на сервере, не передано в Telegram и не добавлено на доску мастерской.', ['Заполнить заново']);}
        if(text==='Изменить данные'){step='edit';return reply('Какое поле изменить?',fields.map(key=>titles[key]));}
        return reply('Проверьте бриф и выберите действие.', ['Подтвердить бриф','Изменить данные','Заполнить заново']);
      }
      if (step==='edit') {
        const key=fields.find(key=>titles[key]===text);if(!key)return reply('Выберите поле кнопкой.',fields.map(key=>titles[key]));
        step=key;editing=true;return question();
      }
      if (photo && step!=='reference') return reply('Модельный пример добавляется на шаге 6. Сначала ответьте на текущий вопрос.',prompts[step][1]);
      if (!photo && (!text || text.length>180)) return reply('Введите ответ от 1 до 180 символов.',prompts[step][1]);
      if (!photo && /@|\b[\w.+-]+@[\w.-]+|(?:\+7|\+\d{1,3})[\s(\d)-]{8,}/.test(text)) return reply('Контактные данные в публичном демо не нужны. Выберите модельный ответ кнопкой.',prompts[step][1]);
      let value=photo?'Модельная схема шкафа':text;
      if (step==='dimensions' && text!=='Размеры обсудим') {
        const numbers=text.split(/[×xх*;,\s]+/i).filter(Boolean);
        if(numbers.length!==3 || numbers.some(v=>!/^\d{1,5}$/.test(v)||Number(v)<10||Number(v)>10000))return reply('Нужны три размера от 10 до 10 000 мм: 1200 × 2200 × 600.',prompts.dimensions[1]);
        value=numbers.map(Number).join(' × ')+' мм';
      }
      if (step==='budget' && text!=='Бюджет обсудим') {
        const number=text.replace(/[\s₽]/g,'');if(!/^\d+$/.test(number)||Number(number)<1000||Number(number)>10000000)return reply('Бюджет: от 1 000 до 10 000 000 ₽ или «Бюджет обсудим».',prompts.budget[1]);
        value=Number(number).toLocaleString('ru-RU')+' ₽';
      }
      draft[step]=value;
      if(editing||step==='reference'){editing=false;step='review';return reply(summary(),['Подтвердить бриф','Изменить данные','Заполнить заново']);}
      step=fields[fields.indexOf(step)+1];return question();
    }
    return Object.freeze({send,snapshot:()=>({step,completed,draft:{...draft}})});
  }
  globalThis.ShponPublicDemo=Object.freeze({create});
})();
