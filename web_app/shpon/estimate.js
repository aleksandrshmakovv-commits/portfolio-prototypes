// Portfolio tariff model. All dimensions in mm; rates are illustrative, not supplier prices.
globalThis.ShponEstimate = (() => {
  const version = 'demo-2026-10-01';
  const materials = {
    oak: { name: 'Дуб натуральный', rate: 9800 },
    ash: { name: 'Ясень', rate: 8200 },
    walnut: { name: 'Орех американский', rate: 14500 },
    birch: { name: 'Берёза', rate: 6200 },
  };
  const kinds = {
    wardrobe: { name: 'Шкаф', work: 18000, supportsDoors: true, supportsShelves: true },
    shelf: { name: 'Стеллаж', work: 11000, supportsDoors: false, supportsShelves: true },
    cabinet: { name: 'Тумба', work: 12500, supportsDoors: true, supportsShelves: true },
    dresser: { name: 'Комод', work: 16500, supportsDoors: false, supportsShelves: false },
    desk: { name: 'Стол', work: 9500, supportsDoors: false, supportsShelves: false },
    kitchen: { name: 'Кухонный модуль', work: 22000, supportsDoors: true, supportsShelves: true },
  };
  function calculate(input) {
    const p = { kind: input.kind, material: input.material, width: Number(input.width), height: Number(input.height), depth: Number(input.depth), shelves: Number(input.shelves), drawers: Number(input.drawers), quantity: Number(input.quantity), doors: Boolean(input.doors), premium: Boolean(input.premium), finish: Boolean(input.finish), assembly: Boolean(input.assembly), delivery: Boolean(input.delivery) };
    const errors = [];
    if (!kinds[p.kind]) errors.push('Выберите тип изделия.');
    if (!materials[p.material]) errors.push('Выберите материал.');
    for (const [key, name, min, max] of [['width','Ширина',200,4000],['height','Высота',200,3000],['depth','Глубина',150,1000],['quantity','Количество',1,20],['shelves','Полки',0,10],['drawers','Ящики',0,8]]) {
      if (!Number.isInteger(p[key]) || p[key] < min || p[key] > max) errors.push(`${name}: целое число от ${min} до ${max}.`);
    }
    if (errors.length) return { valid: false, errors };
    const kind = kinds[p.kind];
    if (!kind.supportsShelves) p.shelves = 0;
    if (!kind.supportsDoors) p.doors = false;
    if (p.kind === 'desk') p.drawers = 0;
    const w=p.width/1000, h=p.height/1000, d=p.depth/1000;
    // Desk: top and two side panels. Carcass: sides, top/bottom, shelves, back and optional fronts.
    let area = p.kind === 'desk' ? w*d+2*h*d : 2*h*d+2*w*d+p.shelves*w*d+w*h+(p.doors?w*h:0);
    // Approximation for drawer bottoms/sides/fronts; not a cutting list.
    area += p.drawers * (w*d + 2*d*.18 + w*.18);
    area = Math.round(area*10000)/10000;
    const billedArea = Math.round(area*1.15*10000)/10000;
    const lines = [];
    const add = (id,label,value,detail) => lines.push({ id,label,amount:Math.round(value),detail });
    add('material','Материал + запас 15%',billedArea*materials[p.material].rate*p.quantity,`${billedArea.toFixed(2)} м² × ${materials[p.material].rate} ₽ × ${p.quantity}`);
    const hardware=(p.doors?2200:0)+p.drawers*(p.premium?3800:1800)+(p.kind==='desk'?1200:900);
    add('hardware','Фурнитура',hardware*p.quantity,p.premium?'Усиленные направляющие':'Базовая комплектация');
    add('work','Работа мастерской',(kind.work+area*1250)*p.quantity,`База + ${area.toFixed(2)} м² × 1250 ₽`);
    if (p.finish) add('finish','Защитная отделка',area*1400*p.quantity,'1400 ₽ / м², модельная ставка');
    if (p.assembly) add('assembly','Сборка',Math.max(3500,kind.work*.2)*p.quantity,`${p.quantity} шт.`);
    if (p.delivery) add('delivery','Доставка',3500,'Одна поездка, без учёта адреса и подъёма');
    const raw=lines.reduce((sum,line)=>sum+line.amount,0);
    const total=Math.ceil(raw/100)*100;
    if (total!==raw) add('rounding','Округление до 100 ₽',total-raw,'Вверх');
    return { valid:true,version,parameters:p,area,billedArea,lines,total,low:Math.floor(total*.9/100)*100,high:Math.ceil(total*1.15/100)*100,materialName:materials[p.material].name,kindName:kind.name };
  }
  return { version, materials, kinds, calculate };
})();
