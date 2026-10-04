(function () {
  'use strict';
  const data = window.GlobalData, core = window.GlobalCore;
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const work = new Map();
  let state = core.createState(), selectedId = data.tickets[0].id, view = 'tickets', filter = 'all', pending = null, toastTimer;
  const ticket = () => data.tickets.find(item => item.id === selectedId);
  const entry = () => { if (!work.has(selectedId)) work.set(selectedId, { message: ticket().message, result: null, draft: '' }); return work.get(selectedId); };
  const closed = id => state.events.some(event => event.ticketId === id);
  const initials = name => name.split(' ').slice(0,2).map(word => word[0]).join('');
  const names = {access:'Доступ',homework:'Домашние задания',certificate:'Сертификаты',refund:'Возвраты',identity:'Уточнение данных',unknown:'Нестандартный вопрос'};
  const actionNames = {restore_access:'Восстановление модельного доступа',reply:'Демо-ответ ученику',escalate:'Локальная передача сотруднику'};
  function notify(text) { clearTimeout(toastTimer); $('#toast').textContent=text; $('#toast').hidden=false; toastTimer=setTimeout(()=>$('#toast').hidden=true,2200); }
  function renderInbox() {
    const query=core.normalize($('#ticket-search').value), done=data.tickets.filter(item=>closed(item.id)).length;
    $('#count-all').textContent=data.tickets.length; $('#count-open').textContent=data.tickets.length-done; $('#count-closed').textContent=done;
    document.querySelectorAll('[data-filter]').forEach(button=>{button.classList.toggle('selected',button.dataset.filter===filter);button.setAttribute('aria-pressed',String(button.dataset.filter===filter));});
    const tickets=data.tickets.filter(item=> filter==='all'||(filter==='closed' ? closed(item.id) : !closed(item.id))).filter(item=>{
      const student=data.students.find(student=>student.id===item.studentId);
      return core.normalize([item.id,item.subject,item.message,student?.name||'Новый ученик'].join(' ')).includes(query);
    });
    $('#ticket-list').innerHTML=tickets.map(item=>{
      const student=data.students.find(student=>student.id===item.studentId), course=data.courses.find(course=>course.id===student?.courseId), name=student?.name||'Новый ученик';
      return `<button class="ticket-row${item.id===selectedId?' selected':''}" data-ticket="${item.id}" aria-pressed="${item.id===selectedId}"><span class="avatar" aria-hidden="true">${esc(initials(name))}</span><span class="row-text"><span class="row-title"><strong>${esc(item.subject)}</strong><small>${item.time}</small></span><p>${esc(name)}</p><p class="excerpt">${esc(item.message)}</p><span class="course-tag">${closed(item.id)?'Готово в демо':esc(course?.title||'Поиск ученика')}</span></span></button>`;
    }).join('')||'<p class="empty-note">Обращений по этому фильтру нет.</p>';
    $('#event-count').textContent='Демо-действий: '+state.events.length;
  }
  function renderTicket() {
    const t=ticket(), w=entry(), student=data.students.find(student=>student.id===t.studentId), course=data.courses.find(course=>course.id===student?.courseId), name=student?.name||'Новый ученик', done=closed(t.id);
    const access=state.accessOverrides[student?.id] || student?.access;
    $('#ticket-detail').innerHTML=`<div class="ticket-meta"><span>#${t.id}</span><span class="state">${done?'Готово в демо':'Открыто'}</span><time>${t.time} · Демо-день</time></div><h2>${esc(t.subject)}</h2><div class="student-block"><span class="avatar" aria-hidden="true">${esc(initials(name))}</span><div><strong>${esc(name)}</strong><small>${student?esc(student.id)+' · Модельный ученик':'Запись пока не найдена'}</small></div></div><div class="course-info"><span>Курс: ${esc(course?.title||'Не определён')}</span><span>${student ? 'Доступ: '+(access==='active'?'открыт':'закрыт') : 'Требуется уточнение'}</span></div><div class="message-box"><label for="student-message">Сообщение ученика · можно изменить для проверки</label><textarea id="student-message" maxlength="6000" aria-label="Сообщение ученика"></textarea></div><button class="primary" id="analyze"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/></svg>Разобрать обращение</button><div class="draft-heading"><h3>Черновик ответа</h3><button class="text-button" id="copy-draft" ${!w.result?'disabled':''}>Скопировать</button></div><div class="draft-box"><div class="draft-top"><span>Текст для проверки оператором</span>${w.result?.sources[0]?`<button class="source-link" data-source="${w.result.sources[0].id}">Правило ↗</button>`:''}</div><textarea id="draft" aria-label="Черновик ответа" maxlength="6000" placeholder="После разбора здесь появится ответ по модельным данным и правилам." ${!w.result?'disabled':''}></textarea></div><div class="actions"><button class="primary" id="approve" ${!w.result||done?'disabled':''}>Подтвердить в демо</button><button class="secondary" id="escalate" ${!w.result||done?'disabled':''}>Передать сотруднику</button></div><p class="local-note">Проверка и подтверждение обязательны. Все действия — только в этой вкладке, без реальных отправок.</p>${done?'<div class="result-notice" role="status">Локальное действие подтверждено. Повторное выполнение заблокировано. '+esc(actionNames[state.events.find(event=>event.ticketId===t.id).type])+'.</div>':''}`;
    $('#student-message').value=w.message; $('#draft').value=w.draft;
    renderTrace();
  }
  function summary(step) {
    const o=step.output;
    switch(step.tool){
      case 'classify_rules': return 'Тема: '+(names[o.category]||o.category);
      case 'lookup_student': return o.found?'Ученик найден: '+o.student.name:'Запись не найдена';
      case 'route_policy': return 'Маршрут: '+(names[o.category]||o.category);
      case 'search_knowledge': return o.matches.length?'Найдено правил: '+o.matches.length:(o.policyId?'Правило передачи: '+o.policyId:'Подходящего источника нет');
      case 'check_course_access': return 'Оплата: '+(o.payment==='paid'?'подтверждена':'не подтверждена')+' · Доступ: '+(o.access==='blocked'?'закрыт':'открыт');
      case 'check_completion': return 'Принято работ: '+o.accepted+'/'+o.total+' · Финал: '+(o.finalAccepted?'принят':'не принят');
      case 'prepare_escalation': return 'Очередь: '+o.queue;
      case 'prepare_draft': return 'Подготовлен черновик. Требуется подтверждение.';
      default: return 'Локальная проверка выполнена';
    }
  }
  function renderTrace() {
    const result=entry().result;
    $('#trace').innerHTML=result ? result.steps.map((step,index)=>`<article class="step"><span class="step-number">${index+1}</span><h3>${esc(step.title)}</h3><p class="tool-name">${esc(step.tool)}</p><details><summary>${esc(summary(step))}</summary><pre>${esc(JSON.stringify({вход:step.input,результат:step.output},null,2))}</pre></details></article>`).join('') : '<p class="empty-note">Запустите разбор — здесь появятся реальные результаты локальных проверок.</p>';
    $('#sources').innerHTML=result ? `<h3 class="sources-heading">Основание ответа</h3>${result.sources.map(source=>`<button class="source-card" data-source="${source.id}">${esc(source.id)} · ${esc(source.title)} ↗</button>`).join('')}<p class="local-note">${esc(result.reason)}</p>` : '';
  }
  function renderKnowledge() {
    const query=core.normalize($('#kb-search').value);
    const docs=data.knowledge.filter(doc=>core.normalize(doc.title+' '+doc.text).includes(query));
    $('#knowledge-list').innerHTML=docs.map(doc=>`<article class="knowledge-row"><p class="small-label">${doc.id} · Модельное правило</p><h3>${esc(doc.title)}</h3><p>${esc(doc.text)}</p><button class="source-link" data-source="${doc.id}">Открыть точную цитату ↗</button></article>`).join('')||'<p class="empty-note">Правил по этому запросу нет.</p>';
  }
  function showView(next) {
    view=next; $('#inbox').hidden=view!=='tickets';
    $('.shell').classList.toggle('wide-view',view!=='tickets');
    ['tickets','knowledge','connection'].forEach(key=>{$('#'+key+'-view').hidden=key!==view;});
    document.querySelectorAll('[data-view]').forEach(button=>{button.classList.toggle('selected',button.dataset.view===view);button.setAttribute('aria-pressed',String(button.dataset.view===view));});
    if(view==='knowledge')renderKnowledge();
  }
  function analyze(forceEscalate=false) {
    const w=entry();
    try { const result=core.analyze({ticketId:selectedId,message:w.message,forceEscalate}); w.result=result;w.draft=result.draft;renderTicket();return result; }
    catch(error){notify(error.message);return null;}
  }
  function requestApproval(manual=false) {
    const w=entry(); if(!w.result||closed(selectedId))return;
    try {
      const result=manual ? core.analyze({ticketId:selectedId,message:w.message,forceEscalate:true}) : w.result;
      const draft=manual ? result.draft : w.draft;
      if(!draft.trim())return notify('Проверьте текст ответа: он пока пустой.');
      pending={result,draft};
      $('#confirm-title').textContent=actionNames[result.action.type];
      $('#confirm-description').textContent=result.reason;
      $('#confirm-preview').textContent=(result.action.queue?'Очередь: '+result.action.queue+'\n\n':'')+draft;
      $('#confirm-dialog').showModal();
    }catch(error){notify(error.message);}
  }
  function confirm() {
    if(!pending)return;
    try {
      const applied=core.commit(pending.result,state,{draft:pending.draft}); state=applied.state;
      const w=entry(); w.result=pending.result;w.draft=pending.draft;
      $('#confirm-dialog').close(); pending=null; renderInbox();renderTicket();
      notify(applied.duplicate?'Это действие уже выполнено в демо.':'Подтверждено только в локальной демонстрации.');
    }catch(error){notify(error.message);}
  }
  function source(id) {
    const doc=data.knowledge.find(doc=>doc.id===id);if(!doc)return;
    $('#source-id').textContent=doc.id;$('#source-title').textContent=doc.title;$('#source-quote').textContent=doc.text;$('#source-dialog').showModal();
  }
  function exportJSON() {
    const w=entry();
    const report={school:'Global',mode:'Фиксированный локальный сценарий; модель не подключена',localOnly:true,modelConnected:false,customerAPI:'Отдельная будущая интеграция; оплачивается заказчиком',ticket:ticket(),message:w.message,analysis:w.result,operatorDraft:w.draft,state};
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='global-'+selectedId+'-demo.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);notify('Демо-разбор выгружен в JSON.');
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.ticket){selectedId=button.dataset.ticket;renderInbox();renderTicket();return;}
    if(button.dataset.view){showView(button.dataset.view);return;}
    if(button.dataset.filter){filter=button.dataset.filter;renderInbox();return;}
    if(button.dataset.source){source(button.dataset.source);return;}
    switch(button.id){
      case 'analyze': analyze();break;
      case 'approve': requestApproval();break;
      case 'escalate': requestApproval(true);break;
      case 'confirm-action':confirm();break;
      case 'copy-draft':try{await navigator.clipboard.writeText(entry().draft);notify('Черновик скопирован.');}catch{ $('#draft').focus();$('#draft').select();notify('Выделен текст ответа. Нажмите Ctrl+C.');}break;
      case 'export-json':exportJSON();break;
      case 'reset-demo':state=core.createState();work.clear();pending=null;selectedId=data.tickets[0].id;filter='all';$('#ticket-search').value='';$('#kb-search').value='';renderInbox();renderTicket();showView('tickets');notify('Возвращены исходные модельные данные.');break;
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='ticket-search')renderInbox();
    if(event.target.id==='kb-search')renderKnowledge();
    if(event.target.id==='draft')entry().draft=event.target.value;
    if(event.target.id==='student-message'){
      const w=entry();w.message=event.target.value;w.result=null;w.draft='';$('#draft').value='';$('#draft').disabled=true;
      ['approve','escalate','copy-draft'].forEach(id=>$('#'+id).disabled=true);$('#ticket-detail .draft-top .source-link')?.remove();renderTrace();
    }
  });
  $('#confirm-dialog').addEventListener('close',()=>pending=null);
  window.GlobalUI=Object.freeze({getState:()=>JSON.parse(JSON.stringify(state))});
  renderInbox();renderTicket();renderKnowledge();showView('tickets');
})();
