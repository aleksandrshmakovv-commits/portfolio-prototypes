const form = document.getElementById('project-form');
const status = document.getElementById('form-status');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  status.textContent = '';
  const fields = Array.from(form.querySelectorAll('input, textarea'));
  let firstInvalid = null;
  for (const field of fields) {
    const valid = field.value.trim().length >= Math.max(1, field.minLength);
    field.setAttribute('aria-invalid', String(!valid));
    if (!valid && !firstInvalid) firstInvalid = field;
  }
  if (firstInvalid) {
    status.textContent = 'Заполните все поля: имя, способ связи и описание проекта.';
    firstInvalid.focus();
    return;
  }
  status.textContent = 'Демо-запрос заполнен. Данные никуда не отправлялись.';
});

form.addEventListener('input', (event) => {
  if (event.target.matches('input, textarea')) event.target.removeAttribute('aria-invalid');
});
