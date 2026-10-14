(function () {
  const $ = (id) => document.getElementById(id);
  const BOOKS = [['창세기','창'],['출애굽기','출'],['레위기','레'],['민수기','민'],['신명기','신'],['여호수아','수'],['사사기','삿'],['룻기','룻'],['사무엘상','삼상'],['사무엘하','삼하'],['열왕기상','왕상'],['열왕기하','왕하'],['역대상','대상'],['역대하','대하'],['에스라','스'],['느헤미야','느'],['에스더','에'],['욥기','욥'],['시편','시'],['잠언','잠'],['전도서','전'],['아가','아'],['이사야','사'],['예레미야','렘'],['예레미야애가','애'],['에스겔','겔'],['다니엘','단'],['호세아','호'],['요엘','욜'],['아모스','암'],['오바댜','옵'],['요나','욘'],['미가','미'],['나훔','나'],['하박국','합'],['스바냐','습'],['학개','학'],['스가랴','슥'],['말라기','말'],['마태복음','마'],['마가복음','막'],['누가복음','눅'],['요한복음','요'],['사도행전','행'],['로마서','롬'],['고린도전서','고전'],['고린도후서','고후'],['갈라디아서','갈'],['에베소서','엡'],['빌립보서','빌'],['골로새서','골'],['데살로니가전서','살전'],['데살로니가후서','살후'],['디모데전서','딤전'],['디모데후서','딤후'],['디도서','딛'],['빌레몬서','몬'],['히브리서','히'],['야고보서','약'],['베드로전서','벧전'],['베드로후서','벧후'],['요한일서','요일'],['요한이서','요이'],['요한삼서','요삼'],['유다서','유'],['요한계시록','계']];
  const ABBR = Object.fromEntries(BOOKS);
  $('books').innerHTML = BOOKS.map(([b]) => `<option value="${b}"></option>`).join('');

  /* ---------- 기본 내용: 10월 11일 예배 ---------- */
  const SAMPLE_SONGS = __SONGS__;
  function nextSunday() {
    const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    return d.toISOString().slice(0, 10);
  }
  const uid = () => Math.random().toString(36).slice(2, 9);
  const DEFAULT = {
    date: nextSunday(),
    call: { ref: '요한복음 15:4', text: '내 안에 거하라 나도 너희 안에 거하리라\n가지가 포도나무에 붙어 있지 아니하면\n스스로 열매를 맺을 수 없음 같이\n너희도 내 안에 있지 아니하면 그러하리라' },
    songs: SAMPLE_SONGS.filter((s) => !s.offering).map((s) => ({ id: uid(), title: s.title, color: s.color, lyrics: s.lyrics })),
    prayer: '정은채 어린이',
    bible: { book: '열왕기하', chapter: '23', verses: '2~3', abbr: '왕하', text: '2 이에 왕이 여호와의 성전에 올라가매 유다 모든 사람과 예루살렘 주민과 제사장들과 선지자들과 모든 백성이 노소를 막론하고 다 왕과 함께 한지라 왕이 여호와의 성전 안에서 발견한 언약책의 모든 말씀을 읽어 무리의 귀에 들리고\n3 왕이 단 위에 서서 여호와 앞에서 언약을 세우되 마음을 다하고 뜻을 다하여 여호와께 순종하고 그의 계명과 법도와 율례를 지켜 이 책에 기록된 이 언약의 말씀을 이루게 하리라 하매 백성이 다 그 언약을 따르기로 하니라' },
    choir: true,
    sermonTitle: '진정한 개혁의 시작',
    offeringLyrics: (SAMPLE_SONGS.find((s) => s.offering) || {}).lyrics || '',
    offeringTitle: '주를 예배하는 삶',
    offeringPrayer: '조지혜 선생님',
    quiz: [
      { q: '요시야의 할아버지이자 55년간 유다를 다스린 왕으로서 유다 땅에 우상의 산당을 세우고 바알의 제단을 쌓았으며, 점치며 무당을 의지하여 *"악을 많이 행한"* 왕으로 기록된 이 사람은 누구일까요?', a: '므낫세' },
      { q: '요시야 왕은 온 백성에게 언약책을 읽어준 후 우상과 관련된 모든 것을 제거하는 개혁을 단행합니다. 개혁 이후 요시야는 온 백성과 함께 *\'이 절기\'*를 지킵니다. 이것은 무엇일까요?', a: '유월절' },
    ],
    notice: '🙏 예배를 함께 준비해요\n  - 대표기도 : 부장선생님    - 헌금기도 : 이채연 선생님\n🎙️ 추수감사주일(10/18)은 *야외예배*로 드립니다!\n - 점심 메뉴 추천 결과 : 컵라면, 치킨, 김밥, 떡볶이\n🌝 추수감사절 *특별새벽기도회* (10/12~17, 6일간)\n - (온/오프라인 동시) 주중처소 월-금 05:30, 토 06:30',
  };

  const KEY = 'kids-worship-ppt-draft-v1';
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { state = null; }
  if (!state || !state.songs) state = JSON.parse(JSON.stringify(DEFAULT));
  if (state.offeringTitle == null) state.offeringTitle = state.offeringLyrics === DEFAULT.offeringLyrics ? DEFAULT.offeringTitle : '';
  delete state.ui;
  const images = { sermonImages: [], posters: [] };
  let saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }, 300); }

  /* ---------- 단순 입력칸 연결 ---------- */
  const bind = (id, get, set) => { const el = $(id); const isBox = el.type === 'checkbox'; isBox ? (el.checked = !!get()) : (el.value = get() || ''); el.addEventListener('input', () => { set(isBox ? el.checked : el.value); changed(); }); };
  bind('date', () => state.date, (v) => (state.date = v));
  bind('callRef', () => state.call.ref, (v) => (state.call.ref = v));
  bind('callText', () => state.call.text, (v) => (state.call.text = v));
  bind('prayer', () => state.prayer, (v) => (state.prayer = v));
  bind('book', () => state.bible.book, (v) => { state.bible.book = v.trim(); if (ABBR[v.trim()]) { state.bible.abbr = ABBR[v.trim()]; $('abbr').value = state.bible.abbr; } });
  bind('chapter', () => state.bible.chapter, (v) => (state.bible.chapter = v.trim()));
  bind('verses', () => state.bible.verses, (v) => (state.bible.verses = v.trim()));
  bind('abbr', () => state.bible.abbr, (v) => (state.bible.abbr = v.trim()));
  bind('bibleText', () => state.bible.text, (v) => (state.bible.text = v));
  bind('choir', () => state.choir, (v) => (state.choir = v));
  bind('sermonTitle', () => state.sermonTitle, (v) => (state.sermonTitle = v));
  bind('offeringLyrics', () => state.offeringLyrics, (v) => { state.offeringLyrics = v; renderStrip($('offeringStrip'), v, null, 'orange'); showOffering(); });
  const showOffering = () => { const el = $('offeringNow'); const t = (state.offeringTitle || '').trim(); el.textContent = t || (state.offeringLyrics.trim() ? '제목 없음' : '아직 없음'); el.className = t ? '' : 'empty'; };
  bind('offeringTitle', () => state.offeringTitle, (v) => { state.offeringTitle = v; showOffering(); });
  showOffering();
  // 펼치기/접기 (기억하지 않음)
  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    const id = btn.dataset.toggle, panel = $(id), label = btn.querySelector('.tl');
    const base = label.textContent.replace(/ 보기$/, '');
    const set = (open) => { panel.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); label.textContent = base + (open ? ' 숨기기' : ' 보기'); };
    set(false); // 열 때마다 항상 접힌 상태로 시작
    btn.onclick = () => set(panel.hidden);
  });
  bind('offeringPrayer', () => state.offeringPrayer, (v) => (state.offeringPrayer = v));
  bind('notice', () => state.notice, (v) => (state.notice = v));

  /* ---------- 가사 미리보기 ---------- */
  function renderStrip(el, lyrics, title, color) {
    el.innerHTML = '';
    const mk = (cls, text, tag) => { const c = document.createElement('div'); c.className = 'chip ' + cls + (color === 'orange' ? ' orange' : ''); c.textContent = text; if (tag) { const t = document.createElement('span'); t.className = 'tag'; t.textContent = tag; c.appendChild(t); } el.appendChild(c); };
    if (title != null) mk('title', title || '제목');
    for (const s of KidsPPT.parseLyrics(lyrics)) {
      if (s.kind === 'interlude') mk('inter', '( 간주 )');
      else mk('', s.lines.join('\n').slice(0, 60), s.kind === 'last' ? '마지막' : '');
    }
  }

  /* ---------- 찬양 카드 ---------- */
  function renderSongs() {
    const box = $('songs'); box.innerHTML = '';
    state.songs.forEach((song, i) => {
      song.color = i % 2 ? 'orange' : 'blue'; // 홀수번 파랑, 짝수번 주황 (순서로 정해짐)
      const card = document.createElement('div');
      card.className = 'song' + (song.color === 'orange' ? ' orange' : '');
      card.innerHTML = `
        <div class="song-head">
          <span class="song-no">${i + 1}</span>
          <input type="text" id="st-${song.id}" placeholder="찬양 제목" aria-label="찬양 제목">
          <span class="color-tag">${song.color === 'orange' ? '주황' : '파랑'}</span>
          <button type="button" class="ghost up" aria-label="위로" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="ghost down" aria-label="아래로" ${i === state.songs.length - 1 ? 'disabled' : ''}>↓</button>
        </div>
        <textarea class="lyrics" id="sl-${song.id}" aria-label="가사" placeholder="첫 번째 슬라이드 가사&#10;&#10;두 번째 슬라이드 가사"></textarea>
        <div class="strip"></div>
        <div class="song-foot"><span class="cnt"></span><span class="spacer"></span><button type="button" class="ghost keep">목록에 저장</button><span class="del-wrap"><button type="button" class="ghost del">빼기</button></span></div>`;
      const t = card.querySelector('input'), ta = card.querySelector('textarea'), strip = card.querySelector('.strip'), cnt = card.querySelector('.cnt');
      t.value = song.title; ta.value = song.lyrics;
      const refresh = () => { renderStrip(strip, song.lyrics, song.title, song.color); cnt.textContent = `슬라이드 ${KidsPPT.parseLyrics(song.lyrics).length + 2}장`; };
      refresh();
      t.addEventListener('input', () => { song.title = t.value; refresh(); changed(); });
      ta.addEventListener('input', () => { song.lyrics = ta.value; refresh(); changed(); });
      card.querySelector('.up').onclick = () => { state.songs.splice(i - 1, 0, state.songs.splice(i, 1)[0]); renderSongs(); changed(); };
      card.querySelector('.down').onclick = () => { state.songs.splice(i + 1, 0, state.songs.splice(i, 1)[0]); renderSongs(); changed(); };
      card.querySelector('.keep').onclick = async (e) => {
        const b = e.currentTarget;
        if (!song.title.trim() || !song.lyrics.trim()) { b.textContent = '제목과 가사를 먼저 써 주세요'; setTimeout(() => (b.textContent = '목록에 저장'), 1800); return; }
        try { const r = await Lib.put({ title: song.title, color: song.color, lyrics: song.lyrics }, `${(state.date || '').replace(/-/g, '.')} 직접 저장`); b.textContent = r === 'exists' ? '이미 같은 가사가 있어요' : '저장됨 ✓'; }
        catch (err) { b.textContent = '저장하지 못했어요'; }
        Lib.pending.clear();
        setTimeout(() => (b.textContent = '목록에 저장'), 1800);
      };
      const dw = card.querySelector('.del-wrap');
      card.querySelector('.del').onclick = () => {
        dw.innerHTML = '<span class="confirm">이 찬양을 뺄까요? <button type="button" class="yes">빼기</button><button type="button" class="ghost no">취소</button></span>';
        dw.querySelector('.yes').onclick = () => { state.songs.splice(i, 1); renderSongs(); changed(); };
        dw.querySelector('.no').onclick = () => renderSongs();
      };
      box.appendChild(card);
    });
  }
  $('addSong').onclick = () => {
    const last = state.songs[state.songs.length - 1];
    state.songs.push({ id: uid(), title: '', color: last && last.color !== 'orange' ? 'orange' : 'blue', lyrics: '' });
    renderSongs(); changed();
    $('st-' + state.songs[state.songs.length - 1].id).focus();
  };

  /* ---------- 퀴즈 ---------- */
  function renderQuiz() {
    const box = $('quizList'); box.innerHTML = '';
    state.quiz.forEach((q, i) => {
      const row = document.createElement('div'); row.className = 'quiz';
      row.innerHTML = `<textarea rows="3" id="qq-${i}" aria-label="퀴즈 ${i + 1} 문제" placeholder="문제"></textarea><input type="text" class="ans" id="qa-${i}" aria-label="정답" placeholder="정답"><button type="button" class="ghost" aria-label="퀴즈 빼기">✕</button>`;
      const [ta, inp, del] = row.children;
      ta.value = q.q; inp.value = q.a;
      ta.oninput = () => { q.q = ta.value; changed(); };
      inp.oninput = () => { q.a = inp.value; changed(); };
      del.onclick = () => { state.quiz.splice(i, 1); renderQuiz(); changed(); };
      box.appendChild(row);
    });
  }
  $('addQuiz').onclick = () => { state.quiz.push({ q: '', a: '' }); renderQuiz(); changed(); };

  /* ---------- 그림 ---------- */
  async function readImage(file) {
    const data = await file.arrayBuffer();
    const url = URL.createObjectURL(file);
    const dims = await new Promise((res) => { const im = new Image(); im.onload = () => res([im.naturalWidth, im.naturalHeight]); im.onerror = () => res([16, 9]); im.src = url; });
    const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
    return { name: file.name.replace(/\.[^.]+$/, ''), data, ext, w: dims[0], h: dims[1], url };
  }
  function setupImages(key, dropId, inputId, thumbsId) {
    const drop = $(dropId), input = $(inputId);
    const add = async (files) => {
      const list = [...files].filter((f) => /^image\//.test(f.type)).sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true }));
      for (const f of list) images[key].push(await readImage(f));
      render(); changed();
    };
    input.onchange = () => { add(input.files); input.value = ''; };
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); add(e.dataTransfer.files); });
    function render() {
      const box = $(thumbsId); box.innerHTML = '';
      images[key].forEach((im, i) => {
        const d = document.createElement('div'); d.className = 'thumb';
        d.innerHTML = `<img alt=""><span class="n">${i + 1}</span><div class="ctl"><button type="button" aria-label="앞으로">←</button><button type="button" aria-label="빼기">✕</button><button type="button" aria-label="뒤로">→</button></div>`;
        d.querySelector('img').src = im.url; d.querySelector('img').alt = im.name;
        const [l, x, r] = d.querySelectorAll('button');
        l.onclick = () => { if (i > 0) { images[key].splice(i - 1, 0, images[key].splice(i, 1)[0]); render(); changed(); } };
        r.onclick = () => { if (i < images[key].length - 1) { images[key].splice(i + 1, 0, images[key].splice(i, 1)[0]); render(); changed(); } };
        x.onclick = () => { images[key].splice(i, 1); render(); changed(); };
        box.appendChild(d);
      });
    }
  }
  setupImages('sermonImages', 'sermonDrop', 'sermonFiles', 'sermonThumbs');
  setupImages('posters', 'posterDrop', 'posterFiles', 'posterThumbs');

  /* ---------- 설교 PPT ---------- */
  let deck = null; // {name, data, info, include:Set}
  async function loadDeck(file) {
    if (!file) return;
    if (!/\.pptx$/i.test(file.name)) { $('deckInfo').hidden = false; $('deckName').textContent = file.name; $('deckSlides').innerHTML = ''; $('deckMsg').textContent = 'PowerPoint(.pptx) 파일만 넣을 수 있어요. 예전 .ppt 파일은 PowerPoint에서 .pptx로 다시 저장해 주세요.'; return; }
    $('deckInfo').hidden = false; $('deckName').textContent = file.name; $('deckSlides').innerHTML = ''; $('deckMsg').textContent = '슬라이드를 읽는 중…';
    try {
      const data = await file.arrayBuffer();
      const info = await KidsPPT.inspectDeck(JSZip, data.slice(0));
      deck = { name: file.name, data, info, include: new Set(info.slides.filter((s) => !s.hidden).map((s) => s.n)) };
      renderDeck(); changed();
    } catch (e) { console.error(e); deck = null; $('deckMsg').textContent = '이 파일을 읽지 못했어요. PowerPoint에서 열리는 .pptx 파일인지 확인해 주세요.'; renderCue(); }
  }
  function renderDeck() {
    if (!deck) { $('deckInfo').hidden = true; return; }
    $('deckInfo').hidden = false; $('deckName').textContent = deck.name;
    const info = deck.info, hidden = info.slides.filter((s) => s.hidden).length;
    let msg = `${info.count}장 중 ${deck.include.size}장을 넣어요. 빼고 싶은 슬라이드는 눌러서 끄세요.`;
    if (hidden) msg += ` 숨겨진 슬라이드 ${hidden}장은 꺼 두었어요.`;
    if (!info.sameSize) msg += ' 화면 비율이 달라서(4:3 등) 크기를 맞추고 가운데에 놓아요.';
    $('deckMsg').textContent = msg;
    const box = $('deckSlides'); box.innerHTML = '';
    for (const s of info.slides) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'sl';
      b.setAttribute('aria-pressed', deck.include.has(s.n) ? 'true' : 'false');
      b.innerHTML = '<span class="no"></span><span class="tx"></span><span class="bd"></span>';
      b.querySelector('.no').textContent = s.n;
      b.querySelector('.tx').textContent = s.text || (s.pics ? `그림 ${s.pics}개` : '(빈 화면)');
      const bd = b.querySelector('.bd');
      const badge = (t, c) => { const e = document.createElement('span'); e.textContent = t; if (c) e.className = c; bd.appendChild(e); };
      if (s.anim) badge('애니메이션', 'anim');
      if (s.hidden) badge('숨김');
      b.onclick = () => { deck.include.has(s.n) ? deck.include.delete(s.n) : deck.include.add(s.n); renderDeck(); changed(); };
      box.appendChild(b);
    }
  }
  $('deckFile').onchange = (e) => { loadDeck(e.target.files[0]); e.target.value = ''; };
  const ddrop = $('deckDrop');
  ddrop.addEventListener('dragover', (e) => { e.preventDefault(); ddrop.classList.add('over'); });
  ddrop.addEventListener('dragleave', () => ddrop.classList.remove('over'));
  ddrop.addEventListener('drop', (e) => { e.preventDefault(); ddrop.classList.remove('over'); loadDeck(e.dataTransfer.files[0]); });
  $('deckAll').onclick = () => { if (deck) { deck.include = new Set(deck.info.slides.map((s) => s.n)); renderDeck(); changed(); } };
  $('deckRemove').onclick = () => { deck = null; renderDeck(); changed(); };

  /* ---------- 큐시트 ---------- */
  const fullData = () => ({ ...state, sermonImages: images.sermonImages, posters: images.posters, posterLabel: `${verseMonth()}월의 암송 말씀`,
    sermonDeck: deck && deck.include.size ? { data: deck.data, include: [...deck.include].sort((x, y) => x - y) } : null });
  function renderCue() {
    const plan = KidsPPT.plan(fullData());
    const groups = [];
    for (const s of plan) { const g = groups[groups.length - 1]; if (g && g.name === s.section) g.n++; else groups.push({ name: s.section, n: 1 }); }
    $('cue').innerHTML = '';
    for (const g of groups) { const li = document.createElement('li'); const a = document.createElement('span'); a.textContent = g.name; const b = document.createElement('span'); b.className = 'cnt'; b.textContent = g.n + '장'; li.append(a, b); $('cue').appendChild(li); }
    $('total').textContent = `모두 ${plan.length}장 · 파일 이름 : ${fileName()}`;
    $('fileHint').textContent = `파일 이름 : ${fileName()}`;
    $('verseMonth').textContent = `${verseMonth()}월의 암송 말씀`;
  }
  function verseMonth() { const m = /^\d{4}-(\d{2})/.exec(state.date || nextSunday()); return m ? +m[1] : new Date().getMonth() + 1; }
  function fileName() { return (state.date || nextSunday()).replace(/-/g, '') + '_아동부_주일예배.pptx'; }
  function changed() { save(); renderCue(); }

  /* ---------- PPT 만들기 ---------- */
  let tplPromise;
  const getTemplate = () => (tplPromise = tplPromise || fetch('template.pptx').then((r) => { if (!r.ok) throw new Error('견본 파일을 불러오지 못했어요'); return r.arrayBuffer(); }));
  getTemplate().catch(() => { tplPromise = null; });
  const setStatus = (el, msg, cls) => { el.textContent = msg; el.className = 'status' + (cls ? ' ' + cls : ''); };
  $('make').onclick = async () => {
    const btn = $('make'); btn.disabled = true; setStatus($('status'), '만드는 중…');
    try {
      const tpl = await getTemplate();
      const d = fullData();
      d.sermonImages = d.sermonImages.map((im) => ({ ...im, data: im.data.slice(0) }));
      d.posters = d.posters.map((im) => ({ ...im, data: im.data.slice(0) }));
      if (d.sermonDeck) d.sermonDeck = { ...d.sermonDeck, data: d.sermonDeck.data.slice(0) };
      const bytes = await KidsPPT.generate(JSZip, tpl.slice(0), d);
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      const dl = window.claude ? await window.claude.use('downloads') : null;
      if (dl) {
        try { await dl.save({ filename: fileName(), data: blob }); setStatus($('status'), `${fileName()} 저장했어요.`, 'ok'); }
        catch (e) { setStatus($('status'), e && e.code === 'declined' ? '저장을 취소했어요. 다시 누르면 또 물어봐요.' : '이 화면에서는 파일을 저장할 수 없어요. 다른 브라우저에서 열어 보세요.', e && e.code === 'declined' ? '' : 'err'); }
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName(); document.body.appendChild(a); a.click(); a.remove();
        setStatus($('status'), `${fileName()} 내려받기를 시작했어요.`, 'ok');
      }
    } catch (e) {
      console.error(e); setStatus($('status'), '만들지 못했어요: ' + (e.message || e), 'err');
    } finally { btn.disabled = false; }
  };

  /* ---------- 찬양 목록 (함께 쓰는 목록) ---------- */
  const norm = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
  // 제목과 가사가 모두 같으면 같은 찬양으로 본다 (띄어쓰기·줄바꿈 차이는 무시)
  // 예전 형식의 "봉헌 · " 머리말은 제목 비교·표시에서 뺀다
  const cleanTitle = (t) => String(t || '').replace(/^봉헌\s*·\s*/, '').trim();
  const showTitle = (t) => cleanTitle(t).replace(/\s*\/\s*/g, ' ');
  const tnorm = (t) => norm(cleanTitle(t));
  const songKey = (s) => tnorm(s.title) + '|' + norm(s.lyrics);
  function songId(song) {
    const k = songKey(song); let h1 = 5381, h2 = 0;
    for (const c of k) { const x = c.charCodeAt(0); h1 = ((h1 << 5) + h1 + x) >>> 0; h2 = (x + (h2 << 6) + (h2 << 16) - h2) >>> 0; }
    return 'v' + h1.toString(36) + h2.toString(36);
  }
  // 파일 이름의 날짜(20261011_…)를 "2026.10.11"로
  function sourceLabel(name) {
    const m = String(name || '').match(/(20\d{2})[.\-_]?(\d{2})[.\-_]?(\d{2})/);
    return m ? `${m[1]}.${m[2]}.${m[3]} PPT` : String(name || '').replace(/\.pptx$/i, '');
  }
  const LKEY = 'kids-worship-ppt-songs-v1';
  const Lib = {
    songs: [], db: null,
    async init() {
      const db = window.claude ? await window.claude.use('db') : null;
      if (db) {
        this.db = db;
        db.collection('songs').onSnapshot((snap) => { this.songs = snap.docs.map((d) => ({ id: d.id, ...d.data() })); renderLib(); },
          () => setStatus($('libStatus'), '찬양 목록을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.', 'err'));
      } else {
        // Claude 밖(GitHub 주소 등): 저장소의 songs.json(Claude 페이지 목록을 옮긴 것)에
        // 이 브라우저에서 더하거나 고친 것을 겹쳐 보여준다
        try { this.local = JSON.parse(localStorage.getItem(LKEY) || '[]'); } catch (e) { this.local = []; }
        this.merge(); renderLib();
        try {
          const r = await fetch('songs.json', { cache: 'no-cache' });
          if (r.ok) { const list = await r.json(); if (Array.isArray(list)) { this.shared = list; this.merge(); renderLib(); } }
        } catch (e) { /* 파일이 없으면 이 브라우저 목록만 쓴다 */ }
      }
    },
    shared: [], local: [],
    merge() {
      const byId = new Map();
      this.shared.forEach((s) => byId.set(s.id, s));
      this.local.forEach((s) => byId.set(s.id, { ...(byId.get(s.id) || {}), ...s }));
      this.songs = [...byId.values()];
    },
    saveLocal() { try { localStorage.setItem(LKEY, JSON.stringify(this.local)); } catch (e) {} this.merge(); renderLib(); },
    // 'exists' = 제목·가사가 같은 찬양이 이미 있어 넣지 않음, 'added' = 새로 저장
    async put(song, source, extra) {
      if (this.has(song)) return 'exists';
      const id = songId(song);
      const doc = { title: cleanTitle(song.title), color: song.color === 'orange' ? 'orange' : 'blue', lyrics: song.lyrics, addedAt: new Date().toISOString(), source: source || '', ...(extra || {}) };
      this.pending.add(songKey(song));
      if (this.db) { await this.db.collection('songs').doc(id).set(doc); }
      else { this.local = this.local.filter((s) => s.id !== id).concat({ id, ...doc }); this.saveLocal(); }
      return 'added';
    },
    pending: new Set(),
    async update(id, fields) {
      if (this.db) await this.db.collection('songs').doc(id).update(fields);
      else {
        const cur = this.songs.find((s) => s.id === id) || { id };
        this.local = this.local.filter((s) => s.id !== id).concat({ ...cur, ...fields });
        this.saveLocal();
      }
    },
    async del(id) {
      if (this.db) await this.db.collection('songs').doc(id).delete();
      else { this.local = this.local.filter((s) => s.id !== id); this.shared = this.shared.filter((s) => s.id !== id); this.saveLocal(); }
    },
    has(song) { const k = songKey(song); return this.pending.has(k) || this.songs.some((s) => songKey(s) === k); },
    hasTitle(title) { const t = tnorm(title); return this.songs.some((s) => tnorm(s.title) === t); },
  };
  function renderLib() {
    $('libCount').textContent = Lib.songs.length ? `${Lib.songs.length}곡` : '비어 있음';
    const q = norm($('libSearch').value);
    const list = Lib.songs.filter((s) => !q || tnorm(s.title).includes(q) || norm(s.lyrics).includes(q) || norm(s.note).includes(q)).sort((a, b) => cleanTitle(a.title).localeCompare(cleanTitle(b.title), 'ko') || String(b.addedAt || b.updatedAt || '').localeCompare(String(a.addedAt || a.updatedAt || '')));
    const titleCount = {};
    Lib.songs.forEach((s) => { const t = tnorm(s.title); titleCount[t] = (titleCount[t] || 0) + 1; });
    $('libHint').hidden = !Object.values(titleCount).some((n) => n > 1);
    const box = $('lib'); box.innerHTML = '';
    if (!Lib.songs.length) { box.innerHTML = '<p class="empty">아직 저장된 찬양이 없어요.<br>위에 지난 주일 PPT 파일을 넣거나, 찬양 카드의 "목록에 저장"을 눌러 모아 보세요.</p>'; return; }
    if (!list.length) { box.innerHTML = '<p class="empty">찾는 찬양이 없어요.</p>'; return; }
    for (const s of list) {
      const it = document.createElement('div'); it.className = 'lib-item';
      it.innerHTML = '<div class="info"><div class="t"><span class="tt"></span><span class="cnt"></span></div><div class="ly"></div><div class="ly"></div></div><div class="a"><button type="button" class="use">찬양에 넣기</button><button type="button" class="off">봉헌 찬양으로</button></div>';
      // 목록에서는 제목의 / 줄나눔 표시를 빼고 보여준다 (PPT 제목에는 그대로 쓰임)
      it.querySelector('.tt').textContent = showTitle(s.title);
      const blocks = KidsPPT.parseLyrics(s.lyrics);
      let cnt = `총 ${blocks.length}장`;
      const dup = titleCount[tnorm(s.title)] > 1;
      if (dup) {
        const m = /(\d{4})\.(\d{2})\.(\d{2})/.exec(s.source || '');
        const d = m ? `${+m[2]}/${+m[3]}` : (s.addedAt || s.updatedAt) ? (() => { const x = new Date(s.addedAt || s.updatedAt); return `${x.getMonth() + 1}/${x.getDate()}`; })() : '';
        if (d) cnt += ` · ${d} PPT`;
      }
      // 같은 제목이 여러 개면 버전마다 차이점을 적어 둔다
      if (dup || s.note) {
        const note = document.createElement('label'); note.className = 'note';
        note.innerHTML = '<span>차이점</span><input type="text" placeholder="예: 랩 제거 버전">';
        const inp = note.querySelector('input');
        inp.value = s.note || ''; inp.setAttribute('aria-label', `${showTitle(s.title)} 차이점`);
        const saveNote = () => {
          const v = inp.value.trim();
          if (v === (s.note || '')) return;
          Lib.update(s.id, { note: v }).then(() => setStatus($('libStatus'), v ? `"${showTitle(s.title)}" 차이점을 "${v}"(으)로 적었어요.` : `"${showTitle(s.title)}" 차이점을 지웠어요.`, 'ok'))
            .catch(() => setStatus($('libStatus'), '차이점을 저장하지 못했어요. 편집 권한이 있는지 확인해 주세요.', 'err'));
        };
        inp.addEventListener('change', saveNote);
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
        it.querySelector('.info').appendChild(note);
      }
      it.querySelector('.cnt').textContent = cnt;
      const first = blocks.find((b) => b.kind !== 'interlude');
      const lines = first ? first.lines : [];
      const ly = it.querySelectorAll('.ly');
      ly[0].textContent = lines[0] || '';
      ly[1].textContent = lines[1] || '';
      if (!lines[1]) ly[1].remove();
      it.querySelector('.use').onclick = () => { state.songs.push({ id: uid(), title: cleanTitle(s.title), color: s.color, lyrics: s.lyrics }); renderSongs(); changed(); setStatus($('libStatus'), `"${showTitle(s.title)}"을(를) ${state.songs.length}번째 찬양으로 넣었어요.`, 'ok'); };
      it.querySelector('.off').onclick = () => { state.offeringLyrics = s.lyrics; $('offeringLyrics').value = s.lyrics; state.offeringTitle = cleanTitle(s.title); $('offeringTitle').value = state.offeringTitle; showOffering(); renderStrip($('offeringStrip'), s.lyrics, null, 'orange'); changed(); setStatus($('libStatus'), `"${showTitle(s.title)}"을(를) 봉헌 찬양으로 넣었어요.`, 'ok'); };
      box.appendChild(it);
    }
  }
  $('libSearch').addEventListener('input', renderLib);
  const openLib = () => { $('drawer').hidden = false; setTimeout(() => $('libSearch').focus(), 50); };
  const closeLib = () => { $('drawer').hidden = true; };
  ['openLib1', 'openLib2', 'openLib3'].forEach((id) => ($(id).onclick = openLib));
  $('closeLib').onclick = closeLib; $('drawerBg').onclick = closeLib;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('drawer').hidden) closeLib(); });

  let importing = false;
  async function importFiles(files) {
    if (importing || !files.length) return;
    importing = true;
    const bad = files.filter((f) => !/\.pptx$/i.test(f.name));
    files = files.filter((f) => /\.pptx$/i.test(f.name)).sort((x, y) => y.name.localeCompare(x.name, 'ko', { numeric: true })); // 최근 파일부터
    let added = 0, same = 0, failed = bad.length, noSongs = 0;
    const cands = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setStatus($('libStatus'), `가사를 읽는 중… (${i + 1}/${files.length}) ${f.name}`);
        try {
          const songs = (await KidsPPT.importSongs(JSZip, await f.arrayBuffer())).filter((s) => s.title && s.lyrics.trim());
          if (!songs.length) noSongs++;
          songs.forEach((s) => cands.push({ ...s, source: sourceLabel(f.name) }));
        } catch (e) { console.error(e); failed++; }
      }
      // 이번에 저장한 것까지 포함해 같은 찬양·같은 제목을 찾는다
      const batch = [];
      const pool = () => Lib.songs.concat(batch);
      const conflicts = [];
      for (const s of cands) {
        const k = songKey(s);
        if (pool().some((x) => songKey(x) === k)) { same++; continue; }
        if (pool().some((x) => tnorm(x.title) === tnorm(s.title))) { conflicts.push(s); continue; }
        await Lib.put(s, s.source); added++;
        batch.push({ id: songId(s), title: s.title, color: s.color, lyrics: s.lyrics, source: s.source, addedAt: new Date().toISOString() });
      }
      // 가사가 다른 찬양은 한 곡씩 비교해서 고른다
      let kept = 0, replaced = 0, both = 0, applyAll = null, stopped = 0;
      for (let i = 0; i < conflicts.length; i++) {
        const s = conflicts[i];
        if (pool().some((x) => songKey(x) === songKey(s))) { same++; continue; }
        const versions = pool().filter((x) => tnorm(x.title) === tnorm(s.title)).sort((x, y) => String(y.addedAt || y.updatedAt || '').localeCompare(String(x.addedAt || x.updatedAt || '')));
        const saved = versions[0];
        let choice = applyAll, ans = null;
        if (!choice) {
          setStatus($('libStatus'), `가사가 다른 찬양을 확인하는 중… (${i + 1}/${conflicts.length})`);
          ans = await askCompare(saved, s, i + 1, conflicts.length, versions.length);
          if (!ans) { stopped = conflicts.length - i; break; }
          choice = ans.choice;
          if (ans.applyAll) applyAll = choice;
        }
        if (choice === 'keep') { kept++; continue; }
        if (choice === 'replace') {
          try { await Lib.del(saved.id); } catch (e) { console.error(e); }
          const bi = batch.findIndex((x) => x.id === saved.id); if (bi >= 0) batch.splice(bi, 1);
          replaced++;
        } else {
          both++;
          if (ans && ans.savedNote != null && ans.savedNote !== (saved.note || '')) { try { await Lib.update(saved.id, { note: ans.savedNote }); } catch (e) { console.error(e); } }
        }
        await Lib.put(s, s.source, choice === 'both' && ans && ans.upNote ? { note: ans.upNote } : undefined);
        batch.push({ id: songId(s), title: s.title, color: s.color, lyrics: s.lyrics, source: s.source, addedAt: new Date().toISOString() });
      }
      let msg = added ? `새 찬양 ${added}곡을 저장했어요.` : '새로 저장할 찬양은 없었어요.';
      if (same) msg += ` 제목과 가사가 같은 ${same}곡은 이미 있어서 넣지 않았어요.`;
      if (conflicts.length) {
        const parts = [];
        if (replaced) parts.push(`${replaced}곡은 올린 가사로 바꿨어요`);
        if (both) parts.push(`${both}곡은 다른 버전으로 함께 저장했어요`);
        if (kept) parts.push(`${kept}곡은 저장된 가사를 그대로 뒀어요`);
        if (stopped) parts.push(`${stopped}곡은 확인하지 않고 그만둬서 넣지 않았어요`);
        msg += ` 가사가 다른 찬양 중 ` + parts.join(', ') + '.';
      }
      if (noSongs) msg += ` ${noSongs}개 파일에서는 찬양을 찾지 못했어요.`;
      if (failed) msg += ` ${failed}개 파일은 읽지 못했어요(.pptx만 가능).`;
      setStatus($('libStatus'), msg, failed && !added ? 'err' : 'ok');
    } catch (e) {
      console.error(e); setStatus($('libStatus'), '가져오다 문제가 생겼어요: ' + (e.message || e), 'err');
    } finally { importing = false; Lib.pending.clear(); }
  }

  /* ---------- 가사 비교 팝업 (A안: 나란히 보기) ---------- */
  function slidesOf(lyrics) {
    return KidsPPT.parseLyrics(lyrics).map((b) => (b.kind === 'interlude' ? { lines: ['( 간주 )'], last: false } : { lines: b.lines, last: b.kind === 'last' }));
  }
  function lineNode(a, b) {
    const div = document.createElement('div');
    if (b == null || a === b) { div.textContent = a; return div; }
    const aw = a.split(' '), bw = b.split(' ');
    aw.forEach((w, i) => {
      if (i) div.appendChild(document.createTextNode(' '));
      if (w !== bw[i]) { const m = document.createElement('mark'); m.textContent = w; div.appendChild(m); }
      else div.appendChild(document.createTextNode(w));
    });
    return div;
  }
  function renderCompareCol(box, mine, other) {
    box.innerHTML = '';
    const n = Math.max(mine.length, other.length);
    let diffCount = 0;
    for (let i = 0; i < n; i++) {
      const m = mine[i], o = other[i];
      const differs = !m || !o || m.last !== o.last || m.lines.join('\n') !== o.lines.join('\n');
      if (differs) diffCount++;
      const row = document.createElement('div');
      row.className = 'cmp-row' + (!m ? ' gone' : differs ? ' diff' : '');
      const no = document.createElement('span'); no.className = 'cmp-no'; no.textContent = i + 1; row.appendChild(no);
      const body = document.createElement('div'); body.className = 'cmp-body';
      if (!m) body.textContent = '이 슬라이드 없음';
      else {
        if (m.last) { const t = document.createElement('span'); t.className = 'cmp-tag'; t.textContent = '마지막'; body.appendChild(t); }
        m.lines.forEach((l, k) => body.appendChild(lineNode(l, o && o.lines[k] != null ? o.lines[k] : null)));
      }
      row.appendChild(body); box.appendChild(row);
    }
    return diffCount;
  }
  function askCompare(saved, up, idx, total, versionCount) {
    return new Promise((resolve) => {
      const S = slidesOf(saved.lyrics), U = slidesOf(up.lyrics);
      $('cmpStep').textContent = total > 1 ? `가사가 다른 찬양 · ${idx} / ${total}` : '가사가 다른 찬양';
      $('cmpTitle').textContent = up.title;
      const when = saved.addedAt || saved.updatedAt;
      const d = when ? new Date(when) : null;
      $('cmpSavedMeta').textContent = [saved.source || '', d ? `${d.getMonth() + 1}/${d.getDate()} 등록` : '', `${S.length}장`].filter(Boolean).join(' · ');
      $('cmpUpMeta').textContent = [up.source || '', `${U.length}장`].filter(Boolean).join(' · ');
      const diffs = renderCompareCol($('cmpSaved'), S, U);
      renderCompareCol($('cmpUp'), U, S);
      $('cmpLead').textContent = `같은 제목의 찬양이 목록에 있는데 가사가 달라요. ${diffs}곳이 달라서 표시했어요.` + (versionCount > 1 ? ` (저장된 버전 ${versionCount}개 중 가장 최근 것과 비교해요.)` : '');
      const rest = total - idx;
      $('cmpAllWrap').hidden = rest < 1;
      $('cmpAllText').textContent = `남은 ${rest}곡에도 같은 선택 적용`;
      $('cmpAll').checked = false;
      $('cmpNoteSaved').value = saved.note || ''; $('cmpNoteUp').value = '';
      let choice = 'keep';
      const radios = [...document.querySelectorAll('#cmpChoices .cmp-choice')];
      const sync = () => {
        radios.forEach((r) => { const on = r.dataset.v === choice; r.setAttribute('aria-checked', on ? 'true' : 'false'); r.tabIndex = on ? 0 : -1; });
        $('cmpOk').textContent = { keep: '이대로 두기', replace: '바꾸기', both: '둘 다 저장' }[choice];
        $('cmpNotes').hidden = choice !== 'both';
      };
      radios.forEach((r, i) => {
        r.onclick = () => { choice = r.dataset.v; sync(); };
        r.onkeydown = (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const j = (i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : radios.length - 1)) % radios.length;
            choice = radios[j].dataset.v; sync(); radios[j].focus();
          }
        };
      });
      sync();
      const done = (val) => { $('cmp').hidden = true; document.removeEventListener('keydown', onKey, true); resolve(val); };
      const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); done(null); } };
      document.addEventListener('keydown', onKey, true);
      $('cmpOk').onclick = () => done({ choice, applyAll: $('cmpAll').checked, savedNote: $('cmpNoteSaved').value.trim(), upNote: $('cmpNoteUp').value.trim() });
      $('cmpStop').onclick = () => done(null);
      $('cmpClose').onclick = () => done(null);
      $('cmp').hidden = false;
      $('cmpSaved').scrollTop = 0; $('cmpUp').scrollTop = 0;
      setTimeout(() => radios[0].focus(), 30);
    });
  }
  // 두 칸 스크롤을 함께 움직이기
  (() => {
    let lock = false;
    const link = (a, b) => a.addEventListener('scroll', () => { if (lock) return; lock = true; b.scrollTop = a.scrollTop; requestAnimationFrame(() => (lock = false)); });
    link($('cmpSaved'), $('cmpUp')); link($('cmpUp'), $('cmpSaved'));
  })();
  $('importFiles').onchange = (e) => { importFiles([...e.target.files]); e.target.value = ''; };
  const idrop = $('importDrop');
  idrop.addEventListener('dragover', (e) => { e.preventDefault(); idrop.classList.add('over'); });
  idrop.addEventListener('dragleave', () => idrop.classList.remove('over'));
  idrop.addEventListener('drop', (e) => { e.preventDefault(); idrop.classList.remove('over'); importFiles([...e.dataTransfer.files]); });

  /* ---------- 시작 ---------- */
  renderSongs(); renderQuiz(); renderStrip($('offeringStrip'), state.offeringLyrics, null, 'orange'); renderCue();
  Lib.init();
})();
