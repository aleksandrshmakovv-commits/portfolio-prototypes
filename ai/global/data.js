(function (root) {
  'use strict';
  function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  root.GlobalData = freeze({
    school: { name: 'Global', disclaimer: 'Модельная онлайн-школа. Все ученики, обращения и правила вымышлены.', mode: 'Демо-сценарий · модель не подключена' },
    courses: [
      { id: 'ux', title: 'UX/UI-дизайн', cohort: 'Осень 2026', modules: 12 },
      { id: 'python', title: 'Python с нуля', cohort: 'Осень 2026', modules: 10 },
      { id: 'marketing', title: 'Маркетинг и аналитика', cohort: 'Осень 2026', modules: 8 }
    ],
    students: [
      { id: 'ST-101', name: 'Анна Морозова', courseId: 'ux', payment: 'paid', access: 'blocked', progress: 38, homeworkAccepted: 4, homeworkTotal: 12, finalAccepted: false },
      { id: 'ST-102', name: 'Михаил Орлов', courseId: 'python', payment: 'paid', access: 'active', progress: 54, homeworkAccepted: 5, homeworkTotal: 10, finalAccepted: false },
      { id: 'ST-103', name: 'Елена Белова', courseId: 'marketing', payment: 'paid', access: 'active', progress: 100, homeworkAccepted: 8, homeworkTotal: 8, finalAccepted: true },
      { id: 'ST-104', name: 'Игорь Волков', courseId: 'ux', payment: 'paid', access: 'active', progress: 16, homeworkAccepted: 2, homeworkTotal: 12, finalAccepted: false }
    ],
    tickets: [
      { id: 'GL-2401', category: 'access', studentId: 'ST-101', subject: 'Оплатила курс, но уроки закрыты', message: 'Здравствуйте! Оплатила UX/UI-дизайн, но уроки всё ещё закрыты. Помогите открыть доступ.', time: '09:42', priority: 'Высокий', channel: 'Чат школы' },
      { id: 'GL-2402', category: 'homework', studentId: 'ST-102', subject: 'Не успеваю сдать домашнее задание', message: 'Не успеваю сдать домашку до дедлайна. Как отправить работу позже и сколько ждать проверку?', time: '09:36', priority: 'Обычный', channel: 'Чат школы' },
      { id: 'GL-2403', category: 'certificate', studentId: 'ST-103', subject: 'Где получить сертификат?', message: 'Все уроки прошла и финальную работу приняли. Где найти сертификат?', time: '09:21', priority: 'Обычный', channel: 'Чат школы' },
      { id: 'GL-2404', category: 'refund', studentId: 'ST-104', subject: 'Хочу оформить возврат', message: 'Хочу вернуть оплату за курс. Подскажите, как оформить возврат денег.', time: '09:14', priority: 'Высокий', channel: 'Почта' },
      { id: 'GL-2405', category: 'identity', studentId: 'ST-999', subject: 'Не могу войти в личный кабинет', message: 'Купил курс, но не могу войти в кабинет. Найдите мою учётную запись.', time: '08:58', priority: 'Обычный', channel: 'Чат школы' },
      { id: 'GL-2406', category: 'unknown', studentId: 'ST-102', subject: 'Перенос обучения в зарубежный филиал', message: 'Можно перенести моё обучение в зарубежный филиал и зачесть его в университете?', time: '08:41', priority: 'Обычный', channel: 'Почта' }
    ],
    knowledge: [
      { id: 'KB-01', title: 'Доступ к оплаченному курсу', category: 'access', keywords: ['доступ', 'оплат', 'урок', 'закрыт', 'кабинет', 'войти'], text: 'В демо-школе оплаченный курс должен быть доступен в личном кабинете. Если оплата отмечена как подтверждённая, а доступ заблокирован, оператор проверяет запись ученика и подтверждает локальное восстановление доступа. Прототип не изменяет реальные аккаунты.' },
      { id: 'KB-02', title: 'Домашние задания и дедлайны', category: 'homework', keywords: ['домаш', 'домашк', 'дедлайн', 'сдать', 'работ', 'проверк'], text: 'В модельной школе домашнюю работу можно отправить после дедлайна через раздел «Задания». Проверка занимает до трёх рабочих дней. Индивидуальное продление сроков финального проекта согласуется с куратором.' },
      { id: 'KB-03', title: 'Сертификат об окончании', category: 'certificate', keywords: ['сертификат', 'оконча', 'финаль', 'прошла'], text: 'В демо-школе сертификат появляется в разделе «Документы» после принятия всех обязательных домашних работ и финального проекта. Если условия не выполнены, оператор перечисляет незакрытые работы. Прототип не выпускает настоящий сертификат.' },
      { id: 'KB-04', title: 'Обращение по возврату', category: 'refund', keywords: ['возврат', 'вернуть', 'деньг', 'отмен', 'оплат'], text: 'Запрос на возврат передаётся сотруднику школы. Оператор регистрирует обращение, но не принимает финансовое решение, не обещает сумму или срок возврата и не выполняет денежные операции. Это сценарий портфолио, не условия реальной школы.' },
      { id: 'KB-05', title: 'Поиск учётной записи', category: 'identity', keywords: ['учётн', 'учетн', 'найдите', 'аккаунт', 'почт', 'войти'], text: 'Если запись ученика не найдена, оператор просит адрес электронной почты, использованный при записи, и название курса. Пароли, коды входа и банковские данные не запрашиваются. До проверки личности доступ не изменяется.' },
      { id: 'KB-06', title: 'Передача нестандартного вопроса', category: 'unknown', keywords: [], text: 'Если в базе знаний нет подходящего ответа, обращение передаётся сотруднику. Оператор сохраняет вопрос и контекст, не придумывает условия и не обещает результат.' }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
