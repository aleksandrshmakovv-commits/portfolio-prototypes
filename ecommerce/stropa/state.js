window.StropaStore = (() => {
  const KEY = 'stropa-cart-v1';
  const { byKey } = window.StropaData;
  let cart = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const product = item && byKey(item.key);
        if (!product || !Number.isInteger(item.quantity) || item.quantity < 1) continue;
        const existing = cart.find(row => row.key === item.key);
        if (existing) existing.quantity = Math.min(product.stock, existing.quantity + item.quantity);
        else cart.push({ key: item.key, quantity: Math.min(product.stock, item.quantity) });
      }
    }
  } catch { cart = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* Cart remains usable in this tab. */ } };
  const rows = () => cart.map(item => ({ ...byKey(item.key), quantity: item.quantity }));
  const count = () => cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = () => rows().reduce((total, item) => total + item.price * item.quantity, 0);
  const delivery = method => count() === 0 || subtotal() >= 10000 ? 0 : method === 'courier' ? 500 : 300;
  const add = (key, quantity = 1) => {
    const product = byKey(key);
    if (!product || !Number.isInteger(quantity) || quantity < 1) return 0;
    const existing = cart.find(row => row.key === key);
    const current = existing?.quantity || 0;
    const added = Math.min(product.stock - current, quantity);
    if (added <= 0) return 0;
    if (existing) existing.quantity += added;
    else cart.push({ key, quantity: added });
    save(); return added;
  };
  const change = (key, delta) => {
    const row = cart.find(item => item.key === key), product = byKey(key);
    if (!row || !product || !Number.isInteger(delta)) return;
    row.quantity = Math.max(1, Math.min(product.stock, row.quantity + delta)); save();
  };
  const remove = key => { cart = cart.filter(row => row.key !== key); save(); };
  const clear = () => { cart = []; save(); };
  return { rows, count, subtotal, delivery, add, change, remove, clear };
})();
