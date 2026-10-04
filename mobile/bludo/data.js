window.BludoData = {
  products: [
    {id:'chicken',name:'Боул с курицей',price:640,weight:'420 г',category:'Боулы',image:'assets/chicken.png',description:'Рис, курица, эдамаме, морковь, красная капуста и кунжут.'},
    {id:'udon',name:'Удон с овощами',price:590,weight:'350 г',category:'Лапша',image:'assets/udon.png',description:'Лапша удон, брокколи, сладкий перец, стручковая фасоль и соус.'},
    {id:'tofu',name:'Боул с тофу',price:560,weight:'420 г',category:'Боулы',image:'assets/tofu.png',description:'Рис, тофу, авокадо, эдамаме и кунжут.'},
    {id:'salad',name:'Салат с нутом',price:490,weight:'250 г',category:'Салаты',image:'assets/salad.png',description:'Листья салата, томаты, огурец, запечённый нут и кунжут.'},
    {id:'lemonade',name:'Лимонад лимон-мята',price:220,weight:'400 мл',category:'Напитки',image:'assets/lemonade.png',description:'Лимон, мята, вода и лёд.'},
  ],
  categories:['Все','Боулы','Лапша','Салаты','Напитки'],
  stages:['Принят','Готовим','В пути','Доставлен'],
  stageNotes:['Демо-заказ сохранён в этом браузере','Моделируем приготовление блюд','Моделируем доставку по указанному адресу','Сценарий доставки завершён'],
};
window.BludoMoney=value=>new Intl.NumberFormat('ru-RU').format(value)+' ₽';
window.BludoEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
