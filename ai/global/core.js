(function (root) {
  'use strict';
  const data = root.GlobalData;
  if (!data) throw new Error('GlobalData must be loaded before GlobalCore');
  const issued = new WeakMap();
  const states = new WeakSet();
  const clone = value => JSON.parse(JSON.stringify(value));
  const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  const normalize = text => String(text || '').normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  function searchKnowledge(query, category) {
    const words = normalize(query).split(' ').filter(word => word.length > 2);
    return data.knowledge.map(doc => {
      const score = doc.keywords.reduce((n, keyword) => n + (words.some(word => word.startsWith(normalize(keyword))) ? 1 : 0), 0);
      return { id: doc.id, title: doc.title, quote: doc.text, category: doc.category, score };
    }).filter(hit => hit.score > 0 && (!category || hit.category === category)).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  }
  function classify(message) {
    const value = normalize(message);
    const has = regex => regex.test(value);
    if (has(/возврат|верну(?:ть|л|ла)|верните|деньг/)) return 'refund';
    if (has(/сертификат/)) return 'certificate';
    if (has(/домаш|дедлайн|сдать|проверка работ/)) return 'homework';
    if (has(/доступ|урок.*закрыт|войти|кабинет|учетн|аккаунт/)) return 'access';
    return 'unknown';
  }
  function error(code, message) { const err = new Error(message); err.code = code; throw err; }
  function analyze(input) {
    if (!input || typeof input.ticketId !== 'string') error('INVALID_INPUT', 'Укажите номер обращения.');
    const ticket = data.tickets.find(item => item.id === input.ticketId);
    if (!ticket) error('TICKET_NOT_FOUND', 'Обращение не найдено.');
    if (input.message !== undefined && (typeof input.message !== 'string' || input.message.trim().length === 0 || input.message.length > 6000)) error('INVALID_MESSAGE', 'Текст должен содержать от 1 до 6000 символов.');
    if (input.studentId !== undefined && typeof input.studentId !== 'string') error('INVALID_STUDENT', 'Некорректный идентификатор ученика.');
    if (input.forceEscalate !== undefined && typeof input.forceEscalate !== 'boolean') error('INVALID_ESCALATION', 'Ручная передача задаётся логическим значением.');
    const message = input.message === undefined ? ticket.message : input.message.trim();
    const studentId = input.studentId === undefined ? ticket.studentId : input.studentId;
    const student = data.students.find(item => item.id === studentId) || null;
    const course = student ? data.courses.find(item => item.id === student.courseId) || null : null;
    const steps = [];
    const step = (tool, title, args, output) => steps.push({ tool, title, input: clone(args), output: clone(output) });
    // Message content is never interpreted as code or tool instructions.
    const instructionLike = /игнорир\S*\s+(?:правил|инструкц)|ignore\s+(?:all\s+)?(?:previous|instructions)|system\s*prompt|выполни\s+(?:команд|код)|обойди\s+подтвержд/i.test(message);
    let category = classify(message);
    step('classify_rules', 'Определить тему по фиксированным правилам', { message }, { category, instructionLike, method: 'Детерминированные ключевые слова, не языковая модель' });
    step('lookup_student', 'Найти модельную запись ученика', { studentId }, { found: !!student, student: student ? clone(student) : null });
    if (!student && category !== 'refund') category = 'identity';
    if (instructionLike && student && category !== 'refund') category = 'unknown';
    if (input.forceEscalate && category !== 'refund') category = 'unknown';
    step('route_policy', 'Применить правило передачи и проверки личности', { studentFound: !!student, instructionLike, forceEscalate: !!input.forceEscalate }, { category, financialDecisionByHuman: category === 'refund' });
    const hits = searchKnowledge(message, category);
    let source = hits[0] || null;
    // Identity and escalation policies are routing rules, not invented search hits.
    if (!source && (category === 'identity' || category === 'unknown')) source = data.knowledge.find(doc => doc.category === category);
    step('search_knowledge', 'Найти правило в базе знаний', { query: message, category }, { matches: hits.map(hit => ({ id: hit.id, score: hit.score })), policyId: hits.length ? null : source ? source.id : null });
    let draft, reason, action, status;
    if (category === 'identity') {
      status = 'clarification'; reason = 'Запись ученика отсутствует в модельном реестре.';
      draft = 'Здравствуйте! Чтобы найти вашу запись, уточните адрес электронной почты, использованный при записи, и название курса. Пароли, коды входа и банковские данные присылать не нужно.';
      action = { type: 'reply', label: 'Подтвердить запрос уточнения', requiresApproval: true, localOnly: true };
    } else if (category === 'refund' || category === 'unknown') {
      status = 'escalation'; reason = category === 'refund' ? 'Финансовое решение принимает сотрудник, не прототип.' : input.forceEscalate ? 'Оператор выбрал ручную передачу обращения сотруднику.' : instructionLike ? 'Текст содержит инструкции оператору; они не управляют инструментами. Требуется сотрудник.' : 'В базе нет подходящего предметного ответа.';
      draft = category === 'refund' ? 'Здравствуйте! Передадим ваш запрос на возврат сотруднику школы для рассмотрения. Решение, сумма и сроки этим прототипом не определяются.' : 'Здравствуйте! По вашему вопросу в базе знаний нет подтверждённого ответа. Передадим обращение сотруднику школы вместе с контекстом.';
      action = { type: 'escalate', label: 'Подтвердить передачу сотруднику', queue: category === 'refund' ? 'Финансовые вопросы' : 'Поддержка школы', requiresApproval: true, localOnly: true };
      step('prepare_escalation', 'Подготовить локальное обращение сотруднику', { ticketId: ticket.id, category }, { queue: action.queue, reason, financialOperation: false });
    } else if (category === 'access') {
      const eligible = student.payment === 'paid' && student.access === 'blocked';
      step('check_course_access', 'Проверить оплату и доступ', { studentId, courseId: student.courseId }, { payment: student.payment, access: student.access, eligibleForLocalRestore: eligible });
      if (eligible) {
        status = 'approval'; reason = 'Оплата подтверждена, модельный доступ заблокирован. Изменение требует подтверждения оператора.';
        draft = 'Здравствуйте, ' + student.name.split(' ')[0] + '! В модельной записи оплата курса «' + course.title + '» подтверждена, но доступ заблокирован. Подготовлено локальное восстановление доступа; оператор должен подтвердить действие.';
        action = { type: 'restore_access', label: 'Подтвердить демо-восстановление', studentId, courseId: course.id, requiresApproval: true, localOnly: true };
      } else {
        status = 'escalation'; reason = 'Автоматическое демо-восстановление не требуется или условия не выполнены.';
        draft = 'Здравствуйте! Передадим вопрос о доступе сотруднику: модельная запись не соответствует условиям восстановления заблокированного оплаченного курса.';
        action = { type: 'escalate', label: 'Подтвердить передачу сотруднику', queue: 'Доступ к обучению', requiresApproval: true, localOnly: true };
      }
    } else if (category === 'certificate') {
      const eligible = student.homeworkAccepted === student.homeworkTotal && student.finalAccepted;
      step('check_completion', 'Проверить условия сертификата', { studentId }, { accepted: student.homeworkAccepted, total: student.homeworkTotal, finalAccepted: student.finalAccepted, eligible });
      status = 'draft'; reason = 'Ответ основан на правилах и модельном прогрессе ученика.';
      draft = eligible ? 'Здравствуйте, ' + student.name.split(' ')[0] + '! Все обязательные работы и финальный проект отмечены принятыми. В демо-школе сертификат доступен в разделе «Документы» личного кабинета. Этот прототип не выпускает настоящий сертификат.' : 'Здравствуйте! По модельной записи принято ' + student.homeworkAccepted + ' из ' + student.homeworkTotal + ' обязательных работ; финальный проект ' + (student.finalAccepted ? 'принят' : 'пока не принят') + '. Сертификат появляется после выполнения всех условий.';
      action = { type: 'reply', label: 'Подтвердить демо-ответ', requiresApproval: true, localOnly: true };
    } else {
      status = 'draft'; reason = 'Найдено правило для домашнего задания; индивидуальный срок не обещается.';
      draft = 'Здравствуйте, ' + student.name.split(' ')[0] + '! В модельной школе работу можно отправить после дедлайна через раздел «Задания». Проверка занимает до трёх рабочих дней. Продление срока финального проекта нужно согласовать с куратором.';
      action = { type: 'reply', label: 'Подтвердить демо-ответ', requiresApproval: true, localOnly: true };
    }
    step('prepare_draft', 'Собрать ответ для проверки оператором', { category, sourceIds: source ? [source.id] : [] }, { draft, action: action.type, requiresApproval: true, localOnly: true });
    const key = JSON.stringify([ticket.id, studentId, message, action.type]);
    const result = freeze({ id: ticket.id + ':' + category, ticketId: ticket.id, category, status, student: student ? clone(student) : null, course: course ? clone(course) : null, steps, sources: source ? [{ id: source.id, title: source.title, quote: source.quote || source.text }] : [], draft, action, reason, message });
    issued.set(result, { key, message, studentId });
    return result;
  }
  function recognizeState(state) { const result = freeze(state); states.add(result); return result; }
  function createState() { return recognizeState({ events: [], accessOverrides: {}, escalations: [], replies: [] }); }
  function commit(result, state, options) {
    if (!issued.has(result)) error('UNTRUSTED_RESULT', 'Подтверждается только неизменённый результат этого демо-ядра.');
    if (!states.has(state)) error('INVALID_STATE', 'Используйте состояние, созданное демо-ядром.');
    const draft = options && options.draft !== undefined ? options.draft : result.draft;
    if (typeof draft !== 'string' || !draft.trim() || draft.length > 6000) error('INVALID_DRAFT', 'Ответ должен содержать от 1 до 6000 символов.');
    const meta = issued.get(result);
    const existing = state.events.find(event => event.key === meta.key);
    if (existing) return freeze({ ok: true, duplicate: true, event: existing, state });
    const next = clone(state);
    const event = { id: 'DEMO-' + String(next.events.length + 1).padStart(3, '0'), key: meta.key, ticketId: result.ticketId, type: result.action.type, label: result.action.label, localOnly: true, message: meta.message, draft: draft.trim(), editedByOperator: draft !== result.draft };
    if (result.action.type === 'restore_access') {
      if (next.accessOverrides[result.action.studentId] === 'active') return freeze({ ok: true, duplicate: true, event: next.events.find(item => item.type === 'restore_access' && item.studentId === result.action.studentId) || null, state });
      next.accessOverrides[result.action.studentId] = 'active'; event.studentId = result.action.studentId;
    } else if (result.action.type === 'escalate') next.escalations.push({ eventId: event.id, ticketId: result.ticketId, queue: result.action.queue, reason: result.reason, message: meta.message });
    else next.replies.push({ eventId: event.id, ticketId: result.ticketId, draft: draft.trim() });
    next.events.push(event);
    return freeze({ ok: true, duplicate: false, event, state: recognizeState(next) });
  }
  root.GlobalCore = freeze({ analyze, commit, createState, searchKnowledge, classify, normalize });
})(typeof window !== 'undefined' ? window : globalThis);
