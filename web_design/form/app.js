'use strict';

const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const dayLabels = ['понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу', 'воскресенье'];
const timetable = [
  [['07:30','Силовая',55,'Зал 1'],['12:00','Pilates',50,'Студия'],['18:30','Функциональная',55,'Зал 2'],['20:00','Mobility',45,'Студия']],
  [['08:00','Mobility',45,'Студия'],['12:30','Функциональная',55,'Зал 2'],['18:00','Силовая',55,'Зал 1'],['19:30','Pilates',50,'Студия']],
  [['07:30','Функциональная',55,'Зал 2'],['12:00','Pilates',50,'Студия'],['18:30','Силовая',55,'Зал 1'],['20:00','Mobility',45,'Студия']],
  [['08:00','Pilates',50,'Студия'],['13:00','Силовая',55,'Зал 1'],['18:00','Функциональная',55,'Зал 2'],['19:30','Mobility',45,'Студия']],
  [['07:30','Силовая',55,'Зал 1'],['12:00','Mobility',45,'Студия'],['18:30','Функциональная',55,'Зал 2'],['20:00','Pilates',50,'Студия']],
  [['10:00','Функциональная',55,'Зал 2'],['12:00','Pilates',50,'Студия'],['16:00','Силовая',55,'Зал 1']],
  [['10:00','Mobility',45,'Студия'],['12:00','Pilates',50,'Студия'],['15:00','Силовая',55,'Зал 1']]
];
const plans = {start:{label:'START', monthly:{1:3900,3:3300,12:2900}},full:{label:'FULL',monthly:{1:5900,3:5300,12:4500}}};
const periods = {1:'1 месяц',3:'3 месяца',12:'12 месяцев'};
const money = value => new Intl.NumberFormat('ru-RU').format(value);
const dialog = document.getElementById('booking-dialog');
const form = document.getElementById('booking-form');
const entry = document.getElementById('booking-entry');
const success = document.getElementById('booking-success');
const submit = form.querySelector('[type="submit"]');
let selectedPeriod = 1;
let selectedContext = 'Пробная тренировка';
let returnFocus = null;
let submissionTimer = null;

function openBooking(context, trigger) {
  selectedContext = context;
  returnFocus = trigger;
  form.reset();
  entry.hidden = false;
  success.hidden = true;
  submit.disabled = false;
  submit.innerHTML = 'Проверить запись <span aria-hidden="true">↗</span>';
  document.getElementById('booking-description').textContent = context;
  dialog.setAttribute('aria-labelledby', 'booking-title');
  dialog.setAttribute('aria-describedby', 'booking-description');
  dialog.showModal();
  document.body.style.overflow = 'hidden';
}
function closeBooking() { dialog.close(); }
dialog.addEventListener('close', () => {
  window.clearTimeout(submissionTimer);
  document.body.style.overflow = '';
  form.reset();
  document.getElementById('success-summary').textContent = '';
  if(returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
});
document.querySelector('.dialog-close').addEventListener('click', closeBooking);
document.getElementById('success-close').addEventListener('click', closeBooking);
dialog.addEventListener('click', event => {
  if(event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeBooking();
});
document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => openBooking(button.dataset.book, button)));

function renderDay(day) {
  const list = document.getElementById('class-list');
  list.replaceChildren();
  list.setAttribute('aria-label', `Занятия в ${dayLabels[day]}`);
  timetable[day].forEach(([time, title, duration, room]) => {
    const row = document.createElement('div');
    row.className = 'class-row';
    for(const [className, content] of [['class-time',time],['class-name',title],['class-duration',`${duration} мин`],['class-room',room]]) {
      const node = document.createElement('span');
      node.className = className;
      node.textContent = content;
      row.append(node);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button class-book';
    button.setAttribute('aria-label', `Записаться: ${title}, ${time}`);
    button.innerHTML = 'Записаться <span aria-hidden="true">↗</span>';
    button.addEventListener('click', () => openBooking(`${days[day]}, ${time} · ${title} · ${duration} мин · ${room}`, button));
    row.append(button);
    list.append(row);
  });
  document.querySelectorAll('[data-day]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.day) === day)));
  document.getElementById('schedule-status').textContent = `${days[day]}: ${timetable[day].length} занятия в демо-расписании.`;
}
document.querySelectorAll('[data-day]').forEach(button => button.addEventListener('click', () => renderDay(Number(button.dataset.day))));
renderDay(0);

document.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
  selectedPeriod = Number(button.dataset.period);
  document.querySelectorAll('[data-period]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  for(const [key, plan] of Object.entries(plans)) {
    const monthly = plan.monthly[selectedPeriod];
    document.querySelector(`[data-price="${key}"]`).textContent = money(monthly);
    document.querySelector(`[data-total="${key}"]`).textContent = `${money(monthly * selectedPeriod)} ₽ за ${periods[selectedPeriod]}`;
  }
  document.getElementById('price-status').textContent = `Абонемент на ${periods[selectedPeriod]}. START: ${money(plans.start.monthly[selectedPeriod])} рублей в месяц. FULL: ${money(plans.full.monthly[selectedPeriod])} рублей в месяц.`;
}));
document.querySelectorAll('[data-plan]').forEach(button => button.addEventListener('click', () => {
  const plan = plans[button.dataset.plan];
  const total = plan.monthly[selectedPeriod] * selectedPeriod;
  openBooking(`${plan.label} · ${periods[selectedPeriod]} · ${money(total)} ₽ за весь период (демо-тариф)`, button);
}));

form.addEventListener('submit', event => {
  event.preventDefault();
  if(submit.disabled || !form.reportValidity()) return;
  const name = form.elements.name.value.trim();
  if(name.length < 2) {
    form.elements.name.setCustomValidity('Введи хотя бы два символа для примера имени.');
    form.elements.name.reportValidity();
    return;
  }
  submit.disabled = true;
  submit.textContent = 'Проверяем пример…';
  submissionTimer = window.setTimeout(() => {
    if(!dialog.open) return;
    document.getElementById('success-summary').textContent = `${name}, ты выбрал: ${selectedContext}.`;
    form.reset();
    entry.hidden = true;
    success.hidden = false;
    dialog.setAttribute('aria-labelledby', 'success-title');
    dialog.setAttribute('aria-describedby', 'success-summary');
    document.getElementById('success-title').focus();
  }, 350);
});
form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''));
const menu = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
function closeMenu() {menu.setAttribute('aria-expanded','false');navigation.classList.remove('is-open');menu.textContent='Меню';}
menu.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  navigation.classList.toggle('is-open', expanded);
  menu.textContent = expanded ? 'Закрыть' : 'Меню';
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {if(event.key === 'Escape') closeMenu();});
