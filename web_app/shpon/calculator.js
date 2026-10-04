(() => {
  const dialog=document.querySelector('#calculator-dialog'), form=document.querySelector('#calculator-form');
  const field=name=>form.elements.namedItem(name);
  const money=value=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(value);
  let current=null;
  function read() {
    return Object.fromEntries(['kind','material','width','height','depth','shelves','drawers','quantity','doors','premium','finish','assembly','delivery'].map(name=>[name,field(name).type==='checkbox'?field(name).checked:field(name).value]));
  }
  function update() {
    const kind=ShponEstimate.kinds[field('kind').value];
    field('shelves').disabled=!kind?.supportsShelves;field('doors').disabled=!kind?.supportsDoors;field('drawers').disabled=field('kind').value==='desk';
    current=ShponEstimate.calculate(read());
    document.querySelector('#estimate-save').disabled=!current.valid;
    document.querySelector('#estimate-error').textContent=current.valid?'':current.errors.join(' ');
    document.querySelector('#estimate-total').textContent=current.valid?money(current.total):'—';
    document.querySelector('#estimate-range').textContent=current.valid?`Ориентир: ${money(current.low)} – ${money(current.high)}`:'Уточните параметры изделия';
    document.querySelector('#estimate-area').textContent=current.valid?`${current.area.toFixed(2)} м² деталей · ${current.parameters.quantity} шт.`:'Проверьте размеры';
    const rows=document.querySelector('#estimate-lines');rows.replaceChildren();
    if (current.valid) for (const line of current.lines) {
      const row=document.createElement('div');row.className='estimate-line';row.dataset.cost=line.id;
      const title=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('small'),value=document.createElement('span');
      name.textContent=line.label;detail.textContent=line.detail;value.textContent=money(line.amount);title.append(name,detail);row.append(title,value);rows.append(row);
    }
    document.querySelector('#calculator-sketch').innerHTML=furnitureSketch(field('kind').value);
  }
  document.querySelector('#open-calculator').addEventListener('click',()=>{update();dialog.showModal();field('kind').focus();});
  document.querySelector('#close-calculator').addEventListener('click',()=>dialog.close());
  form.addEventListener('input',update);form.addEventListener('change',update);
  form.addEventListener('submit',event=>{
    event.preventDefault();update();if (!current?.valid) return;
    const client=field('client').value.trim();
    if (client.length<2 || client.length>80) {document.querySelector('#estimate-error').textContent='Укажите имя клиента от 2 до 80 символов.';field('client').focus();return;}
    const next=String(Math.max(260,...orders.map(item=>Number(item.id)).filter(Number.isFinite))+1).padStart(4,'0');
    const p=current.parameters;
    const note=['Предварительный расчёт по демонстрационным ставкам.',`Количество: ${p.quantity} шт.`,`Ориентир: ${money(current.total)}; диапазон ${money(current.low)} – ${money(current.high)}.`,...current.lines.map(line=>`${line.label}: ${money(line.amount)}`),'Точная стоимость и дата изготовления согласуются после замера.'].join('\n');
    const saved=JSON.parse(JSON.stringify(current));
    orders.push({id:next,title:`${current.kindName} — расчёт`,client,created:offsetDate(0),due:offsetDate(14),material:current.materialName,dimensions:`${p.width} × ${p.height} × ${p.depth}`,stage:'new',kind:p.kind,note,estimate:saved});
    persist();clearFilters();dialog.close();showDialog(next);showToast(`Расчёт ${next} сохранён в новые заказы`);
  });
})();
