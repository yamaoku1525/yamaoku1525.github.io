(() => {
  'use strict';
  const map = document.querySelector('.demo-map');
  if (map) {
    const spots = [...map.querySelectorAll('[data-spot]')];
    const names = ['ひらけた景色', '稜線のひと休み', '赤い屋根の小屋'];
    const messages = ['見上げた空を、一枚に。アプリでは、こんな景色に出会ったら安全な場所で撮影します。', '歩いてきた道を、ふり返るひととき。写真を登録すると、その日の発見が記録になります。', 'ひと休みした場所も、大切な思い出。山では帰りの時間と余力も忘れずに。'];
    const stampFiles = ['stamp_tsurugi', 'stamp_jiro', 'stamp_house'];
    const title = document.querySelector('#demo-title');
    const copy = document.querySelector('#demo-copy');
    const preview = document.querySelector('#demo-preview img');
    const peta = document.querySelector('#demo-peta');
    const collected = new Set();
    let selected = null;
    function selectSpot(index) {
      selected = index;
      spots.forEach((spot,i) => spot.setAttribute('aria-pressed', String(i === index)));
      title.textContent = names[index]; copy.textContent = messages[index];
      preview.src = 'assets/' + stampFiles[index] + '.webp'; preview.alt = names[index] + 'のスタンプ';
      peta.disabled = collected.has(index);
      peta.textContent = collected.has(index) ? 'この印は、ぺた済み！' : 'この景色を、ぺたっと';
    }
    spots.forEach((spot,i) => spot.addEventListener('click', () => {
      selectSpot(i);
      if (window.matchMedia('(max-width:700px)').matches) document.querySelector('.demo-panel').scrollIntoView({block:'start'});
    }));
    document.querySelector('#demo-next').addEventListener('click', () => {
      map.scrollIntoView({block:'start'});
      spots.find((spot,i) => !collected.has(i))?.focus({preventScroll:true});
    });
    peta.addEventListener('click', () => {
      if (selected === null || collected.has(selected)) return;
      collected.add(selected);
      spots[selected].classList.add('collected');
      spots[selected].setAttribute('aria-label', names[selected] + '：ぺた済み。もう一度見る');
      const slot = document.querySelector('[data-slot="'+selected+'"]');
      slot.replaceChildren(preview.cloneNode()); slot.classList.add('filled');
      slot.setAttribute('aria-label', names[selected] + '：ぺた済み');
      document.querySelector('#demo-status').textContent = collected.size + ' / 3 ぺた' + (collected.size === 3 ? '。全部そろったね！' : '。あと' + (3-collected.size) + 'つ、見つけよう。');
      document.querySelector('#demo-complete').hidden = collected.size !== 3;
      document.querySelector('#demo-next').hidden = collected.size === 3;
      selectSpot(selected);
    });
    document.querySelector('#demo-reset').addEventListener('click', () => {
      collected.clear(); selected = null;
      spots.forEach((spot,i) => { spot.classList.remove('collected'); spot.setAttribute('aria-pressed','false'); spot.setAttribute('aria-label',names[i]+'を選ぶ'); });
      document.querySelectorAll('[data-slot]').forEach((slot,i) => { slot.textContent = String(i+1); slot.classList.remove('filled'); slot.setAttribute('aria-label',names[i]+'：まだ'); });
      title.textContent = '気になる印を押してみよう。'; copy.textContent = '山のマップにある、丸い3つの印から選べます。';
      preview.src = 'assets/stamp_nearby.webp'; preview.alt = '近くのおでかけを楽しむスタンプ';
      peta.disabled = true; peta.textContent = 'マップから印を選んでね';
      document.querySelector('#demo-status').textContent = '0 / 3 ぺた';
      document.querySelector('#demo-complete').hidden = true;
      document.querySelector('#demo-next').hidden = true;
      map.scrollIntoView({block:'start'});
      spots[0].focus({preventScroll:true});
    });
  }
  const seasons = [
    ['spring','春の楽しみ','足元に、はじめまして。','小さな花や、やわらかな緑。前に歩いた道で、新しい色を見つけよう。'],
    ['summer','夏の楽しみ','空の大きさを、持ち帰ろう。','雲のかたち、木陰の涼しさ。暑さと天候に気をつけて、その日の一枚を。'],
    ['autumn','秋の楽しみ','いつもの道が、色づいて。','赤や黄色、少し高く感じる空。前の季節の写真と並べて見たくなる。'],
    ['winter','冬の楽しみ','澄んだ空気を、覚えておこう。','安全に行ける身近な場所で、冬の光を一枚。山の冬は装備・経験・現地状況を優先し、無理に集めなくて大丈夫。']
  ];
  document.querySelectorAll('[data-season]').forEach(button => button.addEventListener('click', () => {
    const value = seasons[Number(button.dataset.season)];
    document.querySelectorAll('[data-season]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
    document.querySelector('#season-message').className = 'season-message ' + value[0];
    ['season-lead','season-title','season-copy'].forEach((id,i) => document.getElementById(id).textContent = value[i+1]);
  }));
})();

(() => {
  'use strict';
  const entries = [...document.querySelectorAll('.guide-section')];
  if (!entries.length) return;
  const search = document.querySelector('#guide-search');
  const status = document.querySelector('#search-status');
  const buttons = [...document.querySelectorAll('[data-filter]')];
  let filter = 'all';
  const normalize = s => s.normalize('NFKC').toLocaleLowerCase('ja').replace(/[、,\s]+/g,' ').trim();
  const text = new Map(entries.map(e => [e, normalize(e.textContent)]));
  function apply() {
    const words = normalize(search.value).split(' ').filter(Boolean);
    let found = 0;
    entries.forEach(e => {
      const show = (filter === 'all' || e.dataset.group === filter) && words.every(w => text.get(e).includes(w));
      e.hidden = !show;
      if (show) found++;
      if (words.length && show) e.open = true;
    });
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    status.textContent = words.length || filter !== 'all' ? `${found}件の案内が見つかりました` : '全18項目';
    document.querySelector('#no-results').hidden = found !== 0;
  }
  function openHash(scroll = true) {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const entry = document.getElementById(id);
    if (!entry || !entry.matches('.guide-section')) return;
    search.value = ''; filter = 'all'; apply(); entry.open = true;
    if (scroll) requestAnimationFrame(() => entry.scrollIntoView({block:'start'}));
  }
  search.addEventListener('input', apply);
  buttons.forEach(b => b.addEventListener('click', () => { filter = b.dataset.filter; apply(); }));
  document.querySelector('#clear-search').addEventListener('click', () => {
    search.value = ''; filter = 'all'; entries.forEach(e => e.open = e.id === 'first'); apply(); search.focus();
  });
  document.querySelector('#expand-guides').addEventListener('click', () => entries.forEach(e => { if (!e.hidden) e.open = true; }));
  document.querySelector('#collapse-guides').addEventListener('click', () => entries.forEach(e => { if (!e.hidden) e.open = false; }));
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.getElementById(link.hash.slice(1));
    if (target?.matches('.guide-section')) {
      search.value = ''; filter = 'all'; apply(); target.open = true;
      if (location.hash === link.hash) requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
    }
  });
  window.addEventListener('hashchange', () => openHash());
  let beforePrint = [];
  window.addEventListener('beforeprint', () => { beforePrint=entries.map(e=>[e,e.open,e.hidden]); entries.forEach(e=>{e.open=true;e.hidden=false;}); });
  window.addEventListener('afterprint', () => beforePrint.forEach(([e,open,hidden])=>{e.open=open;e.hidden=hidden;}));
  apply(); openHash();
  document.fonts?.ready.then(() => { if (location.hash) openHash(); });
})();
