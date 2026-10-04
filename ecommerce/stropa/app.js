(() => {
  const main = document.querySelector('#main');
  const { products, byKey } = StropaData;
  const state = { filters: { category: 'all', search: '', sort: 'default' }, delivery: 'pickup', draft: {}, quantity: 1, activeModel: '', order: null };
  let toastTimer, focusAfterRender = null, keepScroll = false;
  const updateCount = () => { document.querySelector('#cart-count').textContent = StropaStore.count(); };
  const hideToast = () => { document.querySelector('#toast').hidden = true; clearTimeout(toastTimer); };
  const toast = message => { document.querySelector('#toast-text').textContent = message; document.querySelector('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 4500); };
  function renderProducts() {
    const grid = document.querySelector('#product-grid');
    if (!grid) return;
    const query = state.filters.search.trim().toLocaleLowerCase('ru');
    let filtered = products.filter(item => (state.filters.category === 'all' || item.category === state.filters.category) && `${item.name} ${item.categoryName} ${item.color.name}`.toLocaleLowerCase('ru').includes(query));
    if (state.filters.sort !== 'default') filtered.sort((a,b)=>state.filters.sort==='price-asc'?a.price-b.price:b.price-a.price);
    grid.innerHTML = filtered.length ? filtered.map(StropaUI.card).join('') : StropaUI.noResults;
    document.querySelector('#product-count').textContent = `Товаров: ${filtered.length}`;
    document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', button.dataset.category === state.filters.category));
  }
  function activeProduct() {
    const parts = location.hash.slice(1).split('/');
    return parts[0] === 'product' ? byKey(`${parts[1]}-${parts[2]}`) : null;
  }
  function render(scroll = true) {
    const active = document.activeElement;
    let focusSelector = focusAfterRender;
    if (!focusSelector && !scroll && active?.matches('[data-cart-step]')) focusSelector = `.cart-row[data-key="${active.dataset.key}"] [data-cart-step="${active.dataset.cartStep}"]`;
    if (!focusSelector && !scroll && active?.matches('[name="delivery"]')) focusSelector = `[name="delivery"][value="${active.value}"]`;
    hideToast(); updateCount();
    const route = location.hash.slice(1) || 'catalog';
    if (route === 'cart') { main.innerHTML = StropaUI.cart(state); document.title = 'Корзина — СТРОПА'; }
    else if (route === 'success' && state.order) { main.innerHTML = StropaUI.success(state.order); document.title = 'Демо-заказ — СТРОПА'; }
    else if (route.startsWith('product/')) {
      const item = activeProduct();
      if (item && item.id !== state.activeModel) state.quantity = 1;
      state.activeModel = item?.id || '';
      main.innerHTML = item ? StropaUI.detail(item, state.quantity) : StropaUI.notFound;
      document.title = item ? `${item.name} — СТРОПА` : 'Модель не найдена — СТРОПА';
    } else { main.innerHTML = StropaUI.catalog(state.filters); renderProducts(); document.title = 'СТРОПА — рюкзаки и сумки для города'; }
    if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
    if (focusSelector) {
      let target = document.querySelector(focusSelector);
      if (target?.disabled) { target = target.closest('.stepper')?.querySelector('output'); if (target) target.tabIndex = -1; }
      target?.focus({ preventScroll: true });
    }
    focusAfterRender = null;
  }
  function add(key, quantity) {
    const added = StropaStore.add(key, quantity); updateCount();
    toast(added ? `${byKey(key).name} добавлен в корзину` : 'Максимум 8 штук одного цвета в демо-корзине');
  }
  function showInfo(type) {
    const isDelivery = type === 'delivery';
    document.querySelector('#info-title').textContent = isDelivery ? 'Доставка и возврат' : 'О СТРОПЕ';
    document.querySelector('#info-content').innerHTML = isDelivery ? '<p>Условия в демонстрационном магазине:</p><ul><li>Пункт выдачи — 300 ₽.</li><li>Курьер — 500 ₽.</li><li>От 10 000 ₽ — бесплатно для обоих способов.</li></ul><p>Это модельный сценарий. Реальные отправки, сроки доставки и возвраты не обрабатываются.</p>' : '<p>СТРОПА — вымышленный бренд рюкзаков и сумок для ежедневных городских маршрутов.</p><p>В этом портфолио-проекте можно выбрать цвет, сравнить модели, собрать корзину и пройти демо-оформление. Товары, характеристики и цены смоделированы.</p><p><a href="case.html">Посмотреть кейс проекта</a></p>';
    document.querySelector('#info-dialog').showModal();
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-category')) { state.filters.category = button.dataset.category; renderProducts(); }
    else if (button.hasAttribute('data-add')) add(button.dataset.add,1);
    else if (button.hasAttribute('data-scroll-catalog')) document.querySelector('#catalog-section').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth' });
    else if (button.hasAttribute('data-reset-filters')) { state.filters = { category: 'all', search: '', sort: 'default' }; document.querySelector('#catalog-search').value = ''; document.querySelector('#catalog-sort').value = 'default'; renderProducts(); }
    else if (button.hasAttribute('data-color')) {
      const item = activeProduct();
      if (item && item.color.id !== button.dataset.color && item.colors.some(color=>color.id===button.dataset.color)) {
        focusAfterRender = `${button.closest('.thumbnails') ? '.thumbnails' : '.color-choice'} [data-color="${button.dataset.color}"]`;
        keepScroll = true; location.hash = `product/${item.id}/${button.dataset.color}`;
      }
    }
    else if (button.hasAttribute('data-product-step')) {
      state.quantity = Math.max(1,Math.min(8,state.quantity+Number(button.dataset.productStep)));
      document.querySelector('#product-quantity').textContent = state.quantity;
      document.querySelector('[data-product-step="-1"]').disabled = state.quantity === 1;
      document.querySelector('[data-product-step="1"]').disabled = state.quantity === 8;
    } else if (button.id === 'add-product') add(button.dataset.key,state.quantity);
    else if (button.hasAttribute('data-cart-step')) { StropaStore.change(button.dataset.key,Number(button.dataset.cartStep)); render(false); }
    else if (button.hasAttribute('data-remove')) { StropaStore.remove(button.dataset.remove); render(false); }
    else if (button.id === 'start-checkout') { document.querySelector('#checkout-form').scrollIntoView({ behavior: 'instant' }); document.querySelector('[name="customer"]').focus({ preventScroll: true }); }
    else if (button.hasAttribute('data-info')) showInfo(button.dataset.info);
    else if (button.id === 'close-info') document.querySelector('#info-dialog').close();
    else if (button.id === 'close-toast') hideToast();
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'catalog-search') { state.filters.search = event.target.value; renderProducts(); }
    if (event.target.closest('#checkout-form') && event.target.type !== 'radio') { state.draft[event.target.name] = event.target.value; event.target.setCustomValidity(''); const error = document.querySelector('#checkout-error'); if(error) error.textContent = ''; }
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'catalog-sort') { state.filters.sort = event.target.value; renderProducts(); }
    if (event.target.name === 'delivery') { state.delivery = event.target.value === 'courier' ? 'courier' : 'pickup'; render(false); }
  });
  document.addEventListener('submit', event => {
    if (event.target.id !== 'checkout-form') return;
    event.preventDefault();
    const form = event.target;
    for (const name of ['customer','city','address']) { const field = form.elements[name]; field.setCustomValidity(field.value.trim().length < 2 ? 'Введите не менее двух символов.' : ''); }
    if (!form.checkValidity()) { document.querySelector('#checkout-error').textContent = 'Проверьте имя, email, город и адрес.'; form.reportValidity(); return; }
    if (!StropaStore.count()) { render(); return; }
    const shipping = StropaStore.delivery(state.delivery);
    state.order = { number: `DEMO-${String(Date.now()).slice(-6)}`, customer: form.elements.customer.value.trim(), rows: StropaStore.rows(), shipping, total: StropaStore.subtotal()+shipping };
    StropaStore.clear(); state.draft = {}; state.quantity = 1; updateCount(); location.hash = 'success';
  });
  document.querySelector('#info-dialog').addEventListener('click', event => {
    const dialog = event.currentTarget, rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  window.addEventListener('hashchange', () => { render(!keepScroll); keepScroll = false; });
  render();
})();
