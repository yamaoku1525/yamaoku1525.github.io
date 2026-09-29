(() => {
  'use strict';
  const entries = [...document.querySelectorAll('.guide-section')];
  if (!entries.length) return;
  const search = document.querySelector('#guide-search');
  const status = document.querySelector('#search-status');
  const buttons = [...document.querySelectorAll('[data-filter]')];
  let filter = 'all';
  const normalize = s => s.normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g,' ').trim();
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
