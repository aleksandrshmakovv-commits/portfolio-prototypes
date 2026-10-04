/* Public demo: bounded lexical retrieval in session memory, no requests/model. */
(() => {
  const STOP = new Set('и в во не на что как к ко из за у о об от до по для это этот эта эти то а но или же мы вы они он она оно с со при ли бы уже все где когда какой какие сколько чего чем чём их его ее её мне меня ваш ваши нужно надо пожалуйста расскажи покажи'.split(' '));
  const SUFFIX = /(иями|ями|ами|ого|ему|ому|ими|ыми|его|иях|ах|ях|иям|ием|ость|ости|ать|ять|ить|ется|ются|ет|ют|ут|ем|ом|ей|ий|ый|ая|ое|ые|ие|ую|юю|ых|их|ов|ев|ам|ям|ия|ию|ии|а|я|ы|и|у|ю|е|о|ь)$/;
  function fail(code, message) { const error = Error(message); error.code = code; throw error; }
  function bounded(value, label, maximum) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum || value.includes('\0')) fail('invalid_input', 'Проверьте поле «' + label + '».');
    return value.trim();
  }
  const paragraphs = text => text.trim().split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const terms = text => (text.toLowerCase().replace(/ё/g, 'е').match(/[a-zа-я0-9]+/g) || []).filter(t => t.length > 1 && !STOP.has(t)).map(t => t.length >= 5 ? t.replace(SUFFIX, '') : t);
  function ask(payload) {
    if (!payload || typeof payload !== 'object') fail('invalid_input', 'Ожидается объект с вопросом и документами.');
    const question = bounded(payload.question, 'вопрос', 1000);
    if (payload.mode && payload.mode !== 'search') fail('ai_not_connected', 'ИИ не подключён. Используйте поиск по словам.');
    if (!Array.isArray(payload.documents) || !payload.documents.length || payload.documents.length > 5) fail('document_limit', 'Добавьте от 1 до 5 документов.');
    const ids = new Set(); let total = 0; const rows = [];
    for (const doc of payload.documents) {
      const id = bounded(doc?.id, 'ID', 80), name = bounded(doc?.name, 'имя файла', 180), text = bounded(doc?.text, 'текст', 120000);
      if (ids.has(id)) fail('duplicate_id', 'Документы должны иметь разные ID.'); ids.add(id); total += text.length;
      paragraphs(text).forEach((quote, index) => rows.push({ document_id: id, document_name: name, paragraph: index + 1, quote, tokens: terms(quote) }));
    }
    if (total > 120000) fail('text_too_large', 'Общий объём документов — до 120 000 символов.');
    const query = new Set(terms(question));
    const frequency = Object.fromEntries([...query].map(term => [term, rows.filter(row => row.tokens.includes(term)).length]));
    const matches = [];
    for (const row of rows) {
      const overlap = [...query].filter(term => row.tokens.includes(term)); if (!overlap.length) continue;
      const score = overlap.reduce((sum, term) => sum + (1 + Math.log((rows.length + 1) / (frequency[term] + 1))) * (1 + Math.min(row.tokens.filter(t => t === term).length, 3) * .1), 0) * (.8 + .2 * overlap.length / query.size);
      const {tokens, ...citation} = row; matches.push({...citation, score: Number(score.toFixed(4))});
    }
    matches.sort((a,b) => b.score - a.score || a.document_name.localeCompare(b.document_name, 'ru') || a.paragraph - b.paragraph);
    const citations = matches.slice(0,5).map((row, index) => ({number:index + 1, ...row}));
    return {ok:true, mode:'search', label:'Поиск в браузере', matched:!!citations.length, citations};
  }
  function extract(payload) {
    const filename = bounded(payload?.filename, 'имя файла', 180);
    if (/[\\/]/.test(filename)) fail('invalid_filename', 'Используйте имя файла без пути.');
    if (!/\.(txt|md)$/i.test(filename)) fail('unsupported_format', 'В публичном демо — TXT и MD в UTF-8. DOCX требует отдельной серверной версии.');
    const encoded = payload.content_base64;
    if (typeof encoded !== 'string' || encoded.length > 2796204) fail('file_too_large', 'Максимальный размер файла — 2 МБ.');
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) fail('invalid_base64', 'Данные файла повреждены.');
    const raw = atob(encoded), bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
    if (bytes.length > 2097152) fail('file_too_large', 'Максимальный размер файла — 2 МБ.');
    let text; try { text = new TextDecoder('utf-8', {fatal:true}).decode(bytes).replace(/\r\n?/g,'\n').trim(); } catch {fail('encoding', 'Сохраните файл в UTF-8.');}
    if (!text) fail('empty_document', 'Документ не содержит текста.');
    if (text.includes('\0')) fail('invalid_document', 'Документ содержит двоичные данные.');
    if (text.length > 120000) fail('text_too_large', 'В документе больше 120 000 символов.');
    return {ok:true, document:{name:filename,text,characters:text.length,paragraphs:paragraphs(text).length}};
  }
  globalThis.IstokLocal = Object.freeze({ask,extract,async api(path,payload){if(path==='ask')return ask(payload);if(path==='extract')return extract(payload);fail('unknown_action','Неизвестное локальное действие.');}});
})();
