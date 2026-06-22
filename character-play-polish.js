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
    const play = document.getElementById('character-play');
    if (!play) return;

    const characters = {
      okuyaridon: {
        name: '奥槍どん',
        image: './img/奥槍どん.png',
        role: '山の家を守る、若きあるじ',
        title: '奥槍どんタイプ',
        rank: 'おもてなし隊長',
        text: '人が安心して過ごせる場所を整え、あたたかく迎える力があります。奥槍戸では、食や休憩、拠点づくりの魅力に目が向きそうです。',
        voice: 'よう来てくれたね。まずは深呼吸して、山の時間に合わせていこう。',
        next: '奥槍戸山の家で、誰かにすすめたい「ほっとする時間」をひとつ見つけてみましょう。',
        links: [['奥槍戸山の家へ', 'facility_guide.html#okuyarito'], ['奥槍どんを見る', '#okuyaridon']]
      },
      nagika: {
        name: 'なぎかちゃん',
        image: './img/なぎかちゃん.png',
        role: '山の元気を届ける案内役',
        title: 'なぎかちゃんタイプ',
        rank: 'わくわく案内係',
        text: '初めての人にも元気よく声をかけ、場を明るくする力があります。イベントや来訪者案内で、山の楽しさを広げられます。',
        voice: 'はじめてでも大丈夫！楽しそうって思ったら、もう一歩進んでみよ！',
        next: '誰かに教えたくなる山の楽しみを、ひとつ言葉にしてみましょう。',
        links: [['お知らせを見る', 'news.html'], ['なぎかちゃんを見る', '#nagika']]
      },
      sugijii: {
        name: '杉じぃ',
        image: './img/杉じぃ.png',
        role: '木頭杉と山の記憶の語り部',
        title: '杉じぃタイプ',
        rank: '山の記憶番',
        text: '目の前の景色の奥にある時間や物語を大切にする力があります。木頭杉、山の歴史、自然の循環を知るほど楽しみが深まります。',
        voice: '木にはのう、時間が詰まっとるんじゃ。足元の景色も、よう見てみい。',
        next: '木、道、建物のどれかに残る「時間の跡」を探してみましょう。',
        links: [['活動を見る', 'projects.html'], ['杉じぃを見る', '#sugijii']]
      },
      yuzuri: {
        name: 'ユズリ',
        image: './img/ユズリ.png',
        role: '知恵を次へ繋ぐ案内人',
        title: 'ユズリタイプ',
        rank: '未来へ渡す記録係',
        text: '地域の資源を見つけ直し、伝わる形に整える力があります。記録、広報、学びを通じて、山の価値を次へ渡せます。',
        voice: '見つけた価値は、伝わる形にして初めて未来へ残ります。',
        next: '今日見つけた地域の魅力を、短いメモか写真で残してみましょう。',
        links: [['活動報告を見る', 'activity-report.html'], ['ユズリを見る', '#yuzuri']]
      },
      sugito: {
        name: 'スギト',
        image: './img/スギト.png',
        role: 'まっすぐな見習いマイスター',
        title: 'スギトタイプ',
        rank: 'まずやってみる実践係',
        text: '考えるだけで終わらせず、まず手を動かして形にしていく力があります。木工、整備、現場活動の中で力を発揮できます。',
        voice: 'まず、やってみようぜ。小さな作業でも、続けば山の力になる。',
        next: '山や場所を少し良くする作業を、ひとつ考えてみましょう。',
        links: [['プロジェクトを見る', 'projects.html'], ['スギトを見る', '#sugito']]
      }
    };

    const questions = [
      { text: '山に着いたら、まず何をしたい？', answers: [['温かい食事や休憩場所を確かめたい', 'okuyaridon'], ['誰かを誘って楽しい場所を探したい', 'nagika'], ['木や道に残る昔の話を知りたい', 'sugijii'], ['地図や資料を見て全体を整理したい', 'yuzuri'], ['歩道や道具の様子を見て手伝いたい', 'sugito']] },
      { text: '仲間と動くなら、どんな役割がしっくりくる？', answers: [['落ち着ける場を用意する', 'okuyaridon'], ['最初の一歩を明るく後押しする', 'nagika'], ['経験や物語を語る', 'sugijii'], ['情報を整理して伝える', 'yuzuri'], ['一緒に作業して形にする', 'sugito']] },
      { text: '山の宝箱に入っていそうな言葉を選ぶなら？', answers: [['おもてなし', 'okuyaridon'], ['元気', 'nagika'], ['記憶', 'sugijii'], ['継承', 'yuzuri'], ['実践', 'sugito']] },
      { text: 'イベントで任されるとうれしいことは？', answers: [['食事や休憩の段取り', 'okuyaridon'], ['受付や声かけ', 'nagika'], ['山や木の小話', 'sugijii'], ['記録写真や発信文', 'yuzuri'], ['設営や片づけ', 'sugito']] },
      { text: '山の魅力を誰かに伝えるなら？', answers: [['ほっとできる時間から伝える', 'okuyaridon'], ['楽しい体験から伝える', 'nagika'], ['長い時間の流れから伝える', 'sugijii'], ['資料や言葉にして伝える', 'yuzuri'], ['手を動かす体験で伝える', 'sugito']] },
      { text: '今日の自分に近い気分は？', answers: [['ゆっくり整えたい', 'okuyaridon'], ['元気に動きたい', 'nagika'], ['じっくり味わいたい', 'sugijii'], ['きちんと残したい', 'yuzuri'], ['まずやってみたい', 'sugito']] }
    ];

    const missions = [
      ['okuyaridon', '山で一息つける場所をひとつ見つけて、誰かにすすめてみよう。'],
      ['nagika', '初めて来た人に伝えたい山の楽しみを、ひとつ言葉にしてみよう。'],
      ['sugijii', '木や道や建物に残っている時間の跡を、ひとつ観察してみよう。'],
      ['yuzuri', '今日見つけた地域の魅力を、写真か短いメモで残してみよう。'],
      ['sugito', '小さくてもいいので、山や場所を整える作業をひとつ考えてみよう。']
    ];

    play.innerHTML = `
      <div class="container">
        <div class="quest-head">
          <div>
            <div class="quest-kicker">YAMA QUEST BOARD</div>
            <h2 class="quest-title">山の仲間クエスト</h2>
            <p class="quest-copy">今日の小さなミッションを受け取って、6つの問いに答えてみてください。最後に、あなたと相性のいい山の仲間が、次の楽しみ方を案内します。</p>
          </div>
          <div class="quest-badges" aria-label="山の仲間たち"></div>
        </div>

        <div class="quest-board">
          <aside class="quest-card dark" aria-labelledby="quest-mission-title">
            <div class="quest-card-title">
              <div><span>TODAY'S MISSION</span><h2 id="quest-mission-title">今日の山ミッション</h2></div>
              <div class="quest-stamp">受注</div>
            </div>
            <div class="quest-mission-body">
              <img src="./img/奥槍どん.png" alt="奥槍どん" data-mission-image>
              <div><strong data-mission-name>奥槍どん</strong><p data-mission-text>山で一息つける場所をひとつ見つけて、誰かにすすめてみよう。</p></div>
            </div>
            <p class="quest-note">ミッションは気軽に入れ替えできます。気になる仲間から始めてみましょう。</p>
            <div class="quest-actions"><button class="btn btn-outline" type="button" data-mission-next>別のミッション</button></div>
          </aside>

          <div>
            <section class="quest-card" aria-labelledby="quest-question-title">
              <div class="quest-card-title">
                <div><span>TYPE CHECK</span><h2>山の仲間タイプ診断</h2></div>
                <div class="quest-stamp" data-quest-count>1 / 6</div>
              </div>
              <div class="quest-progress">
                <div class="quest-progress-row"><span>山道の進み具合</span><span data-progress-label>出発</span></div>
                <div class="quest-trail" aria-hidden="true"><span data-progress-bar></span></div>
              </div>
              <h3 class="quest-question" id="quest-question-title" data-question-title></h3>
              <div class="quest-answer-grid" data-answer-grid></div>
            </section>

            <section class="quest-result" data-result-panel aria-live="polite">
              <div class="quest-result-main">
                <img src="./img/ユズリ.png" alt="ユズリ" data-result-image>
                <div class="quest-result-copy">
                  <span class="quest-rank" data-result-rank>未来へ渡す記録係</span>
                  <h3 data-result-title>ユズリタイプ</h3>
                  <p data-result-text></p>
                  <div class="quest-next" data-result-next></div>
                  <div class="quest-next" data-result-voice></div>
                  <div class="quest-result-links" data-result-links></div>
                  <div class="quest-actions"><button class="btn btn-outline" type="button" data-quest-restart>もう一度診断する</button></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    `;

    const badgeWrap = play.querySelector('.quest-badges');
    Object.values(characters).forEach((character) => {
      const badge = document.createElement('div');
      badge.className = 'quest-badge';
      badge.title = `${character.name}｜${character.role}`;
      badge.innerHTML = `<img src="${character.image}" alt="${character.name}">`;
      badgeWrap.append(badge);
    });

    const state = {
      index: 0,
      scores: Object.keys(characters).reduce((acc, key) => {
        acc[key] = 0;
        return acc;
      }, {})
    };

    const count = play.querySelector('[data-quest-count]');
    const progressBar = play.querySelector('[data-progress-bar]');
    const progressLabel = play.querySelector('[data-progress-label]');
    const questionTitle = play.querySelector('[data-question-title]');
    const answerGrid = play.querySelector('[data-answer-grid]');
    const resultPanel = play.querySelector('[data-result-panel]');
    const resultImage = play.querySelector('[data-result-image]');
    const resultRank = play.querySelector('[data-result-rank]');
    const resultTitle = play.querySelector('[data-result-title]');
    const resultText = play.querySelector('[data-result-text]');
    const resultNext = play.querySelector('[data-result-next]');
    const resultVoice = play.querySelector('[data-result-voice]');
    const resultLinks = play.querySelector('[data-result-links]');
    const missionImage = play.querySelector('[data-mission-image]');
    const missionName = play.querySelector('[data-mission-name]');
    const missionText = play.querySelector('[data-mission-text]');
    const missionNext = play.querySelector('[data-mission-next]');
    const restart = play.querySelector('[data-quest-restart]');

    function renderQuestion() {
      const question = questions[state.index];
      const percent = Math.round((state.index / questions.length) * 100);
      count.textContent = `${state.index + 1} / ${questions.length}`;
      progressBar.style.width = `${percent}%`;
      progressLabel.textContent = state.index === 0 ? '出発' : `${percent}%`;
      questionTitle.textContent = question.text;
      answerGrid.replaceChildren();

      question.answers.forEach(([label, target]) => {
        const character = characters[target];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quest-answer';
        button.innerHTML = `<img src="${character.image}" alt=""><span>${label}</span>`;
        button.addEventListener('click', () => choose(target));
        answerGrid.append(button);
      });
    }

    function choose(target) {
      state.scores[target] += 1;
      state.index += 1;
      if (state.index >= questions.length) {
        showResult();
        return;
      }
      renderQuestion();
    }

    function showResult() {
      progressBar.style.width = '100%';
      progressLabel.textContent = '到着';
      const winner = Object.entries(state.scores).sort((a, b) => b[1] - a[1])[0][0];
      const data = characters[winner];
      resultImage.src = data.image;
      resultImage.alt = data.name;
      resultRank.textContent = data.rank;
      resultTitle.textContent = `あなたは${data.title}`;
      resultText.textContent = data.text;
      resultNext.textContent = `次の一歩：${data.next}`;
      resultVoice.textContent = `${data.name}からのひとこと：${data.voice}`;
      resultLinks.replaceChildren();

      data.links.forEach(([label, href]) => {
        const link = document.createElement('a');
        link.className = 'btn btn-primary';
        link.href = href;
        link.textContent = label;
        resultLinks.append(link);
      });

      resultPanel.classList.add('is-visible', 'quest-flash');
      resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      window.setTimeout(() => resultPanel.classList.remove('quest-flash'), 650);
    }

    function resetQuiz() {
      state.index = 0;
      Object.keys(state.scores).forEach((key) => {
        state.scores[key] = 0;
      });
      resultPanel.classList.remove('is-visible');
      renderQuestion();
    }

    function setMission(offset) {
      const today = new Date();
      const seed = today.getFullYear() + today.getMonth() + today.getDate() + offset;
      const [key, text] = missions[Math.abs(seed) % missions.length];
      const data = characters[key];
      missionImage.src = data.image;
      missionImage.alt = data.name;
      missionName.textContent = data.name;
      missionText.textContent = text;
    }

    let missionOffset = 0;
    missionNext.addEventListener('click', () => {
      missionOffset += 1;
      setMission(missionOffset);
    });
    restart.addEventListener('click', resetQuiz);

    renderQuestion();
    setMission(0);
  });
})();
