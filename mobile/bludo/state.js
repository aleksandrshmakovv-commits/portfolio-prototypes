window.BludoStore=(()=>{
 const cartKey='bludo-cart-v1',orderKey='bludo-order-v1';
 let cart=[],order=null,persistent=true;
 const product=id=>BludoData.products.find(p=>p.id===id);
 try {
  const raw=JSON.parse(localStorage.getItem(cartKey)||'[]');
  if(Array.isArray(raw))cart=raw.filter(p=>p&&product(p.id)&&Number.isInteger(p.qty)&&p.qty>=1&&p.qty<=9).filter((p,i,a)=>a.findIndex(q=>q.id===p.id)===i).map(p=>({id:p.id,qty:p.qty}));
  const o=JSON.parse(localStorage.getItem(orderKey)||'null');
  if(o&&typeof o.id==='string'&&o.id.length<60&&typeof o.address==='string'&&o.address.length<=160&&Array.isArray(o.items)&&o.items.length>0&&o.items.length<=5&&o.items.every(p=>p&&product(p.id)&&Number.isInteger(p.qty)&&p.qty>=1&&p.qty<=9)&&Number.isInteger(o.stage)&&o.stage>=0&&o.stage<=3) {
   const items=o.items.map(p=>({id:p.id,qty:p.qty}));const sum=totals(items);
   order={id:o.id,address:o.address,items,stage:o.stage,total:sum.total,created:typeof o.created==='string'?o.created.slice(0,40):''};
  }
 }catch{persistent=false;}
 function write(){try{localStorage.setItem(cartKey,JSON.stringify(cart));localStorage.setItem(orderKey,JSON.stringify(order));return true;}catch{persistent=false;return false;}}
 function totals(items=cart){const subtotal=items.reduce((s,row)=>s+product(row.id).price*row.qty,0);const delivery=subtotal===0||subtotal>=1500?0:190;return{subtotal,delivery,total:subtotal+delivery,count:items.reduce((s,r)=>s+r.qty,0)};}
 return {
  product,totals,cart:()=>cart.map(p=>({...p})),order:()=>order?JSON.parse(JSON.stringify(order)):null,persistent:()=>persistent,
  add(id){if(!product(id))return false;const row=cart.find(p=>p.id===id);if(row?.qty===9)return false;if(row)row.qty++;else cart.push({id,qty:1});write();return true;},
  step(id,delta){const row=cart.find(p=>p.id===id);if(!row)return;row.qty=Math.min(9,row.qty+delta);if(row.qty<=0)cart=cart.filter(p=>p.id!==id);write();},
  remove(id){cart=cart.filter(p=>p.id!==id);write();},
  checkout(address){if(!cart.length)return null;const summary=totals();order={id:'БД-'+Date.now().toString(36).toUpperCase(),address,items:cart.map(p=>({...p})),stage:0,total:summary.total,created:new Date().toISOString()};cart=[];write();return this.order();},
  advance(){if(order&&order.stage<3){order.stage++;write();}},
 };
})();
