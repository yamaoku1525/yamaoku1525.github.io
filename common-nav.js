(function () {
  'use strict';

  const shared = window.AWASANGA || (window.AWASANGA = {});
  const menuItems = shared.menuItems || Object.freeze([
    Object.freeze({ href: 'index.html', label: 'ホーム', key: 'home' }),
    Object.freeze({ href: 'news.html', label: 'お知らせ', key: 'news' }),
    Object.freeze({ href: 'facility_guide.html', label: '施設・山と林道ガイド', key: 'facility' }),
    Object.freeze({ href: 'about.html', label: '阿波山雅について', key: 'about' }),
    Object.freeze({ href: 'projects.html', label: '活動・プロジェクト', key: 'projects' }),
    Object.freeze({ href: 'characters.html', label: '山の仲間たち', key: 'characters' }),
    Object.freeze({ href: 'support.html', label: '応援する', key: 'support' }),
  ]);

  const activityReportSectionIds = Object.freeze({
    '数字で見る阿波山雅': 'visitor-report',
    '次郎笈トレイル再生': 'trail-report',
    'フードリボン': 'foodribbon-report',
    '木頭クエスト × クマ祭り': 'kito-quest-report',
    '那賀町特産品開発・物販自販機設置による那賀地域活性化': 'town-report',
    '奥槍戸やま日和': 'newsletter-report',
    'メディア・受託・登録実績': 'media-report',
    '主な沿革': 'timeline-report',
  });

  const projectRecordLinks = Object.freeze({
    'okuyarito-base': Object.freeze({ href: 'activity-report.html#visitor-report', label: '来場者数と活動実績を見る' }),
    foodribbon: Object.freeze({ href: 'activity-report.html#foodribbon-report', label: 'フードリボンの活動報告を見る' }),
    trail: Object.freeze({ href: 'activity-report.html#trail-report', label: '次郎笈トレイルの活動報告を見る' }),
    'kito-quest': Object.freeze({ href: 'activity-report.html#kito-quest-report', label: '木頭クエストの活動報告を見る' }),
    'tree-planting': Object.freeze({ href: 'activity-report.html#timeline-report', label: '主な沿革で植樹記録を見る' }),
    newsletter: Object.freeze({ href: 'activity-report.html#newsletter-report', label: '広報誌の活動報告を見る' }),
  });

  const projectGalleryImages = Object.freeze({
    'okuyarito-base': Object.freeze(['./img/top_yamanoie1.png', './img/localized/dining-interior.jpg', './img/localized/meal-closeup.jpg']),
    foodribbon: Object.freeze([
      './img/foodribbon/2024-03-08_フードリボン_賛同者がリボンを付ける.jpg',
      './img/foodribbon/2024-03-08_フードリボン_賛同者とリボンボード.jpg',
      './img/foodribbon/2024-03-08_フードリボン_参加店ステッカー.jpg',
    ]),
    trail: Object.freeze([
      './img/trail/01_整備前_草に覆われた登山道.jpg',
      './img/trail/03_杭木運搬に参加した皆さん.png',
      './img/trail/05_登山道整備作業.jpeg',
    ]),
    rindo: Object.freeze([
      './img/localized/ridgeway-landscape.jpg',
      './img/top_g.png',
      './img/top_yamanoie1.png',
    ]),
    'kito-quest': Object.freeze(['./img/top_kouri1.png', './img/top_yamanoie1.png', './img/localized/community-support.jpg']),
    'tree-planting': Object.freeze([
      './img/localized/tree-planting.jpg',
      './img/top_g.png',
      './img/top_yuzu1.png',
    ]),
    newsletter: Object.freeze([
      './img/localized/newsletter-writing.jpg',
      './img/localized/news-default.jpg',
      './img/top_yamanoie1.png',
    ]),
    'local-products': Object.freeze(['./img/top_yuzu1.png', './img/top_kouri1.png', './img/localized/tree-planting.jpg']),
  });

  const characterAssets = Object.freeze({
    nagika: Object.freeze(['./img/なぎかちゃん.png']),
    sugito: Object.freeze(['./img/スギト.png']),
    sugijii: Object.freeze(['./img/杉じぃ.png']),
    yuzuri: Object.freeze(['./img/ユズリ.png']),
  });

  const projectStoryEnhancements = Object.freeze({});

  shared.menuItems = menuItems;
  window.AWASANGA_MENU_ITEMS = menuItems;

  function currentKeyFromPath() {
    const fileName = window.location.pathname.split('/').pop() || 'index.html';
    const map = {
      'index.html': 'home',
      'about.html': 'about',
      'facility_guide.html': 'facility',
      'projects.html': 'projects',
      'activity-report.html': 'activity',
      'news.html': 'news',
      'characters.html': 'characters',
      'members.html': 'members',
      'support.html': 'support',
      'contact.html': 'support',
      'design-doc.html': 'design',
    };
    return map[fileName] || '';
  }

  function createMenuLink(item, current, activeClass) {
    const link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.label;

    if (item.key === current) {
      link.className = activeClass;
      link.setAttribute('aria-current', 'page');
    }

    return link;
  }

  function renderMenu(target) {
    const current = target.hasAttribute('data-current')
      ? target.dataset.current
      : currentKeyFromPath();
    const isList = target.tagName.toLowerCase() === 'ul';
    const activeClass = isList ? 'active' : 'is-active';
    const fragment = document.createDocumentFragment();

    menuItems.forEach((item) => {
      const link = createMenuLink(item, current, activeClass);

      if (isList) {
        const listItem = document.createElement('li');
        listItem.append(link);
        fragment.append(listItem);
        return;
      }

      fragment.append(link);
    });

    target.replaceChildren(fragment);
  }

  function setNearestSectionId(headingText, id) {
    const headings = document.querySelectorAll('h2, h3');
    const heading = Array.from(headings).find((element) => element.textContent.trim() === headingText);
    const target = heading && heading.closest('article, section');

    if (target && !target.id) {
      target.id = id;
    }
  }

  function scrollToHashTarget() {
    const rawHash = window.location.hash.slice(1);
    if (!rawHash) return;

    const id = decodeURIComponent(rawHash);
    const target = document.getElementById(id);
    if (!target) return;

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'start' });
    });
  }

  function enhanceActivityReportAnchors() {
    if (!document.querySelector('[data-current="activity"]')) return;

    Object.entries(activityReportSectionIds).forEach(([headingText, id]) => {
      setNearestSectionId(headingText, id);
    });

    scrollToHashTarget();
  }

  function enhanceProjectRecordLinks() {
    if (!document.querySelector('[data-current="projects"]')) return;

    Object.entries(projectRecordLinks).forEach(([articleId, linkConfig]) => {
      const article = document.getElementById(articleId);
      const link = article && article.querySelector('.record-links a[href="activity-report.html"]');

      if (!link) return;

      link.href = linkConfig.href;
      link.textContent = linkConfig.label;
    });
  }

  function injectProjectEnhancementStyles() {
    if (document.getElementById('project-story-enhancement-styles')) return;

    const style = document.createElement('style');
    style.id = 'project-story-enhancement-styles';
    style.textContent = `
      .activity-photo-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        background: rgba(36,75,55,.08);
      }
      .activity-photo-grid img {
        width: 100%;
        height: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        display: block;
      }
      .activity-photo-grid img:first-child {
        grid-column: 1 / -1;
        aspect-ratio: 4 / 3;
      }
      .activity-photo-grid img:only-child {
        aspect-ratio: 4 / 3;
      }
      .scene-box.has-character {
        display: grid;
        grid-template-columns: 76px 1fr;
        gap: 16px;
        align-items: start;
        border-left-width: 0;
        border-top: 6px solid var(--gold);
      }
      .scene-character {
        width: 76px;
        height: 76px;
        object-fit: contain;
        border-radius: 999px;
        background: #fff;
        padding: 7px;
        box-shadow: 0 12px 28px rgba(22,50,36,.16);
      }
      .scene-box.character-missing {
        display: block;
        border-left: 6px solid var(--gold);
        border-top: 0;
      }
      .scene-box.character-missing .scene-character {
        display: none;
      }
      .scene-box-text strong {
        margin-bottom: 8px;
      }
      @media (max-width: 640px) {
        .scene-box.has-character {
          grid-template-columns: 58px 1fr;
          gap: 12px;
        }
        .scene-character {
          width: 58px;
          height: 58px;
          padding: 5px;
        }
      }
    `;
    document.head.append(style);
  }

  function setText(element, text) {
    if (element && text) {
      element.textContent = text;
    }
  }

  function removeBrokenImage(image) {
    const grid = image.closest('.activity-photo-grid');
    image.remove();
    if (grid && !grid.querySelector('img')) {
      grid.remove();
    }
  }

  function enhanceProjectGalleries() {
    if (!document.querySelector('[data-current="projects"]')) return;

    Object.entries(projectGalleryImages).forEach(([articleId, sources]) => {
      const article = document.getElementById(articleId);
      const side = article && article.querySelector('.activity-side');
      const firstImage = side && side.querySelector(':scope > img');
      if (!side || !firstImage || side.querySelector('.activity-photo-grid')) return;

      const grid = document.createElement('div');
      grid.className = 'activity-photo-grid';
      grid.dataset.maxPhotos = '3';

      sources.slice(0, 3).forEach((src, index) => {
        const image = document.createElement('img');
        image.src = src;
        image.alt = index === 0 ? firstImage.alt : `${firstImage.alt} ${index + 1}`;
        image.loading = index === 0 ? 'eager' : 'lazy';
        image.onerror = () => removeBrokenImage(image);
        grid.append(image);
      });

      firstImage.replaceWith(grid);
    });
  }

  function tryCharacterSource(image, sources, index) {
    if (!sources || index >= sources.length) {
      image.hidden = true;
      const sceneBox = image.closest('.scene-box');
      if (sceneBox) sceneBox.classList.add('character-missing');
      return;
    }

    image.src = sources[index];
    image.onerror = () => tryCharacterSource(image, sources, index + 1);
  }

  function addCharacterToScene(sceneBox, characterKey, voiceTitle) {
    if (!sceneBox || sceneBox.classList.contains('has-character')) return;

    const sources = characterAssets[characterKey];
    if (!sources) return;

    const strong = sceneBox.querySelector('strong');
    const paragraph = sceneBox.querySelector('p');
    const textWrap = document.createElement('div');
    const image = document.createElement('img');

    image.className = 'scene-character';
    image.alt = voiceTitle ? `${voiceTitle}のキャラクター` : 'キャラクター';
    image.loading = 'lazy';

    if (strong) textWrap.append(strong);
    if (paragraph) textWrap.append(paragraph);
    textWrap.className = 'scene-box-text';

    sceneBox.replaceChildren(image, textWrap);
    sceneBox.classList.add('has-character');
    sceneBox.dataset.character = characterKey;
    tryCharacterSource(image, sources, 0);
  }

  function updateProjectDetail(article, index, text) {
    const detail = article.querySelectorAll('.detail-box')[index];
    const span = detail && detail.querySelector('span:not(.record-links)');
    setText(span, text);
  }

  function enhanceProjectStories() {
    if (!document.querySelector('[data-current="projects"]')) return;

    injectProjectEnhancementStyles();
    enhanceProjectGalleries();

    Object.entries(projectStoryEnhancements).forEach(([articleId, copy]) => {
      const article = document.getElementById(articleId);
      if (!article) return;

      setText(article.querySelector('.activity-body h3'), copy.heading);

      const paragraphs = Array.from(article.querySelectorAll('.activity-body > p'));
      copy.paragraphs.forEach((text, index) => setText(paragraphs[index], text));

      const sceneBox = article.querySelector('.scene-box');
      if (sceneBox) {
        setText(sceneBox.querySelector('strong'), copy.voiceTitle);
        setText(sceneBox.querySelector('p'), copy.voice);
        addCharacterToScene(sceneBox, copy.character, copy.voiceTitle);
      }

      updateProjectDetail(article, 0, copy.activity);
      updateProjectDetail(article, 2, copy.support);
    });
  }

  function enhanceProjectSceneCharacters() {
    if (!document.querySelector('[data-current="projects"]')) return;

    const characterByArticle = {
      'okuyarito-base': 'nagika',
      foodribbon: 'nagika',
      trail: 'sugito',
      rindo: 'sugito',
      'kito-quest': 'sugijii',
      'tree-planting': 'yuzuri',
      newsletter: 'yuzuri',
      'local-products': 'yuzuri',
    };

    Object.entries(characterByArticle).forEach(([articleId, character]) => {
      const article = document.getElementById(articleId);
      const sceneBox = article && article.querySelector('.scene-box');
      const voiceTitle = sceneBox && sceneBox.querySelector('strong')?.textContent.trim();
      if (sceneBox) addCharacterToScene(sceneBox, character, voiceTitle);
    });
  }

  function injectConsistencyStyles() {
    if (document.getElementById('site-consistency-runtime-styles')) return;

    const style = document.createElement('style');
    style.id = 'site-consistency-runtime-styles';
    style.textContent = `
      .breadcrumb {
        display: none !important;
      }

      .engage-note {
        margin-top: 18px;
        padding: 16px 18px;
        border-radius: 18px;
        background: var(--paper);
        border: 1px solid rgba(36,75,55,.08);
        color: var(--muted);
        font-size: 13px;
        line-height: 1.8;
      }

      .engage-note b {
        display: block;
        color: var(--green);
        margin-bottom: 6px;
      }

      .engage-action {
        margin-top: 18px;
      }
    `;
    document.head.append(style);
  }

  function replaceLink(link, href, text) {
    if (!link) return;
    link.href = href;
    link.textContent = text;
  }

  function reduceRepeatedRecruitmentLinks() {
    const current = currentKeyFromPath();

    if (current === 'about') {
      document.querySelector('a[href="support.html#join"]')?.remove();

      const cta = document.querySelector('.cta-panel');
      if (cta) {
        const heading = cta.querySelector('h2');
        const paragraph = cta.querySelector('p');
        const actions = cta.querySelector('.cta-actions');
        if (heading) heading.innerHTML = '活動の背景を、<br>続けて見てください。';
        if (paragraph) {
          paragraph.textContent = '阿波山雅が何を守ろうとしているのかは、日々の活動の中に表れます。活動報告とプロジェクトを通して、山に人が集まる理由を見てください。';
        }
        if (actions) {
          const links = actions.querySelectorAll('a');
          replaceLink(links[0], 'activity-report.html', '活動報告を見る　→');
          replaceLink(links[1], 'projects.html', '活動を見る　→');
        }
      }
    }

    if (current === 'facility') {
      const supportLink = Array.from(document.querySelectorAll('.related-link')).find((link) => (
        link.getAttribute('href') === 'support.html'
      ));
      if (supportLink) {
        supportLink.href = 'news.html';
        supportLink.innerHTML = 'お知らせ <span>→</span>';
      }
    }

    if (current === 'activity') {
      const actions = document.querySelector('.final-cta-section .cta-actions');
      if (actions) {
        const links = actions.querySelectorAll('a');
        replaceLink(links[0], 'projects.html', '活動・プロジェクトへ　→');
        replaceLink(links[1], 'facility_guide.html', '施設・林道ガイドへ　→');
      }

      const supportLink = Array.from(document.querySelectorAll('.related-link')).find((link) => (
        link.getAttribute('href') === 'support.html'
      ));
      if (supportLink) {
        supportLink.href = 'news.html';
        supportLink.innerHTML = 'お知らせ <span>→</span>';
      }
    }

    if (current === 'projects') {
      const finalCta = document.querySelector('.final-cta-section .cta-panel');
      if (finalCta) {
        const heading = finalCta.querySelector('h2');
        const paragraph = finalCta.querySelector('p');
        const actions = finalCta.querySelector('.cta-actions');
        if (heading) heading.innerHTML = '活動の記録から、<br>山の今を見てください。';
        if (paragraph) {
          paragraph.textContent = 'このページで紹介した活動の実施日、数値、写真、掲載・連携実績は、活動報告にまとめています。成果や進捗を確認したい方は、活動報告をご覧ください。';
        }
        if (actions) {
          const links = actions.querySelectorAll('a');
          replaceLink(links[0], 'activity-report.html', '活動報告を見る　→');
          replaceLink(links[1], 'facility_guide.html', '施設・林道ガイドへ　→');
        }
      }
    }

    if (current === 'members') {
      const supportLink = Array.from(document.querySelectorAll('.related-link')).find((link) => (
        link.getAttribute('href') === 'support.html'
      ));
      if (supportLink) {
        supportLink.href = 'projects.html';
        supportLink.textContent = '活動・プロジェクト';
      }
    }
  }

  document.querySelectorAll('[data-common-nav]').forEach(renderMenu);
  injectConsistencyStyles();
  enhanceActivityReportAnchors();
  enhanceProjectRecordLinks();
  enhanceProjectStories();
  enhanceProjectSceneCharacters();
  reduceRepeatedRecruitmentLinks();
})();
