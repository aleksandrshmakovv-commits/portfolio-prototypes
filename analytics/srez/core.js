(function (root) {
  'use strict';
  const COLUMNS = ['id', 'date', 'product', 'category', 'channel', 'status', 'quantity', 'revenue', 'cost'];
  const CATEGORIES = ['Сумки', 'Рюкзаки', 'Аксессуары'];
  const CHANNELS = ['Сайт', 'Маркетплейс', 'Розница'];
  const STATUSES = ['Оплачен', 'Возврат'];
  const DAY = 86400000;
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
  const iso = milliseconds => new Date(milliseconds).toISOString().slice(0, 10);
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const stamp = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(stamp) && iso(stamp) === value;
  }
  function dateRange(from, to) {
    if (!validDate(from) || !validDate(to)) throw new Error('Период: укажите реальные даты в формате YYYY-MM-DD.');
    if (from > to) throw new Error('Период: начало должно быть не позже окончания.');
    if ((Date.parse(to) - Date.parse(from)) / DAY > 3652) throw new Error('Период: максимальная длительность — 10 лет.');
  }
  function delimiterOf(text) {
    text = text.replace(/^(?:[ \t]*(?:\r\n|\r|\n))+/, '');
    let quoted = false, commas = 0, semicolons = 0;
    for (let i = 0; i < text.length; i += 1) {
      const c = text[i];
      if (c === '"') { if (quoted && text[i + 1] === '"') i += 1; else quoted = !quoted; }
      else if (!quoted) { if (c === '\r' || c === '\n') break; if (c === ',') commas += 1; if (c === ';') semicolons += 1; }
    }
    return semicolons > commas ? ';' : ',';
  }
  function recordsOf(text, delimiter) {
    const records = [];
    let fields = [], value = '', quoted = false, closed = false, line = 1, startLine = 1;
    function field() { fields.push(value); value = ''; closed = false; }
    function record() { field(); if (fields.some(x => x.trim() !== '')) records.push({ fields, line: startLine }); fields = []; startLine = line; }
    for (let i = 0; i < text.length; i += 1) {
      const c = text[i];
      if (quoted) {
        if (c === '"') { if (text[i + 1] === '"') { value += '"'; i += 1; } else { quoted = false; closed = true; } }
        else if (c === '\r' || c === '\n') { if (c === '\r' && text[i + 1] === '\n') i += 1; value += '\n'; line += 1; }
        else value += c;
      } else if (c === delimiter) field();
      else if (c === '\r' || c === '\n') { if (c === '\r' && text[i + 1] === '\n') i += 1; record(); line += 1; startLine = line; }
      else if (c === '"') {
        if (value !== '' || closed) throw new Error(`Строка ${line}: кавычка допустима только в начале поля.`);
        quoted = true;
      } else if (closed) {
        if (c !== ' ' && c !== '\t') throw new Error(`Строка ${line}: после закрывающей кавычки ожидается разделитель.`);
      } else value += c;
      if (records.length > 5001) throw new Error(`Строка ${startLine}: максимум 5000 заказов в одном CSV.`);
    }
    if (quoted) throw new Error(`Строка ${startLine}: незакрытое поле в кавычках.`);
    if (value !== '' || fields.length || closed) record();
    return records;
  }
  function parseCSV(input) {
    if (typeof input !== 'string') throw new Error('CSV: ожидается текстовый файл.');
    if (new TextEncoder().encode(input).length > 1048576) throw new Error('CSV: максимальный размер — 1 МБ.');
    const text = input.replace(/^\uFEFF/, '');
    const records = recordsOf(text, delimiterOf(text));
    if (records.length < 2) throw new Error('CSV: нужен заголовок и хотя бы один заказ.');
    const headerRecord = records.shift();
    const headers = headerRecord.fields.map(v => v.trim());
    if (headers.length !== COLUMNS.length || new Set(headers).size !== COLUMNS.length || COLUMNS.some(k => !headers.includes(k))) {
      throw new Error(`Строка ${headerRecord.line}: нужны ровно 9 уникальных столбцов: ${COLUMNS.join(', ')}.`);
    }
    if (records.length > 5000) throw new Error(`Строка ${records[5000].line}: максимум 5000 заказов в одном CSV.`);
    const seen = new Set();
    return records.map(record => {
      const fail = (field, message) => { throw new Error(`Строка ${record.line}, ${field}: ${message}`); };
      if (record.fields.length !== headers.length) fail('столбцы', `ожидается 9 значений, получено ${record.fields.length}.`);
      const row = Object.fromEntries(headers.map((key, i) => [key, record.fields[i].trim()]));
      if (!row.id || row.id.length > 100) fail('id', 'требуется непустой идентификатор длиной до 100 символов.');
      if (seen.has(row.id)) fail('id', `дубликат «${row.id}».`);
      seen.add(row.id);
      if (!validDate(row.date)) fail('date', 'нужна реальная дата YYYY-MM-DD.');
      if (!row.product || row.product.length > 200) fail('product', 'требуется название длиной до 200 символов.');
      if (!CATEGORIES.includes(row.category)) fail('category', 'допустимы Сумки, Рюкзаки, Аксессуары.');
      if (!CHANNELS.includes(row.channel)) fail('channel', 'допустимы Сайт, Маркетплейс, Розница.');
      if (!STATUSES.includes(row.status)) fail('status', 'допустимы Оплачен, Возврат.');
      if (!/^\d+$/.test(row.quantity) || Number(row.quantity) < 1 || Number(row.quantity) > 999) fail('quantity', 'нужно целое число от 1 до 999.');
      row.quantity = Number(row.quantity);
      for (const key of ['revenue', 'cost']) {
        if (!/^\d+(?:\.\d{1,2})?$/.test(row[key]) || !Number.isFinite(Number(row[key])) || Number(row[key]) > 1e10) fail(key, 'нужно неотрицательное число до 10 000 000 000, максимум 2 знака после точки.');
        row[key] = Number(row[key]);
      }
      return row;
    });
  }
  function toCSV(rows, delimiter = ',', spreadsheetSafe = false) {
    if (![',', ';'].includes(delimiter)) throw new Error('CSV: разделитель — запятая или точка с запятой.');
    const quote = value => { let text = String(value ?? ''); if (spreadsheetSafe && typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = "'" + text; return /[",;\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text; };
    return [COLUMNS.join(delimiter), ...rows.map(row => COLUMNS.map(key => quote(row[key])).join(delimiter))].join('\r\n') + '\r\n';
  }
  function filter(rows, options = {}) {
    const { from, to, channel, category } = options;
    if (from && !validDate(from)) throw new Error('Период: неверная дата начала.');
    if (to && !validDate(to)) throw new Error('Период: неверная дата окончания.');
    if (from && to) dateRange(from, to);
    const query = String(options.query || '').trim().toLocaleLowerCase('ru');
    return rows.filter(row => (!from || row.date >= from) && (!to || row.date <= to)
      && (!channel || channel === 'Все' || channel === 'all' || row.channel === channel)
      && (!category || category === 'Все' || category === 'all' || row.category === category)
      && (!query || (row.id + ' ' + row.product).toLocaleLowerCase('ru').includes(query)));
  }
  function summary(rows) {
    let revenue = 0, profit = 0, paidRevenue = 0, paidOrders = 0, returnAmount = 0, returnOrders = 0, netUnits = 0;
    rows.forEach(row => {
      const sign = row.status === 'Возврат' ? -1 : 1;
      const amount = Math.round(row.revenue * 100), cost = Math.round(row.cost * 100);
      revenue += sign * amount; profit += sign * (amount - cost); netUnits += sign * row.quantity;
      if (sign === 1) { paidRevenue += amount; paidOrders += 1; }
      else { returnAmount += amount; returnOrders += 1; }
    });
    return { revenue: revenue / 100, profit: profit / 100, paidRevenue: paidRevenue / 100, paidOrders,
      averageOrder: paidOrders ? round(paidRevenue / 100 / paidOrders) : 0,
      returnAmount: returnAmount / 100, returnOrders, netUnits };
  }
  function series(rows, from, to, interval = 'day') {
    dateRange(from, to);
    if (!['day', 'week'].includes(interval)) throw new Error('График: интервал day или week.');
    const buckets = new Map();
    const start = Date.parse(from + 'T00:00:00Z'), end = Date.parse(to + 'T00:00:00Z');
    const step = interval === 'week' ? 7 * DAY : DAY;
    for (let stamp = start; stamp <= end; stamp += step) buckets.set(iso(stamp), []);
    filter(rows, { from, to }).forEach(row => {
      const bucket = iso(start + Math.floor((Date.parse(row.date + 'T00:00:00Z') - start) / step) * step);
      buckets.get(bucket).push(row);
    });
    return [...buckets].map(([date, items]) => ({ date, ...summary(items) }));
  }
  function group(rows, field) {
    if (!['channel', 'category', 'status', 'product'].includes(field)) throw new Error('Группировка: неизвестное поле.');
    const map = new Map();
    rows.forEach(row => { if (!map.has(row[field])) map.set(row[field], []); map.get(row[field]).push(row); });
    return [...map].map(([label, items]) => ({ label, ...summary(items) })).sort((a, b) => b.revenue - a.revenue || a.label.localeCompare(b.label, 'ru'));
  }
  function sort(rows, field = 'date', direction = 'desc') {
    if (!['date', 'revenue', 'id'].includes(field) || !['asc', 'desc'].includes(direction)) throw new Error('Сортировка: date/revenue/id, направление asc/desc.');
    const sign = direction === 'asc' ? 1 : -1;
    const value = row => field === 'revenue' ? row.revenue * (row.status === 'Возврат' ? -1 : 1) : row[field];
    return rows.slice().sort((a, b) => sign * (typeof value(a) === 'number' ? value(a) - value(b) : value(a).localeCompare(value(b), 'ru')) || a.id.localeCompare(b.id, 'ru'));
  }
  function comparePeriod(rows, options) {
    const { from, to } = options;
    dateRange(from, to);
    const length = (Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / DAY + 1;
    const previousTo = iso(Date.parse(from + 'T00:00:00Z') - DAY);
    const previousFrom = iso(Date.parse(from + 'T00:00:00Z') - length * DAY);
    const current = summary(filter(rows, options));
    const previous = summary(filter(rows, { ...options, from: previousFrom, to: previousTo }));
    const changes = Object.fromEntries(['revenue', 'profit', 'paidOrders', 'averageOrder'].map(key => [key,
      previous[key] === 0 ? null : round((current[key] - previous[key]) / Math.abs(previous[key]) * 100)]));
    return { current, previous, previousFrom, previousTo, changes };
  }
  root.SrezCore = Object.freeze({ parseCSV, toCSV, filter, summary, series, group, sort, comparePeriod, validDate });
})(globalThis);
