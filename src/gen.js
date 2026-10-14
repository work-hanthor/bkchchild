/* 아동부 예배 PPT 생성기 — 견본(template.pptx)의 슬라이드를 복제해 내용만 바꿔 넣는다. */
(function (global) {
  const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
  const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const SLIDE_W = 9144000, SLIDE_H = 5143500;

  // 견본 슬라이드 번호 (template.pptx 안의 slideN.xml)
  const P = {
    welcome: 1, callTitle: 2, callVerse: 3, creedTitle: 4, creed: 5, blank: 6, praiseTitle: 7,
    songTitle: { blue: 9, orange: 20 }, lyric: { blue: 10, orange: 21 },
    interlude: { blue: 13, orange: 25 }, lyricLast: { blue: 17, orange: 30 },
    prayerTitle: 79, prayerPerson: 80, bibleIntro: 82, bibleVerse: 83, bibleVerseAmen: 84,
    choir: 86, sermonTitle: 88, offeringTitle: 103, offeringLyric: 104, offeringPrayer: 110,
    benediction: 111, noticeTitle: 113, quizTitle: 114, quiz: 115, notice: 117, image: 118, end: 119,
  };

  const parseXml = (s) => new DOMParser().parseFromString(s, 'application/xml');
  const serialize = (d) => { let s = new XMLSerializer().serializeToString(d); return s.startsWith('<?xml') ? s : XML_DECL + s; };
  const kids = (el, ns, name) => [...el.childNodes].filter((n) => n.nodeType === 1 && n.namespaceURI === ns && n.localName === name);
  const all = (el, ns, name) => [...el.getElementsByTagNameNS(ns, name)];
  const spText = (sp) => all(sp, NS_A, 't').map((t) => t.textContent).join('');
  const spName = (sp) => { const c = all(sp, NS_P, 'cNvPr')[0]; return c ? c.getAttribute('name') : ''; };
  const textShapes = (doc) => all(doc, NS_P, 'sp').filter((sp) => spText(sp).trim());
  const shapeByName = (doc, name) => all(doc, NS_P, 'sp').find((sp) => spName(sp) === name);

  /* ---------- 글자 폭 추정 (자동 글자 크기 조절용) ---------- */
  // sz(1/100pt)일 때 한 글자 폭(EMU). 한글은 거의 정사각, 공백·영문은 좁다.
  function charW(ch, sz) {
    const em = sz / 100 * 12700; // 1pt = 12700 EMU
    if (ch === ' ') return em * 0.3;
    if (/[ᄀ-ᇿ㄰-㆏가-힣一-鿿]/.test(ch)) return em * 0.92;
    if (/[A-Z]/.test(ch)) return em * 0.62;
    if (/[0-9a-z]/.test(ch)) return em * 0.52;
    return em * 0.45;
  }
  const strW = (s, sz) => [...s].reduce((w, c) => w + charW(c, sz), 0);
  function wrapCount(line, sz, width) {
    // 어절 단위 줄바꿈 흉내
    const words = line.split(/(\s+)/);
    let lines = 1, cur = 0;
    for (const w of words) {
      const ww = strW(w, sz);
      if (cur + ww > width && cur > 0) { lines++; cur = /^\s+$/.test(w) ? 0 : ww; while (cur > width) { lines++; cur -= width; } }
      else cur += ww;
    }
    return lines;
  }
  function fitSize(lines, base, min, width, height, lineGap = 1.2, paraGap = 0) {
    for (let sz = base; sz >= min; sz -= 100) {
      const lh = sz / 100 * 12700 * lineGap;
      let h = 0;
      lines.forEach((l) => { h += wrapCount(l.replace(/\*/g, ''), sz, width) * lh + paraGap; });
      if (h <= height) return sz;
    }
    return min;
  }
  function fitOneLine(lines, base, min, width) {
    let sz = base;
    for (const l of lines) {
      const w = strW(l.replace(/\*/g, ''), base);
      if (w > width) sz = Math.min(sz, Math.floor(base * width / w / 100) * 100);
    }
    return Math.max(min, sz);
  }

  /* ---------- 글상자 내용 바꾸기 ---------- */
  const colorKey = (rPr) => { const f = rPr && kids(rPr, NS_A, 'solidFill')[0]; return f ? new XMLSerializer().serializeToString(f) : ''; };
  // lines: 문자열 배열. *글자* 는 견본의 강조 색으로.
  function fillShape(sp, lines, opt = {}) {
    const doc = sp.ownerDocument;
    const body = all(sp, NS_P, 'txBody')[0];
    const paras = kids(body, NS_A, 'p');
    const tplP = paras.find((p) => kids(p, NS_A, 'r').length) || paras[0];
    const runs = all(body, NS_A, 'r');
    const normal = runs.length ? kids(runs[0], NS_A, 'rPr')[0] : null;
    const nKey = colorKey(normal);
    const accentRun = runs.find((r) => { const k = colorKey(kids(r, NS_A, 'rPr')[0]); return k && k !== nKey; });
    let accent = accentRun ? kids(accentRun, NS_A, 'rPr')[0] : null;
    if (!accent && normal) { accent = normal.cloneNode(true); accent.setAttribute('b', '1'); }
    const pPr = kids(tplP, NS_A, 'pPr')[0];
    const endPr = kids(tplP, NS_A, 'endParaRPr')[0];
    paras.forEach((p) => body.removeChild(p));
    const mkRPr = (src, tag) => {
      const el = doc.createElementNS(NS_A, tag);
      if (src) {
        for (const at of [...src.attributes]) if (at.name !== 'err') el.setAttribute(at.name, at.value);
        for (const c of [...src.childNodes]) el.appendChild(c.cloneNode(true));
      } else { el.setAttribute('lang', 'ko-KR'); }
      if (opt.sz) el.setAttribute('sz', String(opt.sz));
      return el;
    };
    lines.forEach((line, i) => {
      const p = doc.createElementNS(NS_A, 'a:p');
      if (pPr) {
        const pp = pPr.cloneNode(true);
        if (opt.startAt) { const an = all(pp, NS_A, 'buAutoNum')[0]; if (an) an.setAttribute('startAt', String(opt.startAt)); }
        if (opt.noNumber) {
          all(pp, NS_A, 'buAutoNum').forEach((n) => n.parentNode.removeChild(n));
          pp.setAttribute('marL', '0'); pp.setAttribute('indent', '0');
          const bn = doc.createElementNS(NS_A, 'a:buNone');
          const bf = all(pp, NS_A, 'buFont')[0];
          if (bf) pp.replaceChild(bn, bf); else pp.insertBefore(bn, pp.firstChild);
        }
        p.appendChild(pp);
      }
      let text = (i === 0 && opt.prefixFirst ? opt.prefixFirst : '') + line;
      const segs = text.split(/\*([^*]+)\*/);
      segs.forEach((seg, k) => {
        if (!seg) return;
        const r = doc.createElementNS(NS_A, 'a:r');
        r.appendChild(mkRPr(k % 2 ? accent : normal, 'a:rPr'));
        const t = doc.createElementNS(NS_A, 'a:t');
        t.textContent = seg;
        r.appendChild(t);
        p.appendChild(r);
      });
      p.appendChild(mkRPr(endPr || normal, 'a:endParaRPr'));
      body.appendChild(p);
    });
  }
  // 특정 문단·런의 글자만 바꾸기 (서식 그대로)
  function setRun(sp, pi, ri, text) {
    const p = kids(all(sp, NS_P, 'txBody')[0], NS_A, 'p')[pi];
    if (!p) return;
    const r = kids(p, NS_A, 'r')[ri];
    if (r) { kids(r, NS_A, 't')[0].textContent = text; const rp = kids(r, NS_A, 'rPr')[0]; if (rp) rp.removeAttribute('err'); }
  }
  function setXfrm(sp, x, y, cx, cy) {
    const off = all(sp, NS_A, 'off')[0], ext = all(sp, NS_A, 'ext').find((e) => e.parentNode.localName === 'xfrm');
    if (x != null) off.setAttribute('x', String(Math.round(x)));
    if (y != null) off.setAttribute('y', String(Math.round(y)));
    if (cx != null) ext.setAttribute('cx', String(Math.round(cx)));
    if (cy != null) ext.setAttribute('cy', String(Math.round(cy)));
  }

  /* ---------- 입력 해석 ---------- */
  const lines = (s) => String(s || '').replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, ''));
  const nonEmpty = (s) => lines(s).filter((l) => l.trim());
  // 가사: 빈 줄로 슬라이드 구분, "간주" 한 줄은 간주 슬라이드, 첫 줄 앞 [마지막] 은 마지막 표시
  function parseLyrics(text) {
    const blocks = String(text || '').replace(/\r/g, '').split(/\n\s*\n/).map((b) => lines(b).filter((l) => l.trim()));
    return blocks.filter((b) => b.length).map((b) => {
      if (b.length === 1 && /^\(?\s*간\s*주/.test(b[0].trim())) return { kind: 'interlude', lines: ['( 간 주 중 … )'] };
      let last = false;
      const ls = b.map((l) => l.trim());
      if (/^\[마지막\]\s*/.test(ls[0])) { last = true; ls[0] = ls[0].replace(/^\[마지막\]\s*/, ''); }
      return { kind: last ? 'last' : 'lyric', lines: ls.filter(Boolean) };
    }).filter((s) => s.lines.length);
  }
  // 성경 본문: "2 이에 왕이…" 처럼 절 번호로 시작하는 줄마다 한 장
  function parseVerses(text) {
    const out = [];
    for (const l of nonEmpty(text)) {
      const m = l.trim().match(/^(\d{1,3})[.\s)]\s*(.+)$/);
      if (m) out.push({ n: +m[1], text: m[2].trim() });
      else if (out.length) out[out.length - 1].text += ' ' + l.trim();
      else out.push({ n: null, text: l.trim() });
    }
    return out;
  }
  const hasBatchim = (word) => { const c = word.trim().slice(-1).charCodeAt(0); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };

  /* ---------- 슬라이드 순서 만들기 ---------- */
  // 각 항목: {proto, section, label, edit(doc), image}
  function plan(d) {
    const S = [];
    const add = (section, label, proto, edit, image, deckSlide) => S.push({ section, label, proto, edit, image, deckSlide });
    const bible = d.bible || {};
    const ref = `${bible.chapter || ''}:${bible.verses || ''}`;

    add('시작', '환영', P.welcome, (doc) => {
      const box = textShapes(doc).find((sp) => spText(sp).includes('헌금'));
      if (box && bible.book) { setRun(box, 2, 1, bible.book); setRun(box, 2, 3, bible.chapter || ''); setRun(box, 2, 5, bible.verses || ''); }
    });
    add('예배의 부름', '제목', P.callTitle);
    if (d.call && (d.call.ref || d.call.text)) {
      add('예배의 부름', d.call.ref || '말씀', P.callVerse, (doc) => {
        const t = textShapes(doc);
        const r = (d.call.ref || '').trim(); const k = r.lastIndexOf(' ');
        setRun(t[1], 0, 0, k > 0 ? r.slice(0, k + 1) : r); setRun(t[1], 0, 1, k > 0 ? r.slice(k + 1) : '');
        const ls = nonEmpty(d.call.text).map((l) => l.trim());
        fillShape(t[2], ls, { sz: fitSize(ls, 3200, 2000, 8600000, 2900000, 1.25) });
      });
    }
    add('신앙고백', '제목', P.creedTitle);
    add('신앙고백', '사도신경', P.creed);
    add('찬양', '빈 화면', P.blank);
    add('찬양', '제목', P.praiseTitle);
    add('찬양', '빈 화면', P.blank);
    (d.songs || []).forEach((song, si) => {
      const c = si % 2 ? 'orange' : 'blue'; // 홀수번 파랑, 짝수번 주황
      const name = song.title || `${si + 1}번째 찬양`;
      const sec = `찬양 ${si + 1} · ${name}`;
      add(sec, '곡 제목', P.songTitle[c], (doc) => editSongTitle(doc, name));
      for (const sl of parseLyrics(song.lyrics)) {
        if (sl.kind === 'interlude') add(sec, '간주', P.interlude[c]);
        else add(sec, sl.lines[0], sl.kind === 'last' ? P.lyricLast[c] : P.lyric[c], (doc) => {
          const box = textShapes(doc).find((sp) => spText(sp).trim() !== '마지막');
          const sz = Math.min(fitOneLine(sl.lines, 5400, 3600, 8700000), fitSize(sl.lines, 5400, 3600, 1e12, 4300000, 1.2));
          fillShape(box, sl.lines, { sz, prefixFirst: sl.kind === 'last' ? '   ' : '' });
        });
      }
      add(sec, '빈 화면', P.blank);
    });
    add('기도', '제목', P.prayerTitle);
    add('기도', d.prayer || '대표기도', P.prayerPerson, (doc) => { fillShape(textShapes(doc)[1], [d.prayer || '']); });
    add('기도', '빈 화면', P.blank);
    if (bible.book) {
      add('성경봉독', `${bible.book} ${ref}`, P.bibleIntro, (doc) => {
        const t = textShapes(doc);
        setRun(t[1], 0, 0, bible.book); setRun(t[1], 1, 0, bible.chapter || ''); setRun(t[1], 1, 2, bible.verses || '');
        const ab = (bible.abbr || '').trim() || bible.book;
        setRun(t[2], 0, 4, ab + '’'); setRun(t[2], 0, 5, hasBatchim(ab) ? '을' : '를');
      });
      const vs = parseVerses(bible.text);
      vs.forEach((v, i) => {
        const isLast = i === vs.length - 1;
        add('성경봉독', v.n ? `${v.n}절` : '본문', isLast ? P.bibleVerseAmen : P.bibleVerse, (doc) => {
          const t = textShapes(doc);
          setRun(t[0], 0, 1, bible.book); setRun(t[0], 0, 3, ref);
          const width = 8834691 - (v.n ? 742950 : 0) - 182880;
          const sz = fitSize([v.text], 4000, 2400, width, 3900000, 1.22);
          fillShape(t[1], [v.text], { sz, startAt: v.n || undefined, noNumber: !v.n });
        });
      });
      add('성경봉독', '빈 화면', P.blank);
    }
    if (d.choir) { add('찬양대', '찬양대', P.choir); add('찬양대', '빈 화면', P.blank); }
    add('말씀', d.sermonTitle || '오늘의 말씀', P.sermonTitle, (doc) => { fillShape(textShapes(doc)[1], [d.sermonTitle || '']); });
    if (d.sermonDeck) (d.sermonDeck.include || []).forEach((n) => add('말씀', `설교 PPT ${n}번`, null, null, null, n));
    (d.sermonImages || []).forEach((img, i) => add('말씀', img.name || `그림 ${i + 1}`, P.image, null, img));
    add('말씀', '빈 화면', P.blank);
    add('봉헌', '제목', P.offeringTitle);
    for (const sl of parseLyrics(d.offeringLyrics)) {
      if (sl.kind === 'interlude') add('봉헌', '간주', P.interlude.orange);
      else add('봉헌', sl.lines[0], sl.kind === 'last' ? P.lyricLast.orange : P.offeringLyric, (doc) => {
        const box = textShapes(doc).find((sp) => spText(sp).trim() !== '마지막');
        const sz = Math.min(fitOneLine(sl.lines, 5400, 3600, 8700000), fitSize(sl.lines, 5400, 3600, 1e12, 4300000, 1.2));
        fillShape(box, sl.lines, { sz, prefixFirst: sl.kind === 'last' ? '   ' : '' });
      });
    }
    add('봉헌', '빈 화면', P.blank);
    add('봉헌', d.offeringPrayer || '봉헌기도', P.offeringPrayer, (doc) => { fillShape(textShapes(doc)[1], [d.offeringPrayer || '']); });
    add('마침', '축도', P.benediction);
    add('마침', '빈 화면', P.blank);
    add('광고', '제목', P.noticeTitle);
    const quiz = (d.quiz || []).filter((q) => (q.q || '').trim());
    if (quiz.length) {
      add('광고', '말씀퀴즈 제목', P.quizTitle);
      quiz.forEach((q, i) => add('광고', `퀴즈 ${i + 1}`, P.quiz, (doc) => {
        const t = textShapes(doc);
        const ls = nonEmpty(q.q).map((l) => l.trim());
        fillShape(t[1], ls, { sz: fitSize(ls, 2800, 2000, 8500000, 2350000, 1.3) });
        fillShape(t[3], [q.a || '']);
      }));
    }
    if ((d.notice || '').trim()) {
      add('광고', '광고합니다', P.notice, (doc) => {
        const t = textShapes(doc);
        const ls = lines(d.notice);
        while (ls.length && !ls[ls.length - 1].trim()) ls.pop();
        fillShape(t[1], ls, { sz: fitSize(ls, 2400, 1600, 8500000, 3700000, 1.25) });
      });
    }
    (d.posters || []).forEach((img, i) => add(d.posterLabel || '암송 말씀', img.name || `그림 ${i + 1}`, P.image, null, img));
    add('마침', '인사', P.end);
    return S;
  }

  function editSongTitle(doc, title) {
    const rect = shapeByName(doc, '모서리가 둥근 직사각형 46');
    const box = textShapes(doc)[0];
    const parts = title.split(/\s*\/\s*/); // "삶으로 믿음으로 / 보여줘요" 처럼 / 로 줄 나눔
    const base = 8625, pad = 900000, maxW = 8300000;
    let sz = base;
    const tw = (p, z) => strW(p, z) * 0.88;
    const widest = Math.max(...parts.map((p) => tw(p, base)));
    if (widest + pad > maxW) sz = Math.max(4400, Math.floor(base * (maxW - pad) / widest / 100) * 100);
    fillShape(box, parts, { sz });
    const w = Math.min(maxW, Math.max(...parts.map((p) => tw(p, sz))) + pad * (sz / base) + 300000);
    const lineH = sz / 100 * 12700 * 1.2;
    const h = parts.length * lineH + 380000;
    const cy = SLIDE_H * 0.47;
    if (rect) setXfrm(rect, (SLIDE_W - w) / 2, cy - h / 2, w, h);
    setXfrm(box, 166977, cy - (parts.length * lineH + 120000) / 2, 8810046, parts.length * lineH + 120000);
  }

  /* ---------- 다른 PPT의 슬라이드 옮기기 ---------- */
  const dirOf = (p) => p.slice(0, p.lastIndexOf('/'));
  const relsOf = (p) => `${dirOf(p)}/_rels/${p.slice(p.lastIndexOf('/') + 1)}.rels`;
  function resolvePath(base, target) {
    if (target.startsWith('/')) return target.slice(1);
    const parts = dirOf(base).split('/');
    for (const seg of target.split('/')) { if (seg === '..') parts.pop(); else if (seg !== '.') parts.push(seg); }
    return parts.join('/');
  }
  function relTo(from, to) {
    const a = dirOf(from).split('/'), b = to.split('/');
    let i = 0; while (i < a.length && i < b.length - 1 && a[i] === b[i]) i++;
    return '../'.repeat(a.length - i) + b.slice(i).join('/');
  }
  async function openDeck(JSZip, buf) {
    const zip = await JSZip.loadAsync(buf);
    const pres = parseXml(await zip.file('ppt/presentation.xml').async('string'));
    const rels = parseXml(await zip.file('ppt/_rels/presentation.xml.rels').async('string'));
    const target = {};
    [...rels.documentElement.childNodes].filter((n) => n.nodeType === 1).forEach((r) => { target[r.getAttribute('Id')] = r.getAttribute('Target'); });
    const order = all(pres, NS_P, 'sldId').map((s) => resolvePath('ppt/presentation.xml', target[s.getAttributeNS(NS_R, 'id')]));
    const sz = all(pres, NS_P, 'sldSz')[0];
    return { zip, order, size: sz ? { cx: +sz.getAttribute('cx'), cy: +sz.getAttribute('cy') } : null };
  }
  // 설교 PPT 미리보기: 슬라이드마다 글 몇 자, 숨김 여부, 애니메이션 여부
  async function inspectDeck(JSZip, buf) {
    const dk = await openDeck(JSZip, buf);
    const slides = [];
    for (let i = 0; i < dk.order.length; i++) {
      const xml = await dk.zip.file(dk.order[i]).async('string');
      const doc = parseXml(xml);
      const text = all(doc, NS_A, 't').map((t) => t.textContent).join(' ').replace(/\s+/g, ' ').trim();
      slides.push({ n: i + 1, text: text.slice(0, 50), hidden: doc.documentElement.getAttribute('show') === '0', anim: /presetClass=/.test(xml), pics: all(doc, NS_P, 'pic').length });
    }
    return { count: slides.length, slides, size: dk.size, sameSize: !dk.size || (Math.abs(dk.size.cx / dk.size.cy - SLIDE_W / SLIDE_H) < 0.01) };
  }
  // 슬라이드 크기가 다른 PPT: 위치·크기·글자 크기를 비율대로 줄이고 가운데로
  const SHAPES = new Set(['sp', 'pic', 'grpSp', 'graphicFrame', 'cxnSp', 'contentPart']);
  const SCALE_ATTRS = ['marL', 'marR', 'indent', 'lIns', 'tIns', 'rIns', 'bIns', 'defTabSz'];
  function scaleXml(xml, f, dx, dy) {
    const doc = parseXml(xml);
    const R = (v) => String(Math.round(+v * f));
    for (const el of [...doc.getElementsByTagName('*')]) {
      const ln = el.localName, ns = el.namespaceURI;
      if (ns === NS_A && (ln === 'off' || ln === 'ext') && el.parentNode && el.parentNode.localName === 'xfrm') {
        let owner = el.parentNode;
        while (owner && !(owner.namespaceURI === NS_P && (SHAPES.has(owner.localName) || owner.localName === 'spTree'))) owner = owner.parentNode;
        if (!owner || owner.localName === 'spTree') continue;
        const top = owner.parentNode && owner.parentNode.localName === 'spTree';
        if (ln === 'off') { el.setAttribute('x', String(Math.round(+el.getAttribute('x') * f + (top ? dx : 0)))); el.setAttribute('y', String(Math.round(+el.getAttribute('y') * f + (top ? dy : 0)))); }
        else if (el.hasAttribute('cx')) { el.setAttribute('cx', R(el.getAttribute('cx'))); el.setAttribute('cy', R(el.getAttribute('cy'))); }
        continue;
      }
      if (ns !== NS_A) continue;
      if ((ln === 'rPr' || ln === 'defRPr' || ln === 'endParaRPr') && el.hasAttribute('sz')) el.setAttribute('sz', String(Math.max(100, Math.round(+el.getAttribute('sz') * f))));
      if (ln === 'spcPts' && el.hasAttribute('val')) el.setAttribute('val', R(el.getAttribute('val')));
      if (ln === 'ln' && el.hasAttribute('w')) el.setAttribute('w', R(el.getAttribute('w')));
      if (ln === 'gridCol' && el.hasAttribute('w')) el.setAttribute('w', R(el.getAttribute('w')));
      if (ln === 'tr' && el.hasAttribute('h')) el.setAttribute('h', R(el.getAttribute('h')));
      if (ln === 'tab' && el.hasAttribute('pos')) el.setAttribute('pos', R(el.getAttribute('pos')));
      for (const a of SCALE_ATTRS) if (el.hasAttribute(a)) el.setAttribute(a, R(el.getAttribute(a)));
      if (/Shdw$|^glow$|^softEdge$|^reflection$/.test(ln)) for (const a of ['blurRad', 'dist', 'rad', 'stA']) if (a !== 'stA' && el.hasAttribute(a)) el.setAttribute(a, R(el.getAttribute(a)));
    }
    return serialize(doc);
  }
  async function makeDeckCopier(JSZip, destZip, destCt, destPres, buf, items) {
    const dk = await openDeck(JSZip, buf);
    const src = dk.zip;
    const srcCt = parseXml(await src.file('[Content_Types].xml').async('string'));
    const ctRoot = destCt.documentElement;
    const srcOverride = {}, srcDefault = {};
    [...srcCt.documentElement.childNodes].filter((n) => n.nodeType === 1).forEach((n) => {
      if (n.localName === 'Override') srcOverride[n.getAttribute('PartName').slice(1)] = n.getAttribute('ContentType');
      else srcDefault[n.getAttribute('Extension').toLowerCase()] = n.getAttribute('ContentType');
    });
    const destDefaults = new Set([...ctRoot.childNodes].filter((n) => n.nodeType === 1 && n.localName === 'Default').map((n) => n.getAttribute('Extension').toLowerCase()));
    const relType = (r) => r.getAttribute('Type').split('/').pop();
    let f = 1, dx = 0, dy = 0;
    if (dk.size && (dk.size.cx !== SLIDE_W || dk.size.cy !== SLIDE_H)) {
      f = Math.min(SLIDE_W / dk.size.cx, SLIDE_H / dk.size.cy);
      dx = (SLIDE_W - dk.size.cx * f) / 2; dy = (SLIDE_H - dk.size.cy * f) / 2;
    }
    const scalable = /(slide|slideLayout|slideMaster)\+xml$/;
    const relsDoc = async (p) => { const f = src.file(relsOf(p)); return f ? parseXml(await f.async('string')) : null; };

    // 슬라이드 번호 → 원본 경로, 새 경로
    const slideMap = {};
    for (const it of items) slideMap[dk.order[it.deckSlide - 1]] = it.deckDest;
    const firstDest = items[0].deckDest;
    // 쓰이는 레이아웃만 옮긴다
    const usedLayouts = new Set();
    for (const it of items) {
      const p = dk.order[it.deckSlide - 1], rd = await relsDoc(p);
      if (rd) [...rd.documentElement.childNodes].filter((n) => n.nodeType === 1 && relType(n) === 'slideLayout').forEach((r) => usedLayouts.add(resolvePath(p, r.getAttribute('Target'))));
    }
    // 마스터·레이아웃 id 겹치지 않게
    let nextId = 2147483648;
    const bump = (s) => { for (const m of s.matchAll(/<p:(?:sldMasterId|sldLayoutId)\b[^>]*\bid="(\d+)"/g)) nextId = Math.max(nextId, +m[1] + 1); };
    bump(serialize(destPres));
    for (const f of Object.keys(destZip.files).filter((n) => /^ppt\/slideMasters\/[^/]+\.xml$/.test(n))) bump(await destZip.file(f).async('string'));

    const copied = {}, used = new Set(Object.keys(destZip.files)), masters = [];
    const uniqueName = (p) => {
      const d = dirOf(p), base = p.slice(p.lastIndexOf('/') + 1);
      let name = `${d}/ser_${base}`, k = 2;
      while (used.has(name)) name = `${d}/ser${k++}_${base}`;
      used.add(name); return name;
    };
    const addCT = (srcPath, dest) => {
      if (srcOverride[srcPath]) {
        const o = destCt.createElementNS(ctRoot.namespaceURI, 'Override');
        o.setAttribute('PartName', '/' + dest); o.setAttribute('ContentType', srcOverride[srcPath]);
        ctRoot.appendChild(o);
      } else {
        const ext = srcPath.split('.').pop().toLowerCase();
        if (!destDefaults.has(ext) && srcDefault[ext]) {
          const d = destCt.createElementNS(ctRoot.namespaceURI, 'Default');
          d.setAttribute('Extension', ext); d.setAttribute('ContentType', srcDefault[ext]);
          ctRoot.insertBefore(d, ctRoot.firstChild); destDefaults.add(ext);
        }
      }
    };
    async function copyPart(srcPath, destPath) {
      if (copied[srcPath]) return copied[srcPath];
      const fl = src.file(srcPath);
      if (!fl) return null;
      const dest = destPath || uniqueName(srcPath);
      used.add(dest);
      copied[srcPath] = dest;
      addCT(srcPath, dest);
      const isMaster = /slideMaster\+xml$/.test(srcOverride[srcPath] || '');
      const removed = new Set();
      const rd = await relsDoc(srcPath);
      if (rd) {
        for (const r of [...rd.documentElement.childNodes].filter((n) => n.nodeType === 1)) {
          if (r.getAttribute('TargetMode') === 'External') continue;
          const t = relType(r), tgt = resolvePath(srcPath, r.getAttribute('Target'));
          if (t === 'notesSlide' || t === 'comments' || t === 'commentAuthors') { rd.documentElement.removeChild(r); continue; }
          if (t === 'slide') { r.setAttribute('Target', relTo(dest, slideMap[tgt] || firstDest)); continue; }
          if (t === 'slideLayout' && isMaster && !usedLayouts.has(tgt)) { removed.add(r.getAttribute('Id')); rd.documentElement.removeChild(r); continue; }
          const nd = await copyPart(tgt);
          if (nd) r.setAttribute('Target', relTo(dest, nd)); else rd.documentElement.removeChild(r);
        }
        destZip.file(relsOf(dest), serialize(rd));
      }
      if (isMaster) {
        const doc = parseXml(f !== 1 ? scaleXml(await fl.async('string'), f, dx, dy) : await fl.async('string'));
        for (const el of all(doc, NS_P, 'sldLayoutId')) {
          if (removed.has(el.getAttributeNS(NS_R, 'id'))) el.parentNode.removeChild(el);
          else el.setAttribute('id', String(nextId++));
        }
        destZip.file(dest, serialize(doc));
        masters.push(dest);
      } else if (f !== 1 && scalable.test(srcOverride[srcPath] || '')) {
        destZip.file(dest, scaleXml(await fl.async('string'), f, dx, dy));
      } else {
        destZip.file(dest, await fl.async('uint8array'));
      }
      return dest;
    }
    return {
      size: dk.size,
      copySlide: (n, dest) => copyPart(dk.order[n - 1], dest),
      registerMasters(presRels) {
        const lst = all(destPres, NS_P, 'sldMasterIdLst')[0];
        masters.forEach((m, i) => {
          const rid = `rIdSerM${i + 1}`;
          const r = presRels.createElementNS(presRels.documentElement.namespaceURI, 'Relationship');
          r.setAttribute('Id', rid);
          r.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster');
          r.setAttribute('Target', m.replace(/^ppt\//, ''));
          presRels.documentElement.appendChild(r);
          const el = destPres.createElementNS(NS_P, 'p:sldMasterId');
          el.setAttribute('id', String(nextId++));
          el.setAttributeNS(NS_R, 'r:id', rid);
          lst.appendChild(el);
        });
      },
    };
  }

  /* ---------- PPT 만들기 ---------- */
  async function generate(JSZip, templateBuf, data) {
    const zip = await JSZip.loadAsync(templateBuf);
    const S = plan(data);
    const presPath = 'ppt/presentation.xml', presRelsPath = 'ppt/_rels/presentation.xml.rels', ctPath = '[Content_Types].xml';
    const pres = parseXml(await zip.file(presPath).async('string'));
    const presRels = parseXml(await zip.file(presRelsPath).async('string'));
    const ct = parseXml(await zip.file(ctPath).async('string'));

    // 견본 읽어두기
    const protos = {};
    for (const n of new Set(S.map((s) => s.proto).filter(Boolean))) {
      protos[n] = {
        xml: await zip.file(`ppt/slides/slide${n}.xml`).async('string'),
        rels: await zip.file(`ppt/slides/_rels/slide${n}.xml.rels`).async('string'),
      };
    }
    // 기존 슬라이드 모두 제거
    const relRoot = presRels.documentElement;
    [...relRoot.childNodes].filter((r) => r.nodeType === 1 && /\/slide$/.test(r.getAttribute('Type'))).forEach((r) => relRoot.removeChild(r));
    const lst = all(pres, NS_P, 'sldIdLst')[0];
    while (lst.firstChild) lst.removeChild(lst.firstChild);
    const ctRoot = ct.documentElement;
    [...ctRoot.childNodes].filter((o) => o.nodeType === 1 && /^\/ppt\/slides\//.test(o.getAttribute('PartName') || '')).forEach((o) => ctRoot.removeChild(o));
    zip.folder('ppt/slides').forEach((rel) => zip.remove('ppt/slides/' + rel));

    function addSlideRef(k) {
      const r = presRels.createElementNS(relRoot.namespaceURI, 'Relationship');
      r.setAttribute('Id', `rIdGen${k}`);
      r.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide');
      r.setAttribute('Target', `slides/slide${k}.xml`);
      relRoot.appendChild(r);
      const sid = pres.createElementNS(NS_P, 'p:sldId');
      sid.setAttribute('id', String(1000 + k));
      sid.setAttributeNS(NS_R, 'r:id', `rIdGen${k}`);
      lst.appendChild(sid);
    }
    const exts = new Set([...ctRoot.childNodes].filter((n) => n.nodeType === 1 && n.localName === 'Default').map((n) => n.getAttribute('Extension').toLowerCase()));
    const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };

    // 설교 PPT: 원본 서식(마스터·레이아웃·테마)과 애니메이션을 그대로 옮긴다
    let deckCopier = null;
    if (S.some((s) => s.deckSlide) && data.sermonDeck) {
      const slideMap = {};
      S.forEach((s, i) => { if (s.deckSlide) s.deckDest = `ppt/slides/slide${i + 1}.xml`; });
      deckCopier = await makeDeckCopier(JSZip, zip, ct, pres, data.sermonDeck.data, S.filter((s) => s.deckSlide));
    }
    for (let i = 0; i < S.length; i++) {
      const k = i + 1, s = S[i];
      if (s.deckSlide) {
        await deckCopier.copySlide(s.deckSlide, s.deckDest);
        addSlideRef(k);
        continue;
      }
      const doc = parseXml(protos[s.proto].xml);
      let rels = protos[s.proto].rels;
      if (s.edit) s.edit(doc);
      if (s.image) {
        let ext = (s.image.ext || 'png').toLowerCase();
        if (!MIME[ext]) ext = 'png';
        const media = `gen${k}.${ext}`;
        zip.file(`ppt/media/${media}`, s.image.data);
        if (!exts.has(ext)) {
          const def = ct.createElementNS(ctRoot.namespaceURI, 'Default');
          def.setAttribute('Extension', ext); def.setAttribute('ContentType', MIME[ext]);
          ctRoot.insertBefore(def, ctRoot.firstChild); exts.add(ext);
        }
        const pic = all(doc, NS_P, 'pic')[0];
        const rid = all(pic, NS_A, 'blip')[0].getAttributeNS(NS_R, 'embed');
        rels = rels.replace(new RegExp(`(Id="${rid}"[^>]*Target=")[^"]+"`), `$1../media/${media}"`)
                   .replace(new RegExp(`(Target=")[^"]+("[^>]*Id="${rid}")`), `$1../media/${media}$2`);
        all(pic, NS_A, 'srcRect').forEach((n) => n.parentNode.removeChild(n));
        const iw = s.image.w || 16, ih = s.image.h || 9;
        const scale = Math.min(SLIDE_W / iw, SLIDE_H / ih);
        const cx = iw * scale, cy = ih * scale;
        const xf = kids(kids(pic, NS_P, 'spPr')[0], NS_A, 'xfrm')[0];
        kids(xf, NS_A, 'off')[0].setAttribute('x', String(Math.round((SLIDE_W - cx) / 2)));
        kids(xf, NS_A, 'off')[0].setAttribute('y', String(Math.round((SLIDE_H - cy) / 2)));
        kids(xf, NS_A, 'ext')[0].setAttribute('cx', String(Math.round(cx)));
        kids(xf, NS_A, 'ext')[0].setAttribute('cy', String(Math.round(cy)));
      }
      zip.file(`ppt/slides/slide${k}.xml`, serialize(doc));
      zip.file(`ppt/slides/_rels/slide${k}.xml.rels`, rels);
      addSlideRef(k);
      const o = ct.createElementNS(ctRoot.namespaceURI, 'Override');
      o.setAttribute('PartName', `/ppt/slides/slide${k}.xml`);
      o.setAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml');
      ctRoot.appendChild(o);
    }
    if (deckCopier) deckCopier.registerMasters(presRels);
    zip.file(presPath, serialize(pres));
    zip.file(presRelsPath, serialize(presRels));
    zip.file(ctPath, serialize(ct));
    const app = zip.file('docProps/app.xml');
    if (app) {
      let a = await app.async('string');
      a = a.replace(/<Slides>\d+<\/Slides>/, `<Slides>${S.length}</Slides>`).replace(/<Notes>\d+<\/Notes>/, '<Notes>0</Notes>');
      zip.file('docProps/app.xml', a);
    }
    return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  }

  /* ---------- 지난 PPT에서 찬양 가사 가져오기 ---------- */
  async function importSongs(JSZip, buf) {
    const zip = await JSZip.loadAsync(buf);
    const pres = parseXml(await zip.file('ppt/presentation.xml').async('string'));
    const rels = parseXml(await zip.file('ppt/_rels/presentation.xml.rels').async('string'));
    const target = {};
    [...rels.documentElement.childNodes].filter((n) => n.nodeType === 1).forEach((r) => { target[r.getAttribute('Id')] = r.getAttribute('Target'); });
    const order = all(pres, NS_P, 'sldId').map((s) => 'ppt/' + target[s.getAttributeNS(NS_R, 'id')].replace(/^\/?ppt\//, ''));
    const songs = [];
    let cur = null, mode = null;
    const finish = () => { if (cur && cur.blocks.length) songs.push({ title: cur.title || cur.blocks.find((b) => b !== '간주')?.split('\n')[0].replace('[마지막] ', ''), color: cur.color || 'orange', lyrics: cur.blocks.join('\n\n'), offering: !cur.title }); cur = null; };
    for (const path of order) {
      const f = zip.file(path); if (!f) continue;
      const doc = parseXml(await f.async('string'));
      const shapes = textShapes(doc);
      const texts = shapes.map((sp) => spText(sp).trim());
      const isLastTag = texts.includes('마지막');
      const content = shapes.filter((sp) => spText(sp).trim() !== '마지막');
      const isTitle = !!shapeByName(doc, '모서리가 둥근 직사각형 46') && content.length === 1 && !isLastTag;
      if (!content.length) { finish(); mode = null; continue; }
      if (texts.some((t) => /^봉\s*헌$/.test(t))) { finish(); cur = { title: '', blocks: [], color: 'orange' }; mode = 'song'; continue; }
      if (isTitle) {
        finish();
        const paras = kids(all(content[0], NS_P, 'txBody')[0], NS_A, 'p').map((p) => all(p, NS_A, 't').map((t) => t.textContent).join('').trim()).filter(Boolean);
        cur = { title: paras.join(' / '), blocks: [], color: null }; mode = 'song'; continue;
      }
      if (mode === 'song' && content.length === 1 && cur) {
        const sp = content[0];
        const paras = kids(all(sp, NS_P, 'txBody')[0], NS_A, 'p').map((p) => all(p, NS_A, 't').map((t) => t.textContent).join('').trim()).filter(Boolean);
        if (!paras.length) continue;
        if (!cur.color) { const c = all(sp, NS_A, 'srgbClr')[0]; const v = c ? c.getAttribute('val') : 'FF9E28'; cur.color = parseInt(v.slice(4, 6), 16) > parseInt(v.slice(0, 2), 16) ? 'blue' : 'orange'; }
        if (paras.length === 1 && /간\s*주/.test(paras[0])) cur.blocks.push('간주');
        else cur.blocks.push((isLastTag ? '[마지막] ' : '') + paras.join('\n'));
        continue;
      }
      finish(); mode = null;
    }
    finish();
    return songs;
  }

  global.KidsPPT = { generate, importSongs, inspectDeck, plan, parseLyrics, parseVerses };
})(typeof window !== 'undefined' ? window : globalThis);
