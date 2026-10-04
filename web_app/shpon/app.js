const STORAGE_KEY = 'shpon-demo-orders-v1';
const stages = [
  { id: 'new', name: 'Новые', detail: 'Ожидают проработки' },
  { id: 'design', name: 'Проект', detail: 'Проектирование и согласование' },
  { id: 'making', name: 'Изготовление', detail: 'В производстве' },
  { id: 'done', name: 'Готово', detail: 'Завершённые заказы' },
];
const $ = (selector) => document.querySelector(selector);
const today = new Date(); today.setHours(0, 0, 0, 0);
const offsetDate = (days) => { const date = new Date(today); date.setDate(date.getDate() + days); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const parseDate = (value) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day); };
const shortDate = (value) => parseDate(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
const fullDate = (value) => parseDate(value).toLocaleDateString('ru-RU');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const materialClass = (name) => name.startsWith('Ясень') ? 'ash' : name.startsWith('Орех') ? 'walnut' : name.startsWith('Берёза') ? 'birch' : name.startsWith('Дуб') ? 'oak' : 'other';

const seedOrders = () => [
  { id: '0261', title: 'Стеллаж «Каскад»', client: 'Екатерина', due: offsetDate(4), created: offsetDate(0), material: 'Дуб натуральный', dimensions: '900 × 1800 × 350', stage: 'new', note: 'Открытые секции для книг и керамики.', kind: 'shelf' },
  { id: '0264', title: 'Тумба «Ось»', client: 'Игорь', due: offsetDate(6), created: offsetDate(0), material: 'Орех американский', dimensions: '1200 × 500 × 420', stage: 'new', note: 'Низкая тумба под медиатехнику.', kind: 'cabinet' },
  { id: '0262', title: 'Кухня «Лён»', client: 'Михаил', due: offsetDate(9), created: offsetDate(-1), material: 'Ясень', dimensions: '2400 × 2200 × 600', stage: 'design', note: 'Светлый шпон и открытая полка.', kind: 'kitchen' },
  { id: '0265', title: 'Рабочий стол «Рамка»', client: 'Ольга', due: offsetDate(11), created: offsetDate(-2), material: 'Дуб натуральный', dimensions: '1400 × 750 × 700', stage: 'design', note: 'Кабель-канал по заднему краю.', kind: 'desk' },
  { id: '0263', title: 'Шкаф «Борт»', client: 'Анна', due: offsetDate(13), created: offsetDate(-3), material: 'Дуб натуральный', dimensions: '1200 × 2200 × 600', stage: 'making', note: 'Рифлёные фасады и скрытые ручки.', kind: 'wardrobe' },
  { id: '0266', title: 'Комод «Север»', client: 'Павел', due: offsetDate(12), created: offsetDate(-4), material: 'Берёза', dimensions: '1000 × 900 × 450', stage: 'making', note: 'Три широких выдвижных ящика.', kind: 'dresser' },
];

function loadOrders() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.every((order) => order && typeof order.id === 'string' && stages.some((stage) => stage.id === order.stage))) return saved;
  } catch {}
  return seedOrders();
}
let orders = loadOrders();
let activeStage = 'all';
let thisWeek = false;
let query = '';
let editingId = null;
let toastTimer;

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch {}
}

function furnitureSketch(kind) {
  const common = 'fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"';
  const drawings = {
    shelf: '<path d="M19 13h76v105H19zM19 43h76M19 77h76M19 101h76M49 13v105M73 43v75M19 118l-7 7m83-7 7 7M49 13l-6-7M95 13l7-7"/>',
    cabinet: '<path d="M11 43h100v58H11zM11 43l14-15h100l-14 15M111 43l14-15v58l-14 15M11 72h100M61 43v58M15 101l-4 9m96-9 4 9M70 59h4"/>',
    kitchen: '<path d="M8 16h102v38H8zM8 72h102v41H8zM8 72l9-7h102l-9 7M42 72v41M76 72v41M42 16v38M76 16v38M52 75c0 11 20 11 20 0M60 72v-11c0-9 13-9 13 0"/>',
    desk: '<path d="M8 43h113v11H8zM8 43l14-12h113l-14 12M121 43l14-12v11l-14 12M20 54v68M110 54v68M20 122h11m79 0h11M31 54v41m68-41v41"/>',
    wardrobe: '<path d="M22 9h91v117H22zM22 9l-9 8v117l9-8M22 126l-9 8h91l9-8M67 9v117M59 63v13M75 63v13M113 9l-9 8v117M22 43h91"/>',
    dresser: '<path d="M14 24h107v94H14zM14 24l12-9h107l-12 9M121 24l12-9v94l-12 9M14 55h107M14 86h107M64 39h10M64 70h10M64 101h10M22 118v7m91-7v7"/>',
  };
  return `<svg viewBox="0 0 145 140" aria-hidden="true" ${common}>${drawings[kind] || drawings.cabinet}</svg>`;
}

