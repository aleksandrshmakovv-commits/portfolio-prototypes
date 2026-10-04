(function (root) {
  'use strict';
  const columns = ['id', 'date', 'product', 'category', 'channel', 'status', 'quantity', 'revenue', 'cost'];
  const products = [
    ['Сумка Тоут', 'Сумки', 4200], ['Рюкзак Город', 'Рюкзаки', 7800],
    ['Кошелёк Компакт', 'Аксессуары', 1900], ['Сумка Кросс', 'Сумки', 5600],
    ['Рюкзак Трек', 'Рюкзаки', 9200], ['Ремень Линия', 'Аксессуары', 2400]
  ];
  const channels = ['Сайт', 'Маркетплейс', 'Розница'];
  const rows = [];
  for (let month = 7; month <= 9; month += 1) {
    for (let day = 1; day <= 30; day += 1) {
      const index = rows.length;
      const product = products[(day + month * 2) % products.length];
      const quantity = 1 + ((day + month) % 3);
      const revenue = product[2] * quantity;
      rows.push({
        id: 'SR-' + (1001 + index), date: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        product: product[0], category: product[1], channel: channels[(day * 2 + month) % 3],
        status: index % 17 === 8 ? 'Возврат' : 'Оплачен', quantity, revenue,
        cost: Math.round(revenue * (0.52 + ((day + month) % 4) * 0.04))
      });
    }
  }
  root.SrezData = Object.freeze({
    label: 'Демонстрационные данные — вымышленный магазин аксессуаров',
    columns: Object.freeze(columns), categories: Object.freeze(['Сумки', 'Рюкзаки', 'Аксессуары']),
    channels: Object.freeze(channels), statuses: Object.freeze(['Оплачен', 'Возврат']),
    rows: Object.freeze(rows.map(Object.freeze)), defaultFrom: '2026-09-01', defaultTo: '2026-09-30'
  });
})(globalThis);
