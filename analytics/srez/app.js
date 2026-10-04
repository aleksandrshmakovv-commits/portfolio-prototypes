(function () {
  'use strict';
  const core = SrezCore, fixture = SrezData;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const numeric = (value, fraction = 0) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: fraction }).format(value);
  const money = (value, fraction = 0) => numeric(value, fraction) + ' ₽';
  const prettyDate = value => value.split('-').reverse().join('.');
  const dayLabel = value => value.slice(8, 10) + '.' + value.slice(5, 7);
  let rows = fixture.rows.slice(), source = { type: 'demo', name: 'Демонстрационный магазин' };
  let filters = { from: fixture.defaultFrom, to: fixture.defaultTo, channel: 'all', category: 'all' };
  let query = '', page = 1, sortField = 'date', sortDirection = 'desc', interval = 'day', preview = null, importVersion = 0, toastTimer;
  const PAGE_SIZE = 6;
  const icons = {
    chart: '<path d="M4 14h3v6H4zm6-5h3v11h-3zm6-5h3v16h-3z"/>',
    cart: '<path d="M3 3h2l3 12h10l3-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
    back: '<path d="m12 5-7 7 7 7M5 12h15"/>',
    upload: '<path d="m7 8 5-5 5 5M12 3v13M4 14v6h16v-6"/>',
    download: '<path d="m7 12 5 5 5-5M12 3v14M4 17v4h16v-4"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>'
  };
  document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons[node.dataset.icon] + '</svg>'; });
  function selectedRows() { return core.filter(rows, filters); }
  function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500); }
  function writeFilters() { for (const key of ['from', 'to', 'channel', 'category']) $('#filter-' + key).value = filters[key]; }
  function kpis() {
    const report = core.comparePeriod(rows, filters);
    const definitions = [['revenue', 'Выручка'], ['profit', 'Валовая прибыль'], ['paidOrders', 'Оплаченные заказы'], ['averageOrder', 'Средний чек']];
    $('#kpis').innerHTML = definitions.map(([key, label]) => {
      const value = report.current[key];
      // Format the original ratio once: rounding to 2dp before 1dp can shift 13.349 -> 13.4.
      const change = report.previous[key] === 0 ? null : (value - report.previous[key]) / Math.abs(report.previous[key]) * 100;
      const changeText = change === null ? '—' : (change > 0 ? '▲ +' : change < 0 ? '▼ −' : '') + numeric(Math.abs(change), 1) + '%';
      const valueText = key === 'paidOrders' ? numeric(value) : money(value);
      const tooltip = key === 'averageOrder' ? money(value, 2) : valueText;
      return `<article class="kpi"><div class="kpi-label">${label}<button class="info" data-formula="${key}" aria-label="Формула: ${label}">?</button></div><p class="kpi-value" data-kpi="${key}" title="${escape(tooltip)}">${valueText}</p><p class="change ${change === null || change === 0 ? 'neutral' : change > 0 ? 'positive' : 'negative'}">${changeText}</p><p class="change-note" title="${prettyDate(report.previousFrom)} — ${prettyDate(report.previousTo)}">К предыдущим ${Math.round((Date.parse(filters.to) - Date.parse(filters.from)) / 86400000) + 1} дням</p></article>`;
    }).join('');
  }
  function renderChart() {
    const selected = selectedRows(), points = core.series(selected, filters.from, filters.to, interval);
    const width = Math.max(280, Math.round($('#revenue-chart').clientWidth || 760)), height = 190;
    const left = 63, right = 8, top = 8, bottom = 29, plotWidth = width - left - right, plotHeight = height - top - bottom;
    const values = points.map(point => point.revenue), minValue = Math.min(0, ...values), maxValue = Math.max(0, ...values);
    const span = maxValue - minValue || 20000, rawStep = span / 4, power = 10 ** Math.floor(Math.log10(rawStep));
    const step = [1, 2, 5, 10].map(value => value * power).find(value => value >= rawStep) || power * 10;
    const low = minValue < 0 ? Math.floor(minValue / step) * step : 0;
    const high = maxValue > 0 ? Math.ceil(maxValue / step) * step : minValue === 0 ? step * 4 : 0;
    const y = value => top + (high - value) / (high - low) * plotHeight;
    const zero = y(0), slot = plotWidth / points.length, barWidth = Math.max(.1, slot * .64);
    let content = '';
    for (let tick = low; tick <= high + step / 2; tick += step) {
      const label = Math.abs(tick) >= 1000000 ? numeric(tick / 1000000, 1) + ' млн' : numeric(tick) + ' ₽';
      content += `<line class="chart-grid" x1="${left}" y1="${y(tick)}" x2="${width - right}" y2="${y(tick)}"/><text class="chart-label" x="${left - 9}" y="${y(tick) + 4}" text-anchor="end">${label}</text>`;
    }
    const labelEvery = Math.max(1, Math.ceil(points.length / (width < 450 ? 5 : 15)));
    points.forEach((point, index) => {
      const x = left + index * slot + (slot - barWidth) / 2;
      content += `<rect class="chart-bar ${point.revenue < 0 ? 'negative' : ''}" x="${x}" y="${Math.min(zero, y(point.revenue))}" width="${barWidth}" height="${Math.abs(zero - y(point.revenue))}"><title>${escape(prettyDate(point.date))}: ${escape(money(point.revenue, 2))}</title></rect>`;
      if (index % labelEvery === 0) content += `<text class="chart-label" x="${x + barWidth / 2}" y="${height - 7}" text-anchor="middle">${dayLabel(point.date)}</text>`;
    });
    content += `<line class="chart-zero" x1="${left}" y1="${zero}" x2="${width - right}" y2="${zero}"/>`;
    if (values.every(value => value === 0)) content += `<text class="chart-label" x="${left + plotWidth / 2}" y="${top + plotHeight / 2}" text-anchor="middle">${selected.length ? 'Выручка равна нулю' : 'Нет продаж в этом периоде'}</text>`;
    $('#revenue-chart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Чистая выручка ${interval === 'week' ? 'по 7-дневным интервалам' : 'по дням'} с ${escape(prettyDate(filters.from))} по ${escape(prettyDate(filters.to))}. Красные столбцы — отрицательный итог после возвратов.">${content}</svg>`;
  }
  function renderChannels() {
    const grouped = core.group(selectedRows(), 'channel');
    const values = fixture.channels.map(label => ({ label, revenue: grouped.find(row => row.label === label)?.revenue || 0 }));
    const min = Math.min(0, ...values.map(row => row.revenue)), max = Math.max(0, ...values.map(row => row.revenue));
    const span = max - min || 1, zero = -min / span * 100;
    $('#channels-chart').innerHTML = values.map(row => {
      const width = Math.abs(row.revenue) / span * 100, left = row.revenue < 0 ? zero - width : zero;
      return `<div class="channel-row"><span>${escape(row.label)}</span><div class="channel-track" title="${escape(row.label)}: ${escape(money(row.revenue, 2))}"><div class="channel-fill ${row.revenue < 0 ? 'negative' : ''}" style="position:absolute;left:${left}%;width:${width}%"></div>${row.revenue === 0 ? '<span class="channel-zero">0</span>' : ''}${min < 0 ? `<span style="position:absolute;left:${zero}%;top:0;height:100%;border-left:1px solid #8ea3ad"></span>` : ''}</div><span class="channel-amount">${money(row.revenue)}</span></div>`;
    }).join('');
  }
  function renderTable() {
    const tableRows = core.sort(core.filter(selectedRows(), { query }), sortField, sortDirection);
    const pages = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE)); page = Math.min(page, pages);
    const start = (page - 1) * PAGE_SIZE, currentRows = tableRows.slice(start, start + PAGE_SIZE);
    $('#table-body').innerHTML = currentRows.length ? currentRows.map(row => `<tr><td>${escape(row.id)}</td><td>${prettyDate(row.date)}</td><td class="product">${escape(row.product)}</td><td>${escape(row.channel)}</td><td class="${row.status === 'Возврат' ? 'status-return' : 'status-paid'}">${escape(row.status)}</td><td class="number">${money(row.revenue * (row.status === 'Возврат' ? -1 : 1), 2)}</td></tr>`).join('') : '<tr><td colspan="6" class="empty-row">' + (query ? 'По этому запросу заказов нет. Попробуйте другой номер или товар.' : 'В выбранном периоде заказов нет. Измените фильтры.') + '</td></tr>';
    $('#table-count').textContent = currentRows.length ? `Показано ${start + 1}–${start + currentRows.length} из ${tableRows.length}` : 'Показано 0 из 0';
    const range = [];
    if (pages <= 7) for (let index = 1; index <= pages; index += 1) range.push(index);
    else { range.push(1); const lower = Math.max(2, page - 1), upper = Math.min(pages - 1, page + 1); if (lower > 2) range.push('…'); for (let index = lower; index <= upper; index += 1) range.push(index); if (upper < pages - 1) range.push('…'); range.push(pages); }
    $('#pagination').innerHTML = `<button class="edge" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Предыдущая страница">‹</button>` + range.map(number => typeof number === 'number' ? `<button data-page="${number}" class="${page === number ? 'current' : ''}" ${page === number ? 'aria-current="page"' : ''}>${number}</button>` : '<span aria-hidden="true">…</span>').join('') + `<button class="edge" data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Следующая страница">›</button>`;
    document.querySelectorAll('[data-sort]').forEach(button => { button.querySelector('span').textContent = button.dataset.sort === sortField ? sortDirection === 'desc' ? '↓' : '↑' : '↕'; button.closest('th').setAttribute('aria-sort', button.dataset.sort === sortField ? sortDirection === 'desc' ? 'descending' : 'ascending' : 'none'); });
  }
  function render() {
    const isSeptember = filters.from === fixture.defaultFrom && filters.to === fixture.defaultTo;
    $('#period-label').textContent = (isSeptember ? 'Сентябрь 2026' : `${prettyDate(filters.from)} — ${prettyDate(filters.to)}`) + (source.type === 'demo' ? ' · модельный магазин' : ' · импортированные данные');
    $('#sidebar-source').textContent = source.type === 'demo' ? 'Демо-данные' : 'Импорт CSV';
    $('#source-label').textContent = source.type === 'demo' ? `${fixture.label}. ${rows.length} заказов, июль–сентябрь 2026.` : `Источник: ${source.name}. ${rows.length} проверенных строк. Только текущая вкладка.`;
    kpis(); renderChart(); renderChannels(); renderTable();
  }
  $('#filters').addEventListener('submit', event => {
    event.preventDefault();
    const candidate = Object.fromEntries(['from', 'to', 'channel', 'category'].map(key => [key, $('#filter-' + key).value]));
    try { core.filter(rows, candidate); core.comparePeriod(rows, candidate); }
    catch (error) { $('#filter-error').textContent = error.message; $('#filter-error').hidden = false; return; }
    filters = candidate; page = 1; $('#filter-error').hidden = true; render();
  });
  $('#table-search').addEventListener('input', event => { query = event.target.value; page = 1; renderTable(); });
  $('#chart-interval').addEventListener('change', event => { interval = event.target.value; renderChart(); });
  const formulas = {
    revenue: ['Выручка', 'Сумма revenue оплаченных заказов минус сумма revenue возвратов. Значение после возвратов может быть отрицательным.'],
    profit: ['Валовая прибыль', 'Для каждой оплаченной строки: revenue − cost. Для возврата эта разница вычитается. Это не чистая прибыль: комиссии, реклама, налоги и операционные расходы в данных отсутствуют.'],
    paidOrders: ['Оплаченные заказы', 'Количество строк со статусом «Оплачен». Возвраты не входят в этот показатель. quantity — число единиц товара внутри строки, не число заказов.'],
    averageOrder: ['Средний чек', 'Сумма выручки только оплаченных строк / число оплаченных строк. Возвраты исключены из числителя и знаменателя. При отсутствии оплаченных заказов — 0. На карточке рубли округлены до целого; точная сумма до копеек доступна при наведении.'],
    chart: ['Динамика выручки', 'Каждый столбец — выручка за день после вычета возвратов. Пустые дни показаны нулём, отрицательные значения — красным ниже нулевой линии. Недельные интервалы идут по семь дней от выбранной даты начала, а последний может быть короче.'],
    channels: ['Каналы продаж', 'Выручка после возвратов сгруппирована по каналам. Полосы рассчитаны по текущим данным, а не по фиксированным значениям. Красная полоса слева от нулевой линии означает отрицательную выручку.'],
    orders: ['Таблица заказов', 'Одна строка — оплаченный заказ или операция возврата. Суммы уже учитывают количество, повторного умножения нет. Возврат показан отрицательной выручкой, хотя исходный CSV хранит положительную сумму и статус «Возврат». Поиск изменяет только таблицу; экспорт использует все строки выбранного периода, канала и категории.']
  };
  function openFormula(key) {
    const definition = formulas[key]; if (!definition) return;
    const comparison = core.comparePeriod(rows, filters);
    $('#formula-title').textContent = definition[0];
    $('#formula-content').innerHTML = `<p>${escape(definition[1])}</p><p class="muted">Сравнение: ${prettyDate(filters.from)}–${prettyDate(filters.to)} к ${prettyDate(comparison.previousFrom)}–${prettyDate(comparison.previousTo)}. Предыдущий период равен текущему по числу дней. При нулевом прошлом значении процент не рассчитывается и показан «—».</p><p class="muted">Учебная модель. Для всех денежных сумм используются целые копейки.</p>`;
    $('#formula-dialog').showModal();
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button?.dataset.formula) openFormula(button.dataset.formula);
    if (button?.dataset.close) { $('#' + button.dataset.close).close(); if (button.dataset.close === 'import-dialog') importVersion += 1; }
    if (button?.dataset.page && !button.disabled) { page = Number(button.dataset.page); renderTable(); }
    if (button?.dataset.sort) { const field = button.dataset.sort; sortDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc'; sortField = field; page = 1; renderTable(); }
  });
  document.querySelectorAll('.sidebar nav a').forEach(link => link.addEventListener('click', () => { document.querySelectorAll('.sidebar nav a').forEach(node => node.classList.toggle('active', node === link)); }));
  $('#open-import').addEventListener('click', () => { preview = null; importVersion += 1; $('#import-file').value = ''; $('#import-preview').innerHTML = ''; $('#import-error').hidden = true; $('#commit-import').disabled = true; $('#import-dialog').showModal(); });
  $('#import-dialog').addEventListener('cancel', () => { importVersion += 1; });
  $('#import-file').addEventListener('change', async event => {
    const version = ++importVersion, file = event.target.files[0]; preview = null; $('#commit-import').disabled = true; $('#import-error').hidden = true; $('#import-preview').innerHTML = '';
    if (!file) return;
    try {
      if (file.size > 1048576) throw new Error('CSV: максимальный размер — 1 МиБ.');
      $('#import-preview').textContent = 'Проверяем файл…';
      const buffer = await file.arrayBuffer(); if (version !== importVersion) return;
      let text; try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); } catch { throw new Error('CSV: сохраните файл в кодировке UTF-8.'); }
      const parsed = core.parseCSV(text);
      if (version !== importVersion) return;
      preview = { name: file.name, rows: parsed };
      const dates = parsed.map(row => row.date).sort();
      $('#import-preview').innerHTML = `<p><strong>Проверено: ${parsed.length} строк.</strong><br>${prettyDate(dates[0])} — ${prettyDate(dates[dates.length - 1])}. Первые ${Math.min(5, parsed.length)} строк:</p><div class="table-scroll"><table><thead><tr><th>Заказ</th><th>Дата</th><th>Товар</th><th class="number">Выручка</th></tr></thead><tbody>${parsed.slice(0, 5).map(row => `<tr><td>${escape(row.id)}</td><td>${prettyDate(row.date)}</td><td class="product">${escape(row.product)}</td><td class="number">${money(row.revenue, 2)}</td></tr>`).join('')}</tbody></table></div><p class="muted">При применении текущий набор заменится. Период будет установлен по датам файла, канал и категория — «Все».</p>`;
      $('#commit-import').disabled = false;
    } catch (error) { if (version !== importVersion) return; preview = null; $('#import-preview').innerHTML = ''; $('#import-error').textContent = error.message; $('#import-error').hidden = false; }
  });
  $('#commit-import').addEventListener('click', () => {
    if (!preview) return;
    const dates = preview.rows.map(row => row.date).sort(), to = dates[dates.length - 1];
    const broad = (Date.parse(to) - Date.parse(dates[0])) / 86400000 > 3652;
    const from = broad ? new Date(Date.parse(to + 'T00:00:00Z') - 29 * 86400000).toISOString().slice(0, 10) : dates[0];
    const candidate = { from, to, channel: 'all', category: 'all' };
    try { core.comparePeriod(preview.rows, candidate); }
    catch (error) { $('#import-error').textContent = error.message; $('#import-error').hidden = false; return; }
    rows = preview.rows; source = { type: 'import', name: preview.name }; filters = candidate; query = ''; page = 1; preview = null;
    $('#table-search').value = ''; $('#filter-error').hidden = true; writeFilters(); render(); $('#import-dialog').close();
    $('#dataset-message').textContent = broad ? 'Файл охватывает более 10 лет: выбран последний 30-дневный период. Данные за остальные даты остаются в наборе.' : 'Период установлен по датам импортированного файла. Перезагрузка страницы вернёт демонстрационные данные.';
    toast('Данные применены. Файл остался в браузере.');
  });
  $('#reset-demo').addEventListener('click', () => {
    if (source.type === 'import' && !confirm('Заменить импортированный набор демонстрационными данными?')) return;
    rows = fixture.rows.slice(); source = { type: 'demo', name: 'Демонстрационный магазин' }; filters = { from: fixture.defaultFrom, to: fixture.defaultTo, channel: 'all', category: 'all' }; query = ''; page = 1;
    $('#table-search').value = ''; $('#dataset-message').textContent = ''; $('#filter-error').hidden = true; writeFilters(); render(); toast('Демонстрационные данные восстановлены.');
  });
  $('#export-csv').addEventListener('click', () => {
    const selected = selectedRows();
    if (!selected.length) { toast('В выбранных фильтрах нет строк для экспорта.'); return; }
    const blob = new Blob(['\uFEFF', core.toCSV(selected, ',', true)], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a'), url = URL.createObjectURL(blob); link.href = url; link.download = `srez-${filters.from}-${filters.to}.csv`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 15000);
    toast(`Экспортировано ${selected.length} строк по фильтрам. Поиск таблицы не учитывается.`);
  });
  let resizeTimer; window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderChart, 120); });
  window.SrezApp = Object.freeze({ qaState: () => JSON.parse(JSON.stringify({ source, filters, query, page, sortField, sortDirection, interval, totalRows: rows.length, selectedRows: selectedRows(), summary: core.summary(selectedRows()) })) });
  render();
})();
