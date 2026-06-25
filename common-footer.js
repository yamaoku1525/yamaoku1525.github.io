(function () {
  'use strict';

  const items = (window.AWASANGA && window.AWASANGA.menuItems) || [
    { href: 'index.html', label: 'ホーム' },
    { href: 'news.html', label: 'お知らせ' },
    { href: 'facility_guide.html', label: '施設・山と林道ガイド' },
    { href: 'about.html', label: '阿波山雅について' },
    { href: 'projects.html', label: '活動・プロジェクト' },
    { href: 'characters.html', label: '山の仲間たち' },
    { href: 'support.html', label: '応援する' }
  ];

  document.querySelectorAll('[data-common-footer]').forEach((target) => {
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      fragment.append(link);
    });
    target.replaceChildren(fragment);
  });

  function exact(selector, text) {
    return Array.from(document.querySelectorAll(selector)).find((el) => el.textContent.trim() === text);
  }
  function setText(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  }
  function loadStylesheet(id, href) {
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  }
  function loadScript(src, onload) {
    const existing = Array.from(document.scripts).find((script) => script.getAttribute('src') === src);
    if (existing) {
      if (onload) onload();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = onload || null;
    document.body.append(script);
  }
  function addInlineStyle(id, css) {
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.append(style);
  }
  function loadKitoQuestBook() {
    loadStylesheet('kito-quest-game-style', 'kito-quest-game.css');
    addInlineStyle('kito-quest-layout-fix', '.play-layout > .kito-quest { grid-column: 1 / -1; }');
    loadScript('kito-quest-story.js');
  }

  const file = location.pathname.split('/').pop();

  if (file === 'characters.html') {
    loadKitoQuestBook();
  }

  if (file === 'projects.html') {
    setText('.sub-hero p', 'ここは、阿波山雅が「何を、なぜ行うのか」を知るページです。活動の目的、具体的な取り組み、関わり方を紹介します。力を入れているプロジェクトは、専用ページで実績や数字を確認できます。');
    const concept = exact('.plain-intro p', 'だからこのページでは、活動の説明だけで終わらせず、実際に何をしているのか、どの記録を見ればよいのか、次にどう関われるのかまで並べます。');
    if (concept) concept.textContent = 'このページでは、各活動の背景と目指す姿、具体的な取り組み、関わり方を紹介します。力を入れているプロジェクトには専用ページがあり、実績や数字を詳しくまとめています。';
    const local = document.getElementById('local-products');
    if (local) {
      const strong = local.querySelector('.activity-side strong');
      const h3 = local.querySelector('h3');
      const paragraphs = local.querySelectorAll('.activity-body > p');
      const boxes = local.querySelectorAll('.detail-box');
      if (strong) strong.textContent = '那賀町特産品開発・物販自販機設置による那賀地域活性化';
      if (h3) h3.textContent = '那賀町の特産品を、いつでも手に取れる地域の入口へ。';
      if (paragraphs[0]) paragraphs[0].textContent = '那賀町には、ゆずをはじめとした特産品と、それを育て、加工し、届ける人の仕事があります。商品として磨き、買える場所を増やすことで、地域の実りを継続する仕事につなげます。';
      if (paragraphs[1]) paragraphs[1].textContent = '特産品開発と物販自販機の設置を通じて、林道利用者や来訪者が那賀町の商品に出会い、地域を知り、次の訪問につながる接点をつくります。';
      if (boxes[0]?.querySelector('span')) boxes[0].querySelector('span').textContent = '那賀町特産品の商品開発、物販自販機の設置検討、販売接点づくり、来訪者への地域産品の発信。';
      if (boxes[1]?.querySelector('.record-links')) boxes[1].querySelector('.record-links').innerHTML = '<a href="facility_guide.html#tairanosato">平の里の案内</a><a href="news.html">お知らせ一覧を見る</a>';
    }
    const cta = document.querySelector('.final-cta-section .cta-panel p');
    if (cta) cta.textContent = 'このページで紹介した注力プロジェクトには、それぞれ専用ページがあり、実施日・数値・写真・記録をまとめています。気になったプロジェクトから、詳しい記録をご覧ください。';
  }

  if (file === 'about.html') {
    const old = exact('.timeline-body', '那賀町賑わい課との認識合わせ協議 開始');
    if (old) old.textContent = '那賀町特産品開発・物販自販機設置による那賀地域活性化 協議開始';
  }
})();