function filteredOrders() {
  return orders.filter((order) => {
    const stageMatches = activeStage === 'all' || order.stage === activeStage;
    const text = `${order.id} ${order.title} ${order.client} ${order.material}`.toLocaleLowerCase('ru-RU');
    const searchMatches = text.includes(query);
    const daysLeft = Math.round((parseDate(order.due) - today) / 86400000);
    const weekMatches = !thisWeek || (daysLeft >= 0 && daysLeft <= 7);
    return stageMatches && searchMatches && weekMatches;
  });
}

function ticket(order, mobile = false) {
  const dueDays = Math.round((parseDate(order.due) - today) / 86400000);
  const status = stages.find((stage) => stage.id === order.stage)?.name || order.stage;
  return `<button class="ticket" type="button" data-id="${escapeHtml(order.id)}" aria-label="Открыть заказ ${escapeHtml(order.title)}">
    <div class="ticket-top"><span><i aria-hidden="true"></i>№ ${escapeHtml(order.id)}</span><span class="ticket-created">${escapeHtml(fullDate(order.created))}</span><span class="mobile-stage">${escapeHtml(status)}</span></div>
    <h3>${escapeHtml(order.title)}</h3><div class="ticket-info"><span>${escapeHtml(order.client)}</span><span class="due ${dueDays > 7 ? 'later' : ''}">до ${escapeHtml(shortDate(order.due))}</span></div>
    <div class="ticket-sketch">${furnitureSketch(order.kind)}</div>
    <div class="ticket-material"><span class="swatch ${materialClass(order.material)}" aria-hidden="true"></span><small>${escapeHtml(order.material)}</small></div>
  </button>`;
}

function noResults() {
  return '<div class="no-results"><h2>Таких заказов пока нет</h2><p>Попробуйте другой поиск или сбросьте фильтры.</p><button type="button" data-reset-filters>Сбросить фильтры</button></div>';
}

function render() {
  const visible = filteredOrders();
  $('#rail-counts').innerHTML = `<dl><dt>Все заказы</dt><dd>${orders.length}</dd>${stages.map((stage) => `<dt>${stage.name}</dt><dd>${orders.filter((order) => order.stage === stage.id).length}</dd>`).join('')}</dl>`;
  const visibleStages = activeStage === 'all' ? stages : stages.filter((stage) => stage.id === activeStage);
  $('#board').classList.toggle('single-column', visibleStages.length === 1);
  $('#board').innerHTML = visible.length ? visibleStages.map((stage) => {
    const inLane = visible.filter((order) => order.stage === stage.id).sort((a, b) => a.due.localeCompare(b.due));
    const empty = `<div class="empty-lane"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="22"/><path d="m18 30 8 8 17-18"/></svg><strong>${stage.id === 'done' ? 'Здесь будут готовые заказы' : 'Здесь пока пусто'}</strong><p>${stage.id === 'done' ? 'Когда заказ будет завершён, он появится здесь.' : 'Новый заказ можно добавить кнопкой выше.'}</p></div>`;
    return `<section class="lane" data-stage="${stage.id}" aria-label="${stage.name}"><div class="lane-head"><span class="lane-bar" aria-hidden="true"></span><div><h2>${stage.name}</h2><p>${stage.detail}</p></div><span class="lane-count">${inLane.length}</span></div><div class="lane-body">${inLane.map((order) => ticket(order)).join('')}</div>${inLane.length ? '' : empty}<button class="add-in-lane" data-add-stage="${stage.id}" type="button">＋ Добавить заказ</button></section>`;
  }).join('') : noResults();
  $('#mobile-filters').innerHTML = [{ id: 'all', name: 'Все' }, ...stages].map((stage) => `<button type="button" data-stage="${stage.id}" aria-pressed="${activeStage === stage.id}">${stage.name}</button>`).join('');
  const mobileSorted = [...visible].sort((a, b) => stages.findIndex((stage) => stage.id === a.stage) - stages.findIndex((stage) => stage.id === b.stage) || a.due.localeCompare(b.due));
  $('#mobile-orders').innerHTML = mobileSorted.length ? mobileSorted.map((order) => ticket(order, true)).join('') : noResults();
  $('#orders-subtitle').textContent = visible.length ? `${visible.length} ${pluralOrders(visible.length)} на доске` : 'Измените поиск или фильтры.';
}

function pluralOrders(count) {
  const last = count % 10, teen = count % 100;
  return teen >= 11 && teen <= 14 ? 'заказов' : last === 1 ? 'заказ' : last >= 2 && last <= 4 ? 'заказа' : 'заказов';
}

