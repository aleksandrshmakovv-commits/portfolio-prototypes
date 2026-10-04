window.StropaData = (() => {
  const models = [
    { id: 'marshrut', name: 'Маршрут 22', category: 'backpacks', categoryName: 'Рюкзаки', price: 8900, volume: '22 л', dimensions: '46 × 29 × 15 см', weight: '780 г', description: 'Рюкзак для города и коротких поездок.', details: 'Плотный нейлон, верх со скруткой и регулируемые стропы. Внутренний карман помогает отделить ноутбук от остальных вещей.', inside: ['Основное отделение со скруткой', 'Внутренний карман для ноутбука', 'Регулируемые плечевые лямки'], colors: [ { id: 'olive', name: 'Олива', hex: '#62674a' }, { id: 'graphite', name: 'Графит', hex: '#3e4140' } ] },
    { id: 'petlya', name: 'Петля 04', category: 'slings', categoryName: 'Сумки', price: 3900, volume: '4 л', dimensions: '30 × 17 × 8 см', weight: '280 г', description: 'Самое нужное — рядом и под рукой.', details: 'Компактная сумка через плечо из плотного нейлона. Основное отделение на молнии, отдельный передний карман и регулируемый ремень.', inside: ['Основное отделение на молнии', 'Передний карман для мелочей', 'Регулируемый ремень с пряжкой'], colors: [ { id: 'orange', name: 'Апельсин', hex: '#ed6329' }, { id: 'graphite', name: 'Графит', hex: '#3e4140' } ] },
    { id: 'liniya', name: 'Линия 16', category: 'totes', categoryName: 'Шоперы', price: 4900, volume: '16 л', dimensions: '38 × 35 × 12 см', weight: '420 г', description: 'Шопер для планов, которые меняются на ходу.', details: 'Вместительная сумка с длинными ручками, плоским дном и верхней молнией. Внешний карман позволяет быстро достать ключи или проездной.', inside: ['Верхняя застёжка на молнии', 'Внешний карман для мелочей', 'Длинные ручки из стропы'], colors: [ { id: 'sand', name: 'Песок', hex: '#d9d6c8' }, { id: 'olive', name: 'Олива', hex: '#62674a' } ] }
  ];
  const products = [0, 1].flatMap(index => models.map(model => {
    const color = model.colors[index];
    return { ...model, color, key: `${model.id}-${color.id}`, image: `assets/${model.id}-${color.id}.png`, stock: 8 };
  }));
  const byKey = key => products.find(item => item.key === key);
  const money = value => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  return { models, products, byKey, money, escape };
})();
