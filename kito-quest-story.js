(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
      return;
    }
    fn();
  }

  ready(function () {
    const playContainer = document.querySelector('#character-play .container');
    if (!playContainer || document.querySelector('.kito-quest')) return;

    const pages = [
      {
        kind: 'story',
        label: '表紙',
        title: '森の記憶の図書館と3人の精霊たち',
        image: './img/kito-quest/story-00-cover.jpg',
        imageAlt: '森の記憶の図書館と3人の精霊たち 表紙',
        text: '木頭杉の仙人、スギト、ユズリが、忘れられた森の記憶をたどる物語です。まずは絵本を開くように、森の図書館へ入っていきます。',
        mission: '木頭杉の仙人と忘れられた森の記憶'
      },
      {
        kind: 'story',
        label: 'はじまり',
        title: '呼吸する図書館',
        image: './img/kito-quest/story-01-beginning.jpg',
        imageAlt: 'はじまりの章 呼吸する図書館',
        text: '木頭図書館は、世界一美しい木の殿堂。千年の時を越えて山からやってきた木頭杉たちが、静かに眠るように本を守っています。',
        mission: '図書館の息づかいに耳を澄ませよう。'
      },
      {
        kind: 'story',
        label: '第1章',
        title: '薄れゆく輪郭と、命の芯',
        image: './img/kito-quest/story-02-core.jpg',
        imageAlt: '第1章 薄れゆく輪郭と命の芯',
        text: '杉じぃが本棚の柱に触れると、指先は木の表面に吸い込まれるように透き通ってしまいます。失われかけた記憶の奥で、赤く光る命の芯が呼んでいます。',
        mission: '次はクイズ1。赤い部分の名前をたしかめよう。'
      },
      {
        kind: 'quiz',
        label: 'クイズ1',
        title: '命の芯を見つけろ',
        image: './img/kito-quest/mission1.jpg',
        imageAlt: '謎解きミッション1 命の芯を見つけろ',
        text: '第1章で見つけた、木の中心に近い「赤い部分」の名前を思い出してみよう。',
        question: 'この「赤い部分」の名前は何でしょう？',
        choices: ['あかみ', 'しろみ', 'あまみ'],
        answer: 'あかみ',
        note: '赤みは、杉じぃの記憶の芯につながる大切な言葉です。'
      },
      {
        kind: 'story',
        label: '第2章',
        title: '激流を渡った道具の記憶',
        image: './img/kito-quest/story-03-river-tool.jpg',
        imageAlt: '第2章 激流を渡った道具の記憶',
        text: '杉じぃは、激しい川を一本の道具だけで命がけで乗り越えた記憶をたどります。木頭の材を運んだ人々の手と声が、森の中によみがえります。',
        mission: '次はクイズ2。激流を渡った道具の名を探そう。'
      },
      {
        kind: 'quiz',
        label: 'クイズ2',
        title: '激流を渡った道具',
        image: './img/kito-quest/mission2.jpg',
        imageAlt: 'ミッション2 激流を渡った道具の名前を探せ',
        text: '第2章の記憶に出てきた道具の名前を、2文字のキーワードでたしかめます。',
        question: '激しい川を渡るために使われた道具の名前は？',
        choices: ['[か]・[い]', '[さ]・[お]', '[い]・[か]'],
        answer: '[か]・[い]',
        note: '「かい」は水をかいて進む道具。木頭杉を運んだ記憶につながります。'
      },
      {
        kind: 'story',
        label: '第3章',
        title: '都での栄光と、受け継がれる約束',
        image: './img/kito-quest/story-04-city-promise.jpg',
        imageAlt: '第3章 都での栄光と受け継がれる約束',
        text: '記憶の先には、大阪城や下鴨神社へとつながる旅がありました。木頭杉は、遠い都で人々の暮らしと祈りを支えてきたのです。',
        mission: '次はクイズ3。杉じぃの胸に残った気持ちを見つけよう。'
      },
      {
        kind: 'quiz',
        label: 'クイズ3',
        title: '1000年の旅の記憶',
        image: './img/kito-quest/mission3.jpg',
        imageAlt: 'ミッション3 1000年の旅の記憶',
        text: '第3章でよみがえった、木頭杉が都まで運ばれた記憶。その胸に残っていた気持ちをたしかめます。',
        question: '木頭杉が胸に秘めていた「一番大切な気持ち」は何でしょう？',
        choices: ['かおり', 'ほこり', 'ねむり'],
        answer: 'ほこり',
        note: '大阪城や下鴨神社にもつながる、木頭杉の千年の記憶です。'
      },
      {
        kind: 'story',
        label: '第4章',
        title: 'ぬくもりの再会と、受け継がれる手',
        image: './img/kito-quest/story-05-woodhead.jpg',
        imageAlt: '第4章 ぬくもりの再会と受け継がれる手',
        text: '導かれるようにたどり着いたのは、木の香りに包まれた職人の小屋。木頭杉の記憶は、今も手仕事の中で新しい形へ生まれ変わっています。',
        mission: '職人の手から、木がもう一度生きはじめる。'
      },
      {
        kind: 'story',
        label: '最終章',
        title: '永遠に響く「名」と、千年の約束',
        image: './img/kito-quest/story-06-final-promise.jpg',
        imageAlt: '最終章 永遠に響く名と千年の約束',
        text: '杉じぃは全てを思い出します。木を育て、運び、使い、次へ渡してきた人々の名前。その記憶は、千年の森から未来へ続いていきます。',
        mission: '集めた言葉が、約束の言葉へつながります。'
      },
      {
        kind: 'quiz',
        label: '最後の試練',
        title: '「約束の言葉」を完成させよ！',
        image: './img/kito-quest/story-06-final-promise.jpg',
        imageAlt: '最後の試練 約束の言葉を完成させる',
        text: 'ミッション1とミッション3のキーワードを思い出して、空欄を埋めよう。',
        question: '木頭杉の「□□□」のぬくもりが、えいえんの「□□□」をつなぐ',
        choices: [],
        answer: '',
        note: '答えは最後のページでたしかめよう。'
      },
      {
        kind: 'story',
        label: '贈り物',
        title: '杉じぃからの贈り物',
        image: './img/kito-quest/story-07-gift.jpg',
        imageAlt: '杉じぃからの贈り物 木頭見習いマイスター認定',
        text: '見事に全ての記憶をつなぎ止めた君は、「木頭見習いマイスター」として認定されます。物語の続きは、木に触れる一人ひとりの手の中にあります。',
        mission: '最後の試練の答えは「あかみ」「ほこり」。木頭杉の「あかみ」のぬくもりが、えいえんの「ほこり」をつなぎます。'
      }
    ];

    const section = document.createElement('section');
    section.className = 'kito-quest';
    section.innerHTML = `
      <div class="kito-quest-head">
        <div>
          <div class="kito-quest-kicker">KITO QUEST PICTURE BOOK</div>
          <h2>木頭クエスト 冒険の書</h2>
          <p>第4回木頭クマまつりで披露された物語を、イラストと一緒にめくって読める絵本形式にしました。クイズは第1章・第2章・第3章の直後に入り、物語の流れの中で答えをたしかめられます。</p>
        </div>
        <div class="kito-quest-counter" data-kito-counter>表紙</div>
      </div>

      <div class="kito-quest-body kito-book-body">
        <nav class="kito-map" aria-label="木頭クエストのページ" data-kito-map></nav>
        <article class="kito-stage-card kito-picture-book">
          <figure class="kito-page-figure">
            <img src="./img/kito-quest/story-00-cover.jpg" alt="森の記憶の図書館と3人の精霊たち 表紙" data-kito-image>
          </figure>
          <div class="kito-page-panel">
            <div class="kito-stage-meta" data-kito-label>表紙</div>
            <h3 data-kito-title></h3>
            <p class="kito-story" data-kito-text></p>
            <p class="kito-question" data-kito-question></p>
            <div class="kito-options" data-kito-options></div>
            <div class="kito-feedback" data-kito-feedback></div>
            <p class="kito-question" data-kito-mission></p>
            <div class="kito-actions">
              <button class="btn btn-outline" type="button" data-kito-prev>前のページ</button>
              <button class="btn btn-primary" type="button" data-kito-next>次のページ</button>
            </div>
            <div class="kito-clear" data-kito-clear>
              <strong>冒険の書、読了</strong>
              <p>最後の試練の答えは「あかみ」「ほこり」。木頭杉の「あかみ」のぬくもりが、えいえんの「ほこり」をつなぎます。</p>
            </div>
          </div>
        </article>
      </div>
    `;

    playContainer.append(section);

    const map = section.querySelector('[data-kito-map]');
    const counter = section.querySelector('[data-kito-counter]');
    const image = section.querySelector('[data-kito-image]');
    const label = section.querySelector('[data-kito-label]');
    const title = section.querySelector('[data-kito-title]');
    const text = section.querySelector('[data-kito-text]');
    const question = section.querySelector('[data-kito-question]');
    const options = section.querySelector('[data-kito-options]');
    const feedback = section.querySelector('[data-kito-feedback]');
    const mission = section.querySelector('[data-kito-mission]');
    const prev = section.querySelector('[data-kito-prev]');
    const next = section.querySelector('[data-kito-next]');
    const clear = section.querySelector('[data-kito-clear]');

    let pageIndex = 0;

    pages.forEach((page, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'kito-stage-tab';
      button.textContent = `${page.label}：${page.title}`;
      button.addEventListener('click', () => {
        pageIndex = index;
        renderPage();
      });
      map.append(button);
    });

    function renderPage() {
      const page = pages[pageIndex];
      counter.textContent = page.label;
      label.textContent = page.kind === 'quiz' ? `${page.label} / 物語の途中クイズ` : page.label;
      image.src = page.image;
      image.alt = page.imageAlt;
      title.textContent = page.title;
      text.textContent = page.text;
      const isRevealQuiz = page.kind === 'quiz' && page.choices.length > 0;
      mission.textContent = isRevealQuiz ? '考えたら「答えを見る」を押して確認しよう。' : page.kind === 'quiz' ? page.note : page.mission;
      question.textContent = page.kind === 'quiz' ? page.question : '';
      question.hidden = page.kind !== 'quiz';
      options.replaceChildren();
      feedback.classList.remove('is-visible');
      feedback.textContent = '';

      if (isRevealQuiz) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'kito-option kito-reveal-answer';
        button.textContent = '答えを見る';
        button.addEventListener('click', () => {
          button.disabled = true;
          feedback.textContent = `答え：${page.answer}。${page.note}`;
          feedback.classList.add('is-visible');
        });
        options.append(button);
      }

      prev.disabled = pageIndex === 0;
      next.disabled = pageIndex === pages.length - 1;
      clear.classList.toggle('is-visible', pageIndex === pages.length - 1);
      Array.from(map.children).forEach((button, index) => {
        button.classList.toggle('is-active', index === pageIndex);
      });
    }

    prev.addEventListener('click', () => {
      if (pageIndex > 0) {
        pageIndex -= 1;
        renderPage();
      }
    });

    next.addEventListener('click', () => {
      if (pageIndex < pages.length - 1) {
        pageIndex += 1;
        renderPage();
      }
    });

    renderPage();
  });
})();