function showToast(message) {
  const node = $('#toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 3200);
}

function showDialog(id = null, defaultStage = 'new') {
  editingId = id;
  const order = id ? orders.find((item) => item.id === id) : null;
  $('#dialog-id').textContent = order ? `№ ${order.id}` : 'Новый заказ';
  $('#dialog-title').textContent = order ? order.title : 'Добавить заказ';
  $('#field-title').value = order?.title || '';
  $('#field-client').value = order?.client || '';
  $('#field-due').value = order?.due || offsetDate(14);
  $('#field-material').value = order?.material || 'Дуб натуральный';
  $('#field-dimensions').value = order?.dimensions || '';
  $('#field-stage').value = order?.stage || defaultStage;
  $('#field-note').value = order?.note || '';
  $('#dialog-sketch').innerHTML = order ? furnitureSketch(order.kind) : furnitureSketch('cabinet');
  $('#save-order').textContent = order ? 'Сохранить изменения' : 'Создать заказ';
  $('#advance-order').hidden = !order;
  $('#advance-order').disabled = order?.stage === 'done';
  $('#form-error').textContent = '';
  $('#order-form').querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
  $('#order-dialog').showModal();
  $('#field-title').focus();
}

function gatherForm() {
  const title = $('#field-title').value.trim(), client = $('#field-client').value.trim(), due = $('#field-due').value;
  let invalid = null;
  for (const [field, ok] of [[$('#field-title'), title.length >= 3], [$('#field-client'), client.length >= 2], [$('#field-due'), Boolean(due)]]) {
    field.setAttribute('aria-invalid', String(!ok));
    if (!ok && !invalid) invalid = field;
  }
  if (invalid) {
    $('#form-error').textContent = 'Заполните название, имя клиента и срок.';
    invalid.focus();
    return null;
  }
  $('#form-error').textContent = '';
  return { title, client, due, material: $('#field-material').value, dimensions: $('#field-dimensions').value.trim(), stage: $('#field-stage').value, note: $('#field-note').value.trim() };
}

function saveOrder(advance = false) {
  const values = gatherForm(); if (!values) return;
  if (advance) {
    const index = stages.findIndex((stage) => stage.id === values.stage);
    if (index < stages.length - 1) values.stage = stages[index + 1].id;
  }
  const previous = editingId && orders.find((order) => order.id === editingId);
  if (previous) {
    Object.assign(previous, values);
  } else {
    const nextId = String(Math.max(...orders.map((order) => Number(order.id)).filter(Number.isFinite), 260) + 1).padStart(4, '0');
    orders.push({ id: nextId, created: offsetDate(0), kind: guessKind(values.title), ...values });
  }
  persist(); render(); $('#order-dialog').close();
  showToast(previous ? advance ? 'Заказ переведён в следующий этап' : 'Изменения сохранены' : 'Заказ создан');
}

function guessKind(title) {
  const lower = title.toLocaleLowerCase('ru-RU');
  return lower.includes('стеллаж') || lower.includes('полк') ? 'shelf' : lower.includes('кухн') ? 'kitchen' : lower.includes('шкаф') ? 'wardrobe' : lower.includes('стол') ? 'desk' : lower.includes('комод') ? 'dresser' : 'cabinet';
}

function clearFilters() {
  query = ''; activeStage = 'all'; thisWeek = false;
  $('#search').value = ''; $('#stage-filter').value = 'all'; $('#week-filter').setAttribute('aria-pressed', 'false');
  render();
}

$('#today-date').textContent = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
$('#today-weekday').textContent = today.toLocaleDateString('ru-RU', { weekday: 'long' });
$('#search').addEventListener('input', (event) => { query = event.target.value.trim().toLocaleLowerCase('ru-RU'); render(); });
$('#stage-filter').addEventListener('change', (event) => { activeStage = event.target.value; render(); });
$('#week-filter').addEventListener('click', () => { thisWeek = !thisWeek; $('#week-filter').setAttribute('aria-pressed', String(thisWeek)); render(); });
$('#mobile-filters').addEventListener('click', (event) => { const button = event.target.closest('[data-stage]'); if (!button) return; activeStage = button.dataset.stage; $('#stage-filter').value = activeStage; render(); });
$('#add-order').addEventListener('click', () => showDialog(null, activeStage === 'all' ? 'new' : activeStage));
for (const selector of ['#board', '#mobile-orders']) $(selector).addEventListener('click', (event) => {
  const card = event.target.closest('[data-id]'); if (card) return showDialog(card.dataset.id);
  const add = event.target.closest('[data-add-stage]'); if (add) return showDialog(null, add.dataset.addStage);
  if (event.target.closest('[data-reset-filters]')) clearFilters();
});
$('#close-dialog').addEventListener('click', () => $('#order-dialog').close());
$('#order-form').addEventListener('submit', (event) => { event.preventDefault(); saveOrder(); });
$('#advance-order').addEventListener('click', () => saveOrder(true));
$('#order-form').addEventListener('input', (event) => { if (event.target.matches('input,select,textarea')) event.target.removeAttribute('aria-invalid'); });
$('#reset-demo').addEventListener('click', () => {
  if (!confirm('Сбросить локальные демо-заказы к исходному виду?')) return;
  orders = seedOrders(); persist(); clearFilters(); showToast('Демо-заказы восстановлены');
});
render();
