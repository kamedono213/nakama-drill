// なかまドリル: 小学校の国語・算数・理科・社会のドリル。単元をクリアすると、たまごから「なかま」が生まれ、
// くり返しクリアすると進化する。全問正解でキラになる。問題は data/units.js(tools/build-data.js が作る)、算数はその場で作る。
'use strict';
// 「もどる」「やめる」を押したら、本当にもどるか確かめる(スマホの「戻る」操作も)。
// 画面のボタンは id="back" / id="quit"。もともと確認があるボタンは data-noconfirm をつけて除く
(() => {
  let bypass = false, ignorePop = false;
  const pass = fn => { bypass = true; fn(); setTimeout(() => { bypass = false; }, 500); };
  const ask = onYes => {
    if (document.getElementById('leave-confirm')) return;
    const d = document.createElement('div');
    d.id = 'leave-confirm'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:16px';
    d.innerHTML = '<div style="background:#fff;color:#222;border-radius:16px;padding:20px 18px;max-width:320px;width:100%;display:grid;gap:14px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.25)">'
      + '<b style="font-size:18px">本当にもどりますか？</b><span style="font-size:14px;color:#555">いまの続きは消えることがあります。</span>'
      + '<div style="display:flex;gap:10px"><button type="button" data-a="no" style="flex:1;padding:12px;border-radius:12px;border:1px solid #ccc;background:#fff;color:#222;font:inherit;font-weight:700">つづける</button>'
      + '<button type="button" data-a="yes" style="flex:1;padding:12px;border-radius:12px;border:0;background:#2f6fd0;color:#fff;font:inherit;font-weight:700">もどる</button></div></div>';
    d.addEventListener('click', e => {
      const a = e.target.closest('[data-a]');
      if (!a && e.target !== d) return;
      d.remove();
      if (a && a.dataset.a === 'yes') onYes();
    });
    document.body.appendChild(d);
    d.querySelector('[data-a="no"]').focus();
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('#back, #quit');
    if (!b || bypass || b.hasAttribute('data-noconfirm')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    ask(() => pass(() => b.click()));
  }, true);
  // ROUTED: このアプリが画面ごとに履歴を積むか。積まないアプリは、戻る操作を受け止める「しおり」を1つ積んでおく
  const ROUTED = true; // 画面ごとに history.pushState するアプリは true
  const guard = () => history.pushState({ leaveGuard: 1 }, '');
  if (!ROUTED) guard();
  window.addEventListener('popstate', e => {
    if (ignorePop) { ignorePop = false; e.stopImmediatePropagation(); return; }
    if (bypass) return;
    e.stopImmediatePropagation();
    if (!ROUTED) {
      const b = document.querySelector('#back, #quit');
      if (!b) { history.back(); return; }                 // メニュー画面ではそのままアプリを閉じる
      guard();
      if (b.hasAttribute('data-noconfirm')) { b.click(); return; }
      ask(() => pass(() => b.click()));
      return;
    }
    ignorePop = true; history.go(1); // いったん元の画面にとどまる
    ask(() => pass(() => history.back()));
  }, true);
})();
// ---------- ふりがな(ちりパズルと同じく、漢字の上に小さく読みを出す)
// 辞書 window.FURI は furi.js(onze.ltd/tools/furigana/make-furi.js が自動生成)。
// 画面に出た文字を自動で包むので、各画面のコードは変えなくてよい。答え合わせに使う textContent は変わらない(読みは CSS で表示)。
// 切りかえボタンは、data-furi-slot を付けた場所に自動で入る。設定はアプリごとに保存
(() => {
  const D = window.FURI || {};
  // 先頭の1文字ごとに、長い順に並べておく(文まるごと → 単語の順に当てはめる)
  const byHead = {};
  Object.keys(D).sort((a, b) => b.length - a.length).forEach(k => (byHead[k[0]] = byHead[k[0]] || []).push(k));
  const KEY = 'furi:' + location.pathname;
  let on = true;
  try { on = localStorage.getItem(KEY) !== '0'; } catch (e) { /* 保存できなくても動く */ }
  const css = document.createElement('style');
  // アプリ側の「span に〜」という指定が効かないように、ルビの span は !important で固める
  css.textContent = '.rbw,.rb{margin:0!important;border:0!important;background:none!important;min-width:0!important;font:inherit!important;color:inherit!important;letter-spacing:inherit!important;text-indent:0!important}'
    + '.rbw{display:inline!important;padding:0!important}'
    + '.rb{display:inline-block!important;position:relative!important;padding:0!important}'
    // ふりがなありの時は行の高さを広げ、読みは行間(漢字の上のすき間)に置く。行ごとに高さがばらつかない
    + 'html.furi body{line-height:2.2}'
    + 'html.furi .rb{line-height:max(2.2em, 1em + 17px)!important}'
    + 'html.furi .rb::before{content:attr(data-rt);position:absolute;bottom:calc(50% + 1.02em);left:50%;transform:translateX(-50%);font-size:max(.5em,7.5px);font-weight:700;line-height:1.1;white-space:nowrap;letter-spacing:0;pointer-events:none}'
    + '.furi-tools{display:inline-flex;flex-wrap:wrap;gap:6px;justify-self:start;align-self:center;width:auto;flex:none;line-height:1.4}'
    + '.furi-toggle{width:auto;flex:none;line-height:1.4;border:1.5px solid rgba(127,127,127,.4);background:transparent;color:inherit;border-radius:999px;padding:4px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}'
    + '.furi-toggle[aria-pressed="true"]{border-color:currentColor}';
  document.head.appendChild(css);
  const apply = () => document.documentElement.classList.toggle('furi', on);
  apply();
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'TITLE']);
  const ok = el => {
    for (let e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (e.namespaceURI === 'http://www.w3.org/2000/svg') return false;
      if (e.classList.contains('rb') || e.classList.contains('rbw') || e.hasAttribute('data-nofuri')) return false;
      if (e.lang && !/^ja/i.test(e.lang)) return false; // 外国語の文字(中国語の漢字など)には付けない
      if (SKIP.has(e.tagName)) return false;
    }
    return true;
  };
  function wrapText(node) {
    const t = node.nodeValue;
    if (!/[一-鿿々]/.test(t)) return;
    const frag = document.createDocumentFragment();
    let last = 0, hit = false;
    for (let i = 0; i < t.length;) {
      const k = (byHead[t[i]] || []).find(x => t.startsWith(x, i));
      if (!k) { i++; continue; }
      hit = true;
      if (i > last) frag.appendChild(document.createTextNode(t.slice(last, i)));
      for (const seg of D[k]) {
        if (typeof seg === 'string') { frag.appendChild(document.createTextNode(seg)); continue; }
        const s = document.createElement('span'); s.className = 'rb'; s.dataset.rt = seg[1]; s.textContent = seg[0];
        frag.appendChild(s);
      }
      i = last = i + k.length;
    }
    if (!hit) return;
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    // 1つの span にまとめて入れる(flex や grid の中で、ルビごとに改行されないように)
    const w = document.createElement('span'); w.className = 'rbw'; w.appendChild(frag);
    node.replaceWith(w);
  }
  // 切りかえボタンを入れる箱(効果音ボタンもここに入る)
  function tools(slot) {
    let box = slot.querySelector(':scope > .furi-tools');
    if (!box) { box = document.createElement('span'); box.className = 'furi-tools'; box.setAttribute('data-nofuri', ''); slot.appendChild(box); }
    return box;
  }
  function toggleHtml() { return `<button type="button" class="furi-toggle" data-furi-toggle aria-pressed="${on}">ふりがな ${on ? 'あり' : 'なし'}</button>`; }
  function scan(root) {
    if (root.nodeType === 3) { if (ok(root.parentNode)) wrapText(root); return; }
    if (root.nodeType !== 1 || !ok(root)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
    let n; while ((n = w.nextNode())) if (ok(n.parentNode)) list.push(n);
    list.forEach(wrapText);
    const slots = root.querySelectorAll ? [...root.querySelectorAll('[data-furi-slot]')] : [];
    if (root.hasAttribute && root.hasAttribute('data-furi-slot')) slots.push(root);
    slots.forEach(s => { if (!s.querySelector('[data-furi-toggle]')) tools(s).insertAdjacentHTML('afterbegin', toggleHtml()); });
  }
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) scan(n); })
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-furi-toggle]'); if (!b) return;
    on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (err) { /* 保存できなくても切りかわる */ }
    apply();
    document.querySelectorAll('[data-furi-toggle]').forEach(x => { x.setAttribute('aria-pressed', on); x.textContent = 'ふりがな ' + (on ? 'あり' : 'なし'); });
  });
  window.furiTools = tools;
  if (document.body) scan(document.body);
})();
// ---------- 効果音(Web Audio で合成。音声ファイルは使わない)
// SE.play('ok') のように呼ぶ。音の名前: start / select / ok / ng / star / result / perfect / land / clear / over
// SE.chain(n) は連鎖の n 段目(段ごとに高くなる)。
// 「音あり/なし」ボタンは data-furi-slot の場所に自動で入る(ふりがなボタンのとなり)。設定はアプリごとに保存
const SE = (() => {
  const KEY = 'se-muted:' + location.pathname;
  let muted = false, ctx = null;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) { /* 保存できなくても動く */ }
  function ac() {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // 1音: 周波数・開始(秒)・長さ・波形・音量・(最後の周波数)
  function tone(freq, at, dur, type = 'sine', vol = 0.18, slideTo = null) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const SOUNDS = {
    start: () => { tone(523, 0, 0.09, 'triangle'); tone(784, 0.08, 0.14, 'triangle'); },
    select: () => tone(660, 0, 0.06, 'triangle', 0.12),
    ok: () => { tone(880, 0, 0.12, 'sine', 0.2); tone(1319, 0.1, 0.28, 'sine', 0.2); },
    ng: () => tone(220, 0, 0.32, 'square', 0.07, 150),
    star: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.07, 0.22, 'sine', 0.14)),
    result: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.11, 0.18, 'triangle')),
    perfect: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.16, 'triangle')); [1047, 1319, 1568].forEach(f => tone(f, 0.42, 0.6, 'sine', 0.1)); },
    land: () => tone(180, 0, 0.08, 'triangle', 0.16, 110),
    clear: () => { [659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.14, 'triangle')); tone(1319, 0.3, 0.45, 'sine', 0.12); },
    over: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.26, 'triangle', 0.14)),
  };
  function play(name) { if (muted || !SOUNDS[name]) return; try { SOUNDS[name](); } catch (e) { /* 音が出せない環境でも遊べる */ } }
  function chain(n) {
    if (muted) return;
    try { const f = 440 * Math.pow(2, Math.min(n - 1, 9) * 2 / 12); tone(f, 0, 0.1, 'triangle', 0.16); tone(f * 1.5, 0.07, 0.18, 'sine', 0.12); } catch (e) { /* 同上 */ }
  }
  const btn = () => `<button type="button" class="furi-toggle" data-se-toggle aria-pressed="${!muted}">${muted ? '🔇 音なし' : '🔊 音あり'}</button>`;
  function addButtons(root) {
    if (!root.querySelectorAll) return;
    const slots = [...root.querySelectorAll('[data-furi-slot]')];
    if (root.hasAttribute && root.hasAttribute('data-furi-slot')) slots.push(root);
    slots.forEach(s => { if (!s.querySelector('[data-se-toggle]')) (window.furiTools ? window.furiTools(s) : s).insertAdjacentHTML('beforeend', btn()); });
  }
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) addButtons(n); })
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-se-toggle]'); if (!b) return;
    muted = !muted; try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (err) { /* 保存できなくても切りかわる */ }
    document.querySelectorAll('[data-se-toggle]').forEach(x => { x.setAttribute('aria-pressed', !muted); x.textContent = muted ? '🔇 音なし' : '🔊 音あり'; });
    play('select');
  });
  if (document.body) addButtons(document.body);
  return { play, chain, get muted() { return muted; } };
})();

// ---------- 道具
const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
// 整数 v を 10^p でわった小数を、むだな0なしで書く
const dec = (v, p) => (v / 10 ** p).toFixed(p).replace(/\.?0+$/, '');

const SUBJ = {
  国語: { key: 'kokugo', color: '#e4572e', icon: '📖', kind: 'とり' },
  算数: { key: 'sansu', color: '#2f6fd0', icon: '🔢', kind: 'ドラゴン' },
  理科: { key: 'rika', color: '#2a9d5c', icon: '🔬', kind: 'むし' },
  社会: { key: 'shakai', color: '#d98a0b', icon: '🗾', kind: 'きょうりゅう' },
};
const UNITS = window.ND.units;
const byId = Object.fromEntries(UNITS.map(u => [u.id, u]));
const PASS = 8; // 10問中8問でクリア
const EVOLVE = [1, 3, 6]; // この回数クリアで1・2・3だんかい目

// ---------- 記録(この端末だけに保存)
const SAVE = 'nakama-drill-v1';
let S = { u: {}, partner: null, grade: {} };
try { S = Object.assign(S, JSON.parse(localStorage.getItem(SAVE) || '{}')); } catch (e) { /* 読めなければ最初から */ }
const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { /* 保存できなくても遊べる */ } };
const rec = id => S.u[id] || { clears: 0, best: 0, kira: false };
const formOf = id => { const c = rec(id).clears; return c >= EVOLVE[2] ? 3 : c >= EVOLVE[1] ? 2 : c >= 1 ? 1 : 0; };
const owned = () => UNITS.filter(u => formOf(u.id) > 0);

// ---------- なかまの絵(単元IDから毎回同じ形・色を作る SVG)
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function look(u) {
  const r = rng(hash(u.id));
  const hue = Math.floor(r() * 360), hue2 = (hue + 150 + Math.floor(r() * 60)) % 360;
  return {
    body: `hsl(${hue} 72% 64%)`, dark: `hsl(${hue} 50% 34%)`, shade: `hsl(${hue} 60% 54%)`,
    belly: `hsl(${hue} 90% 90%)`, acc: `hsl(${hue2} 80% 58%)`, acc2: `hsl(${hue2} 85% 75%)`,
    eye: Math.floor(r() * 3), pat: Math.floor(r() * 3), fang: r() < 0.5, hue,
  };
}
function nakamaSVG(u, form, kira, cls = '') {
  const L = look(u), fam = SUBJ[u.subj].key, f = Math.max(1, form);
  const sc = [0.8, 0.9, 1][f - 1];
  const back = [], front = [], head = [];
  const st = `stroke="${L.dark}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
  if (fam === 'sansu') { // ドラゴン: つの・つばさ・しっぽ
    const w = [10, 22, 34][f - 1];
    back.push(`<path d="M34 58 Q${22 - w * 0.6} ${44 - w} ${16 - w * 0.5} ${60 - w * 0.2} Q26 60 30 72 Z" fill="${L.acc2}" ${st}/>`,
      `<path d="M86 58 Q${98 + w * 0.6} ${44 - w} ${104 + w * 0.5} ${60 - w * 0.2} Q94 60 90 72 Z" fill="${L.acc2}" ${st}/>`);
    back.push(`<path d="M84 86 Q104 92 106 74 Q109 66 114 64" fill="none" stroke="${L.dark}" stroke-width="11" stroke-linecap="round"/><path d="M84 86 Q104 92 106 74 Q109 66 114 64" fill="none" stroke="${L.body}" stroke-width="6.5" stroke-linecap="round"/><path d="M110 58 L122 60 L114 70 Z" fill="${L.acc}" ${st}/>`);
    const h = [8, 13, 18][f - 1];
    head.push(`<path d="M44 46 Q38 ${40 - h} ${32 - h * 0.3} ${36 - h} Q46 ${38 - h * 0.4} 52 44 Z" fill="${L.acc}" ${st}/>`,
      `<path d="M76 46 Q82 ${40 - h} ${88 + h * 0.3} ${36 - h} Q74 ${38 - h * 0.4} 68 44 Z" fill="${L.acc}" ${st}/>`);
    if (f === 3) head.push(`<path d="M56 41 L60 28 L64 41 Z" fill="${L.acc}" ${st}/>`);
  } else if (fam === 'kokugo') { // とり: とさか・つばさ・おばね
    const n = f + 1;
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) / 2) * 22, len = [12, 16, 22][f - 1];
      head.push(`<g transform="rotate(${a} 60 44)"><path d="M60 44 Q${54} ${44 - len} 60 ${40 - len - 4} Q66 ${44 - len} 60 44 Z" fill="${i % 2 ? L.acc2 : L.acc}" ${st}/></g>`);
    }
    const t = [14, 22, 34][f - 1];
    for (let i = -1; i <= 1; i++) back.push(`<g transform="rotate(${i * 22 - 30} 76 90)"><path d="M76 90 Q${70} ${90 + t * 0.4} 76 ${90 + t} Q${82} ${90 + t * 0.4} 76 90 Z" fill="${i ? L.acc2 : L.acc}" ${st}/></g>`);
    const ww = [12, 15, 19][f - 1];
    front.push(`<ellipse cx="${30}" cy="76" rx="${ww * 0.55}" ry="${ww}" transform="rotate(25 30 76)" fill="${L.shade}" ${st}/>`,
      `<ellipse cx="${90}" cy="76" rx="${ww * 0.55}" ry="${ww}" transform="rotate(-25 90 76)" fill="${L.shade}" ${st}/>`);
  } else if (fam === 'rika') { // むし: しょっかく・すきとおったはね
    const wings = f === 1 ? [[0, 18]] : f === 2 ? [[-8, 22], [14, 15]] : [[-14, 26], [8, 20], [26, 14]];
    wings.forEach(([dy, s]) => {
      back.push(`<ellipse cx="${36 - s * 0.5}" cy="${62 + dy}" rx="${s}" ry="${s * 0.62}" transform="rotate(-25 ${36 - s * 0.5} ${62 + dy})" fill="${L.acc2}" fill-opacity=".55" ${st}/>`,
        `<ellipse cx="${84 + s * 0.5}" cy="${62 + dy}" rx="${s}" ry="${s * 0.62}" transform="rotate(25 ${84 + s * 0.5} ${62 + dy})" fill="${L.acc2}" fill-opacity=".55" ${st}/>`);
    });
    const al = [14, 20, 26][f - 1];
    head.push(`<path d="M50 46 Q44 ${40 - al * 0.5} ${40 - al * 0.3} ${38 - al}" fill="none" ${st}/><circle cx="${40 - al * 0.3}" cy="${38 - al}" r="${f === 3 ? 6 : 4.5}" fill="${L.acc}" ${st}/>`,
      `<path d="M70 46 Q76 ${40 - al * 0.5} ${80 + al * 0.3} ${38 - al}" fill="none" ${st}/><circle cx="${80 + al * 0.3}" cy="${38 - al}" r="${f === 3 ? 6 : 4.5}" fill="${L.acc}" ${st}/>`);
    if (f === 3) back.unshift(`<circle cx="60" cy="70" r="52" fill="${L.acc2}" opacity=".28"/>`);
  } else { // きょうりゅう: せなかの板・しっぽ・かんむり
    back.push(`<path d="M80 88 Q100 96 112 86 Q100 84 88 76 Z" fill="${L.body}" ${st}/>`);
    const n = [3, 4, 5][f - 1], hgt = [9, 12, 15][f - 1];
    for (let i = 0; i < n; i++) {
      const a = -70 + (i * 140) / (n - 1), rad = a * Math.PI / 180, x = 60 + Math.sin(rad) * 34, y = 72 - Math.cos(rad) * 32;
      back.push(`<g transform="rotate(${a} ${x} ${y})"><path d="M${x - 7} ${y + 4} L${x} ${y - hgt} L${x + 7} ${y + 4} Z" fill="${L.acc}" ${st}/></g>`);
    }
    head.push(`<path d="M56 50 L60 ${44 - f * 2} L64 50 Z" fill="${L.belly}" ${st}/>`);
    if (f === 3) head.push(`<path d="M44 36 L48 24 L54 32 L60 20 L66 32 L72 24 L76 36 Z" fill="#ffd34d" stroke="#b07d00" stroke-width="2" stroke-linejoin="round"/>`);
  }
  // からだの もよう
  const pat = L.pat === 1 ? `<circle cx="42" cy="58" r="4" fill="${L.shade}"/><circle cx="80" cy="56" r="3" fill="${L.shade}"/><circle cx="84" cy="70" r="4.5" fill="${L.shade}"/><circle cx="37" cy="74" r="3" fill="${L.shade}"/>`
    : L.pat === 2 ? `<path d="M34 62 q4 -3 8 0 M78 62 q4 -3 8 0 M33 72 q4 -3 8 0 M79 72 q4 -3 8 0" fill="none" stroke="${L.shade}" stroke-width="3" stroke-linecap="round"/>` : '';
  const eyeY = 64, ex = [48, 72];
  const eyes = ex.map(x => L.eye === 2
    ? `<path d="M${x - 6} ${eyeY + 1} Q${x} ${eyeY - 7} ${x + 6} ${eyeY + 1}" fill="none" stroke="#2a2233" stroke-width="3" stroke-linecap="round"/>`
    : `<ellipse cx="${x}" cy="${eyeY}" rx="${L.eye ? 5.2 : 6.2}" ry="${L.eye ? 7.4 : 6.6}" fill="#2a2233"/><circle cx="${x + 2}" cy="${eyeY - 2.6}" r="2.2" fill="#fff"/><circle cx="${x - 2}" cy="${eyeY + 2.6}" r="1.1" fill="#fff"/>`).join('');
  const beak = fam === 'kokugo' ? `<path d="M55 71 L65 71 L60 78 Z" fill="#ffb22e" stroke="#a8620a" stroke-width="1.8" stroke-linejoin="round"/>`
    : `<path d="M54 73 Q60 78 66 73" fill="none" stroke="#2a2233" stroke-width="2.4" stroke-linecap="round"/>${L.fang && fam === 'sansu' ? '<path d="M62 75 L64 79 L65.6 74.4 Z" fill="#fff" stroke="#2a2233" stroke-width="1"/>' : ''}`;
  const id = 'g' + hash(u.id + f + kira).toString(36);
  const kiraDefs = kira ? `<linearGradient id="${id}k" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".5" stop-color="#ffc83d"/><stop offset="1" stop-color="#ff9ee0"/></linearGradient>` : '';
  const spark = (x, y, s, d) => `<path class="tw" style="animation-delay:${d}s" d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z" fill="#ffd84a" stroke="#fff" stroke-width=".8"/>`;
  return `<svg class="nakama ${cls}" viewBox="0 0 120 120" role="img" aria-label="${esc(u.names[f - 1])}">
<defs><radialGradient id="${id}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></radialGradient>${kiraDefs}</defs>
${kira ? `<circle cx="60" cy="68" r="56" fill="url(#${id}k)" opacity=".45"/>` : ''}
<ellipse cx="60" cy="110" rx="${30 * sc}" ry="5" fill="#000" opacity=".12"/>
<g transform="translate(60 72) scale(${sc}) translate(-60 -72)">
${back.join('')}
<ellipse cx="46" cy="100" rx="9" ry="6" fill="${L.shade}" ${st}/><ellipse cx="74" cy="100" rx="9" ry="6" fill="${L.shade}" ${st}/>
<ellipse cx="60" cy="72" rx="34" ry="32" fill="${L.body}" stroke="${kira ? `url(#${id}k)` : L.dark}" stroke-width="${kira ? 4.5 : 2.6}"/>
<ellipse cx="60" cy="84" rx="20" ry="16" fill="${L.belly}"/>
${fam === 'sansu' ? `<path d="M46 80 H74 M44 87 H76 M48 94 H72" stroke="${L.shade}" stroke-width="2" opacity=".55"/>` : ''}
${pat}
<ellipse cx="60" cy="72" rx="34" ry="32" fill="url(#${id})"/>
${head.join('')}
${eyes}
<ellipse cx="40" cy="74" rx="5" ry="3" fill="#ff7aa2" opacity=".55"/><ellipse cx="80" cy="74" rx="5" ry="3" fill="#ff7aa2" opacity=".55"/>
${beak}
${front.join('')}
</g>
${kira ? spark(18, 26, 7, 0) + spark(102, 34, 5, 0.5) + spark(98, 98, 6, 1) + spark(16, 88, 4.5, 1.4) : ''}
</svg>`;
}
function eggSVG(u, cls = '') {
  const L = look(u);
  return `<svg class="egg ${cls}" viewBox="0 0 120 120" role="img" aria-label="たまご">
<ellipse cx="60" cy="110" rx="26" ry="5" fill="#000" opacity=".12"/>
<path d="M60 12 C84 12 96 50 96 72 C96 94 80 108 60 108 C40 108 24 94 24 72 C24 50 36 12 60 12 Z" fill="#fffaf0" stroke="${L.dark}" stroke-width="2.6"/>
<circle cx="46" cy="48" r="7" fill="${L.body}"/><circle cx="74" cy="64" r="9" fill="${L.acc}"/><circle cx="50" cy="84" r="6" fill="${L.acc2}"/><circle cx="76" cy="92" r="4" fill="${L.body}"/><circle cx="64" cy="32" r="4" fill="${L.acc2}"/>
<path class="crack" d="M30 66 L42 60 L50 70 L60 60 L70 70 L80 60 L90 66" fill="none" stroke="${L.dark}" stroke-width="2.6" stroke-linejoin="round"/>
<ellipse cx="46" cy="36" rx="7" ry="11" fill="#fff" opacity=".7" transform="rotate(25 46 36)"/>
</svg>`;
}

// ---------- 問題を作る
// どの問題も { q: 問題(HTML), kind: 'choice'|'num'|'rem', a: 答え, ch?: 選択肢(HTML), big?: 大きく出す文字, e?: 解説, unit?: 答えの単位, fig?: 図(SVG) }
const fr = (n, d) => {
  const g = gcd(n, d); n /= g; d /= g;
  if (d === 1) return String(n);
  const w = Math.floor(n / d), r = n % d;
  return `${w ? w : ''}<span class="fr"><i>${r}</i><i>${d}</i></span>`;
};
const frVal = (n, d) => { const g = gcd(n, d); return (n / g) + '/' + (d / g); };
// 分数の4択: 正解とちがう値を3つそろえる
function fracChoice(q, an, ad, wrongs, e) {
  const seen = new Set([frVal(an, ad)]), ch = [fr(an, ad)];
  for (const [n, d] of shuffle(wrongs)) {
    if (ch.length === 4) break;
    if (n <= 0 || d <= 0 || seen.has(frVal(n, d))) continue;
    seen.add(frVal(n, d)); ch.push(fr(n, d));
  }
  let k = 1;
  while (ch.length < 4) { const n = an * 2 + k, d = ad * 2; if (!seen.has(frVal(n, d))) { seen.add(frVal(n, d)); ch.push(fr(n, d)); } k++; }
  return { q, kind: 'choice', a: ch[0], ch: shuffle(ch), e };
}
const op = (a, o, b) => `${a} ${o} ${b} ＝ ？`;
const GEN = {
  tashi: () => { const a = ri(1, 9), b = ri(1, 9); return { q: op(a, '＋', b), kind: 'num', a: a + b }; },
  hiki: () => { const x = ri(1, 9), b = ri(1, 9); return { q: op(x + b, '−', b), kind: 'num', a: x }; },
  tashi2: () => { const a = ri(10, 99), b = ri(10, 99); return { q: op(a, '＋', b), kind: 'num', a: a + b }; },
  hiki2: () => { const a = ri(20, 199), b = ri(10, Math.min(99, a - 1)); return { q: op(a, '−', b), kind: 'num', a: a - b }; },
  kuku1: () => { const a = ri(2, 5), b = ri(1, 9); return { q: op(a, '×', b), kind: 'num', a: a * b }; },
  kuku2: () => { const a = ri(6, 9), b = ri(1, 9); return { q: op(a, '×', b), kind: 'num', a: a * b }; },
  wari: () => { const b = ri(2, 9), c = ri(1, 9); return { q: op(b * c, '÷', b), kind: 'num', a: c, e: `${b} × ${c} ＝ ${b * c} だから` }; },
  amari: () => { const b = ri(2, 9), c = ri(1, 9), r = ri(1, b - 1); return { q: `${b * c + r} ÷ ${b} ＝ ？ あまり ？`, kind: 'rem', a: [c, r], e: `${b} × ${c} ＝ ${b * c}、${b * c + r} − ${b * c} ＝ ${r}` }; },
  kakehissan: () => Math.random() < 0.6 ? (() => { const a = ri(12, 999), b = ri(2, 9); return { q: op(a, '×', b), kind: 'num', a: a * b }; })()
    : (() => { const a = ri(11, 99), b = ri(11, 99); return { q: op(a, '×', b), kind: 'num', a: a * b }; })(),
  wari2: () => { const b = ri(11, 49), c = ri(2, Math.min(29, Math.floor(999 / b))); return { q: op(b * c, '÷', b), kind: 'num', a: c, e: `${b} × ${c} ＝ ${b * c}` }; },
  shosu4: () => {
    const p = pick([1, 1, 2]), a = ri(p === 1 ? 2 : 20, p === 1 ? 99 : 999), b = ri(p === 1 ? 1 : 10, p === 1 ? 99 : 999);
    if (Math.random() < 0.5) return { q: op(dec(a, p), '＋', dec(b, p)), kind: 'num', a: (a + b) / 10 ** p };
    const [x, y] = a >= b ? [a, b] : [b, a];
    return { q: op(dec(x, p), '−', dec(y, p)), kind: 'num', a: (x - y) / 10 ** p };
  },
  gaisu: () => {
    const n = ri(1000, 99999), t = pick([['百', 100], ['千', 1000], ['一万', 10000]].filter(([, v]) => v < n));
    return { q: `${n.toLocaleString('ja-JP')} を四捨五入して、${t[0]}の位までのがい数にすると？`, kind: 'num', a: Math.round(n / t[1]) * t[1], e: `${t[0]}の位の1つ下の位を四捨五入する` };
  },
  junjo: () => {
    const t = ri(0, 5);
    if (t === 0) { const a = ri(2, 20), b = ri(2, 9), c = ri(2, 9); return { q: `${a} ＋ ${b} × ${c} ＝ ？`, kind: 'num', a: a + b * c, e: 'かけ算を先に計算する' }; }
    if (t === 1) { const a = ri(2, 12), b = ri(2, 12), c = ri(2, 9); return { q: `( ${a} ＋ ${b} ) × ${c} ＝ ？`, kind: 'num', a: (a + b) * c, e: '( )の中を先に計算する' }; }
    if (t === 2) { const a = ri(2, 9), b = ri(2, 9), c = ri(1, a * b); return { q: `${a} × ${b} − ${c} ＝ ？`, kind: 'num', a: a * b - c, e: 'かけ算を先に計算する' }; }
    if (t === 3) { const c = ri(2, 9), k = ri(2, 9), a = ri(k, 40); return { q: `${a} − ${c * k} ÷ ${c} ＝ ？`, kind: 'num', a: a - k, e: 'わり算を先に計算する' }; }
    if (t === 4) { const c = ri(2, 9), k = ri(2, 12), b = ri(1, 20); return { q: `( ${c * k + b} − ${b} ) ÷ ${c} ＝ ？`, kind: 'num', a: k, e: '( )の中を先に計算する' }; }
    const a = ri(2, 9), b = ri(2, 15), c = ri(2, 15); return { q: `${a} × ( ${b} ＋ ${c} ) ＝ ？`, kind: 'num', a: a * (b + c), e: '( )の中を先に計算する' };
  },
  shokake: () => {
    const a = ri(11, 99), b = Math.random() < 0.3 ? ri(2, 9) * 10 : ri(2, 49);
    return { q: op(dec(a, 1), '×', dec(b, 1)), kind: 'num', a: (a * b) / 100, e: '小数点がないものとして計算し、小数点の右のけた数の合計だけ、小数点をうつす' };
  },
  showari: () => {
    const b = pick([ri(2, 9), ri(12, 48)]), q = Math.random() < 0.5 ? ri(2, 30) * 10 : ri(11, 99); // わる数は b/10、答えは q/10
    return { q: op(dec(b * q, 2), '÷', dec(b, 1)), kind: 'num', a: q / 10, e: 'わる数が整数になるように、わる数とわられる数の小数点を同じだけ右へうつす' };
  },
  bunsu5: () => {
    let d1 = ri(2, 9), d2 = ri(2, 9); while (d2 === d1) d2 = ri(2, 9);
    const n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1), plus = Math.random() < 0.5 || n1 * d2 === n2 * d1;
    const [an, bn, ad, bd] = plus || n1 * d2 > n2 * d1 ? [n1, n2, d1, d2] : [n2, n1, d2, d1];
    const L = ad * bd / gcd(ad, bd), A = an * L / ad, B = bn * L / bd, ans = plus ? A + B : A - B;
    const q = `${fr(an, ad)} ${plus ? '＋' : '−'} ${fr(bn, bd)} ＝ ？`;
    return fracChoice(q, ans, L, [[plus ? an + bn : Math.abs(an - bn), ad + bd], [plus ? an + bn : Math.abs(an - bn), L], [ans + 1, L], [Math.abs(ans - 1) || ans + 2, L], [plus ? an * bd + bn * ad + 1 : ans + 2, ad * bd]],
      `分母を${L}にそろえる(通分)と、${A}/${L} ${plus ? '＋' : '−'} ${B}/${L}`);
  },
  wariai: () => {
    const t = ri(0, 2);
    if (t === 0) { const base = pick([20, 40, 50, 60, 80, 120, 150, 200, 300, 400, 500]), p = pick([5, 10, 20, 25, 30, 40, 50, 60, 75]); if (base * p % 100) return GEN.wariai(); return { q: `${base}人の ${p}% は何人？`, kind: 'num', a: base * p / 100, unit: '人', e: `${base} × ${p / 100} ＝ ${base * p / 100}` }; }
    if (t === 1) { const b = pick([20, 25, 40, 50, 80, 200]), p = pick([10, 20, 25, 40, 50, 60, 75, 80]); if (b * p % 100) return GEN.wariai(); return { q: `${b * p / 100} は ${b} の何％？`, kind: 'num', a: p, unit: '%', e: `${b * p / 100} ÷ ${b} ＝ ${p / 100} → ${p}%` }; }
    const x = pick([40, 50, 60, 80, 120, 200, 250, 300]), p = pick([10, 20, 25, 30, 40, 50]); if (x * p % 100) return GEN.wariai();
    return { q: `ある数の ${p}% が ${x * p / 100} のとき、ある数は？`, kind: 'num', a: x, e: `${x * p / 100} ÷ ${p / 100} ＝ ${x}` };
  },
  heikin: () => {
    const n = pick([3, 4, 5]), avg = ri(20, 90), xs = Array.from({ length: n - 1 }, () => avg + ri(-15, 15)), last = avg * n - xs.reduce((s, x) => s + x, 0);
    if (last < 1) return GEN.heikin();
    const all = shuffle([...xs, last]);
    return { q: `${all.join('、')} の平均は？`, kind: 'num', a: avg, e: `合計 ${avg * n} ÷ ${n}こ ＝ ${avg}` };
  },
  menseki: () => {
    const t = ri(0, 3), lab = (x, y, s) => `<text x="${x}" y="${y}" font-size="13" text-anchor="middle" fill="currentColor">${s}</text>`;
    const box = s => `<svg class="fig" viewBox="0 0 220 130" aria-hidden="true">${s}</svg>`, ln = 'fill="rgba(47,111,208,.12)" stroke="currentColor" stroke-width="2"', dash = 'stroke="currentColor" stroke-dasharray="4 3" stroke-width="1.5"';
    if (t === 0) { const b = ri(3, 16), hh = b % 2 ? ri(1, 7) * 2 : ri(2, 14); return { q: '三角形の面積は？', kind: 'num', a: b * hh / 2, unit: 'cm²', e: `底辺 × 高さ ÷ 2 ＝ ${b} × ${hh} ÷ 2`, fig: box(`<path d="M30 110 L190 110 L130 20 Z" ${ln}/><path d="M130 20 V110" ${dash}/>${lab(110, 126, b + 'cm')}${lab(150, 70, hh + 'cm')}`) }; }
    if (t === 1) { const b = ri(3, 15), h = ri(2, 12); return { q: '平行四辺形の面積は？', kind: 'num', a: b * h, unit: 'cm²', e: `底辺 × 高さ ＝ ${b} × ${h}`, fig: box(`<path d="M30 110 L160 110 L190 20 L60 20 Z" ${ln}/><path d="M60 20 V110" ${dash}/>${lab(95, 126, b + 'cm')}${lab(44, 70, h + 'cm')}`) }; }
    if (t === 2) { const a = ri(2, 10), b = a + ri(2, 8), h = ri(1, 6) * 2; return { q: '台形の面積は？', kind: 'num', a: (a + b) * h / 2, unit: 'cm²', e: `(上底 ＋ 下底) × 高さ ÷ 2 ＝ (${a} ＋ ${b}) × ${h} ÷ 2`, fig: box(`<path d="M20 110 L200 110 L160 20 L70 20 Z" ${ln}/><path d="M70 20 V110" ${dash}/>${lab(115, 14, a + 'cm')}${lab(110, 126, b + 'cm')}${lab(84, 70, h + 'cm')}`) }; }
    const a = ri(2, 12) * 2, b = ri(2, 12); return { q: 'ひし形の面積は？', kind: 'num', a: a * b / 2, unit: 'cm²', e: `対角線 × 対角線 ÷ 2 ＝ ${a} × ${b} ÷ 2`, fig: box(`<path d="M110 10 L190 65 L110 120 L30 65 Z" ${ln}/><path d="M30 65 H190 M110 10 V120" ${dash}/>${lab(150, 60, a + 'cm')}${lab(126, 100, b + 'cm')}`) };
  },
  bunkake: () => {
    if (Math.random() < 0.3) { const d = ri(3, 9), n = ri(1, d - 1), k = ri(2, 9); return fracChoice(`${fr(n, d)} × ${k} ＝ ？`, n * k, d, [[n * k, d * k], [n + k, d], [n, d * k]], '分子に整数をかける'); }
    const a = ri(2, 9), b = ri(1, a - 1) || 1, c = ri(2, 9), d = ri(1, c - 1) || 1; // b/a × d/c
    return fracChoice(`${fr(b, a)} × ${fr(d, c)} ＝ ？`, b * d, a * c, [[b + d, a + c], [b * c, a * d], [b * d, a + c], [a * d, b * c]], '分子どうし、分母どうしをかける');
  },
  bunwari: () => {
    if (Math.random() < 0.3) { const d = ri(2, 9), n = ri(1, d - 1), k = ri(2, 9); return fracChoice(`${fr(n, d)} ÷ ${k} ＝ ？`, n, d * k, [[n * k, d], [n, d + k], [k, n * d]], '分母に整数をかける'); }
    const a = ri(2, 9), b = ri(1, a - 1), c = ri(2, 9), d = ri(1, c - 1); // b/a ÷ d/c = b*c / a*d
    return fracChoice(`${fr(b, a)} ÷ ${fr(d, c)} ＝ ？`, b * c, a * d, [[b * d, a * c], [a * d, b * c], [b + c, a + d]], 'わる数の分母と分子を入れかえて、かける');
  },
  hi: () => {
    if (Math.random() < 0.5) {
      const x = ri(1, 9), y = ri(1, 9); if (x === y || gcd(x, y) !== 1) return GEN.hi();
      const k = ri(2, 9), ans = `${x} : ${y}`, wr = new Set([ans]); const ch = [ans];
      for (const w of shuffle([`${y} : ${x}`, `${x * 2} : ${y}`, `${x + 1} : ${y + 1}`, `${x} : ${y + 1}`, `${x + 1} : ${y}`, `${x} : ${y * 2}`])) if (!wr.has(w) && ch.length < 4) { wr.add(w); ch.push(w); }
      return { q: `${x * k} : ${y * k} を、かんたんな比にすると？`, kind: 'choice', a: ans, ch: shuffle(ch), e: `両方を ${k} でわる` };
    }
    const x = ri(1, 9), y = ri(1, 9), k = ri(2, 9);
    return Math.random() < 0.5 ? { q: `${x} : ${y} ＝ ${x * k} : □　□にあてはまる数は？`, kind: 'num', a: y * k, e: `${x} × ${k} ＝ ${x * k} だから、${y} × ${k}` }
      : { q: `${x} : ${y} ＝ □ : ${y * k}　□にあてはまる数は？`, kind: 'num', a: x * k, e: `${y} × ${k} ＝ ${y * k} だから、${x} × ${k}` };
  },
  en: () => {
    const r = ri(1, 10), dia = Math.random() < 0.35, a = r * r * 314 / 100;
    return { q: `${dia ? '直径' : '半径'} ${dia ? r * 2 : r}cm の円の面積は？(円周率は3.14)`, kind: 'num', a, unit: 'cm²', e: `半径 × 半径 × 3.14 ＝ ${r} × ${r} × 3.14`, fig: `<svg class="fig" viewBox="0 0 220 130" aria-hidden="true"><circle cx="110" cy="65" r="55" fill="rgba(47,111,208,.12)" stroke="currentColor" stroke-width="2"/><path d="M${dia ? 55 : 110} 65 H165" stroke="currentColor" stroke-width="2"/><circle cx="110" cy="65" r="3" fill="currentColor"/><text x="${dia ? 110 : 138}" y="58" font-size="13" text-anchor="middle" fill="currentColor">${dia ? r * 2 : r}cm</text></svg>` };
  },
  hayasa: () => {
    const t = ri(0, 2), v = pick([4, 5, 30, 40, 45, 50, 60, 80]), h = ri(2, 6), u = ['km', '時速'];
    if (t === 0) return { q: `${v * h}${u[0]} を ${h}時間で進むときの${u[1]}は？`, kind: 'num', a: v, unit: 'km', e: `速さ ＝ 道のり ÷ 時間 ＝ ${v * h} ÷ ${h}` };
    if (t === 1) return { q: `${u[1]}${v}km で ${h}時間進むと、道のりは？`, kind: 'num', a: v * h, unit: 'km', e: `道のり ＝ 速さ × 時間 ＝ ${v} × ${h}` };
    return { q: `${v * h}km の道のりを、${u[1]}${v}km で進むと、かかる時間は？`, kind: 'num', a: h, unit: '時間', e: `時間 ＝ 道のり ÷ 速さ ＝ ${v * h} ÷ ${v}` };
  },
};
// 4択の問題(国語・理科・社会)を、ちがう答えつきで作る
function choiceQ(u, it) {
  const others = shuffle(u.qs.filter(x => x !== it).map(x => x.a)).filter(a => a !== it.a);
  const d = it.d || others.slice(0, 3);
  const q = u.ask ? (u.ask.includes('◯◯') ? u.ask.replace('◯◯', esc(it.q)) : esc(u.ask)) : esc(it.q);
  return { q, big: u.ask && !u.ask.includes('◯◯') ? it.q : null, kind: 'choice', a: esc(it.a), ch: shuffle([it.a, ...d]).map(esc), e: it.e };
}
const mora = s => s.replace(/[ゃゅょぁぃぅぇぉ]/g, '').length;
function kanjiQ(kind, g, w, y) {
  const list = window.ND.kanji[g];
  const near = shuffle(list.filter(x => x[0] !== w && x[1] !== y && Math.abs(mora(x[1]) - mora(y)) <= 1));
  const pool = (near.length >= 3 ? near : shuffle(list.filter(x => x[0] !== w))).slice(0, 3);
  if (kind === 'yomi') return { q: 'この漢字の読みは？', big: w, bigNofuri: true, kind: 'choice', a: y, ch: shuffle([y, ...pool.map(x => x[1])]) };
  const pool2 = shuffle(list.filter(x => x[0] !== w && x[1] !== y && [...x[0]].length === [...w].length));
  const ds = (pool2.length >= 3 ? pool2 : pool).slice(0, 3);
  return { q: `「${y}」を漢字で書くと？`, kind: 'choice', a: w, ch: shuffle([w, ...ds.map(x => x[0])]), nofuriCh: true };
}
const PREF_SUF = n => n.endsWith('都') ? '都庁' : n.endsWith('道') ? '道庁' : n.endsWith('府') ? '府庁' : '県庁';
function makeQuestions(u) {
  if (u.qs) return shuffle(u.qs).slice(0, 10).map(it => choiceQ(u, it));
  const [kind, arg] = u.gen.split(':');
  if (kind === 'yomi' || kind === 'kaki') return shuffle(window.ND.kanji[arg]).slice(0, 10).map(([w, y]) => kanjiQ(kind, arg, w, y));
  if (kind === 'kenchou' || kind === 'chihou') {
    const P = window.ND.pref;
    return shuffle(P).slice(0, 10).map(([n, cap, reg]) => {
      if (kind === 'chihou') {
        const regs = [...new Set(P.map(p => p[2]))].filter(r => r !== reg);
        return { q: `${n}は、どの地方？`, kind: 'choice', a: reg + '地方', ch: shuffle([reg, ...shuffle(regs).slice(0, 3)]).map(r => r + '地方'), e: '8つの地方に分けたとき' };
      }
      const same = shuffle(P.filter(p => p[0] !== n && p[2] === reg)).map(p => p[1]), other = shuffle(P.filter(p => p[0] !== n && p[2] !== reg)).map(p => p[1]);
      return { q: `${n}の${PREF_SUF(n)}所在地は？`, kind: 'choice', a: cap, ch: shuffle([cap, ...[...same, ...other].slice(0, 3)]) };
    });
  }
  // 算数: 同じ問題が2回出ないように作る
  const out = [], seen = new Set();
  for (let i = 0; out.length < 10 && i < 200; i++) { const q = GEN[kind](), key = q.q + (q.fig || ''); if (!seen.has(key)) { seen.add(key); out.push(q); } }
  return out;
}

// ---------- 画面の切りかえ(画面ごとに履歴を積む。スマホの「戻る」でひとつ前の画面へ)
let cur = null;
function go(state, replace) { history[replace ? 'replaceState' : 'pushState'](state, ''); render(state); }
window.addEventListener('popstate', e => render(e.state || { s: 'home' }));
function render(st) {
  cur = st;
  if (st.s === 'subj') subjScreen(st.subj);
  else if (st.s === 'zukan') zukanScreen();
  else if (st.s === 'quiz' && byId[st.id]) startQuiz(byId[st.id]);
  else home();
  window.scrollTo(0, 0);
}
const back = () => history.back();

// ---------- ホーム
function partnerUnit() { return S.partner && formOf(S.partner) ? byId[S.partner] : owned()[0] || null; }
function home() {
  const p = partnerUnit(), n = owned().length;
  app.innerHTML = `
    <header class="top" data-furi-slot><h1>なかまドリル</h1></header>
    <section class="hero">
      <div class="stage">${p ? nakamaSVG(p, formOf(p.id), rec(p.id).kira, 'bob') : eggSVG(UNITS[0], 'wob')}</div>
      <div class="say">${p ? `<b>${esc(p.names[formOf(p.id) - 1])}</b><span>きょうも いっしょに がんばろう！</span>` : '<b>なかまを あつめよう</b><span>ドリルを1つクリアすると、たまごから なかまが生まれるよ。</span>'}</div>
    </section>
    <button class="zbtn" id="zukan"><span>📕 ずかん</span><b>${n}<small> / ${UNITS.length}</small></b></button>
    <div class="subjs">${Object.entries(SUBJ).map(([k, v]) => {
      const us = UNITS.filter(u => u.subj === k), got = us.filter(u => formOf(u.id)).length;
      return `<button class="subj" data-subj="${k}" style="--c:${v.color}"><span class="ic">${v.icon}</span><b>${k}</b><small>${got} / ${us.length}</small><i style="width:${(got / us.length) * 100}%"></i></button>`;
    }).join('')}</div>
    <p class="foot">10問中${PASS}問できたらクリア。${EVOLVE[1]}回・${EVOLVE[2]}回クリアで進化、全問正解でキラになるよ。記録はこの端末に保存されます。</p>`;
  app.querySelector('#zukan').onclick = () => { SE.play('select'); go({ s: 'zukan' }); };
  app.querySelectorAll('[data-subj]').forEach(b => b.onclick = () => { SE.play('select'); go({ s: 'subj', subj: b.dataset.subj }); });
}

// ---------- 教科ごとの単元
function subjScreen(subj) {
  const v = SUBJ[subj], grades = [...new Set(UNITS.filter(u => u.subj === subj).map(u => u.grade))];
  let g = S.grade[subj] && grades.includes(S.grade[subj]) ? S.grade[subj] : grades[0];
  const draw = () => {
    const us = UNITS.filter(u => u.subj === subj && u.grade === g);
    app.innerHTML = `
      <header class="top" data-furi-slot style="--c:${v.color}"><button class="back" id="back" data-noconfirm aria-label="もどる">←</button><h2>${v.icon} ${subj}</h2></header>
      <div class="tabs">${grades.map(x => `<button class="tab${x === g ? ' on' : ''}" data-g="${x}" style="--c:${v.color}">${x}年</button>`).join('')}</div>
      <div class="units">${us.map(u => {
        const r = rec(u.id), f = formOf(u.id), next = f && f < 3 ? EVOLVE[f] - r.clears : 0;
        const stars = [1, 2, 3].map(i => `<span class="${r.best >= PASS + i - 1 ? 'on' : ''}">★</span>`).join('');
        return `<button class="unit" data-id="${u.id}" style="--c:${v.color}">
          <span class="pic${f ? '' : ' sil'}">${f ? nakamaSVG(u, f, r.kira) : eggSVG(u)}</span>
          <span class="txt"><b>${esc(u.title)}</b><small>${f ? esc(u.names[f - 1]) + (r.kira ? ' ✨キラ' : '') : 'まだ生まれていない'}</small>
          <span class="meta"><span class="stars">${stars}</span>${r.clears ? `クリア ${r.clears}回` : ''}${next ? `・あと${next}回で進化` : f === 3 ? '・さいしゅう進化' : ''}</span></span>
        </button>`;
      }).join('')}</div>`;
    app.querySelector('#back').onclick = back;
    app.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { g = +b.dataset.g; S.grade[subj] = g; save(); SE.play('select'); draw(); });
    app.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { SE.play('start'); go({ s: 'quiz', id: b.dataset.id }); });
  };
  draw();
}

// ---------- ドリル
let Q = null;
function startQuiz(u) {
  Q = { u, list: makeQuestions(u), i: 0, score: 0, miss: [] };
  showQ();
}
function showQ() {
  const { u, list, i } = Q, it = list[i], v = SUBJ[u.subj], p = partnerUnit();
  Q.input = it.kind === 'rem' ? ['', ''] : [''];
  Q.slot = 0; Q.done = false;
  app.innerHTML = `
    <div class="qbar" style="--c:${v.color}"><button class="back" id="quit" aria-label="やめる">✕</button>
      <div class="ttl">${esc(u.title)}<small>${u.grade}年 ${u.subj}</small></div><span class="pill">${i + 1} / ${list.length}</span></div>
    <div class="prog"><i style="width:${(i / list.length) * 100}%;background:${v.color}"></i></div>
    <div class="buddy">${p ? nakamaSVG(p, formOf(p.id), rec(p.id).kira, 'mini') : eggSVG(u, 'mini')}<span class="bubble" id="bubble">${['いけるよ！', 'よく読んでね', 'ファイト！', 'じっくりね'][i % 4]}</span></div>
    <div class="q" style="--c:${v.color}">
      <p>${it.q}</p>
      ${it.big ? `<div class="big"${it.bigNofuri ? ' data-nofuri' : ''}>${esc(it.big)}</div>` : ''}
      ${it.fig || ''}
    </div>
    <div id="ans"></div>
    <div id="fb"></div>`;
  app.querySelector('#quit').onclick = back;
  const ans = app.querySelector('#ans');
  if (it.kind === 'choice') {
    ans.innerHTML = `<div class="choices">${it.ch.map((c, k) => `<button class="ch" data-k="${k}"${it.nofuriCh ? ' data-nofuri' : ''}><span class="n">${k + 1}</span><span class="c">${c}</span></button>`).join('')}</div>`;
    ans.querySelectorAll('.ch').forEach(b => b.onclick = () => answer(it.ch[+b.dataset.k] === it.a, b));
  } else {
    drawPad();
  }
}
function drawPad() {
  const it = Q.list[Q.i], ans = app.querySelector('#ans');
  const box = k => `<button class="inbox${Q.slot === k ? ' on' : ''}" data-slot="${k}">${esc(Q.input[k]) || '&nbsp;'}</button>`;
  ans.innerHTML = `
    <div class="inrow">${it.kind === 'rem' ? `${box(0)}<span>あまり</span>${box(1)}` : box(0)}${it.unit ? `<span>${esc(it.unit)}</span>` : ''}</div>
    <div class="pad">${['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '⌫'].map(k => `<button class="key" data-key="${k}">${k}</button>`).join('')}
    <button class="key go" data-key="ok">こたえる</button></div>`;
  ans.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => { Q.slot = +b.dataset.slot; drawPad(); });
  ans.querySelectorAll('[data-key]').forEach(b => b.onclick = () => key(b.dataset.key));
}
function key(k) {
  if (Q.done) return;
  const it = Q.list[Q.i];
  if (k === 'ok') {
    if (Q.input.some(x => x === '' || x === '.')) return;
    const ok = it.kind === 'rem' ? +Q.input[0] === it.a[0] && +Q.input[1] === it.a[1] : Math.abs(+Q.input[0] - it.a) < 1e-6;
    return answer(ok, null);
  }
  let s = Q.input[Q.slot];
  if (k === '⌫') s = s.slice(0, -1);
  else if (k === '.') { if (!s.includes('.')) s = (s || '0') + '.'; }
  else if (s.length < 8) s = s === '0' ? k : s + k;
  Q.input[Q.slot] = s;
  // あまりの1つ目を入れたら、2つ目へは自分でうつる(タップで行き来もできる)
  SE.play('select');
  drawPad();
}
document.addEventListener('keydown', e => {
  if (!Q || !cur || cur.s !== 'quiz' || !document.querySelector('.pad')) return;
  if (/^[0-9.]$/.test(e.key)) key(e.key);
  else if (e.key === 'Backspace') key('⌫');
  else if (e.key === 'Enter') key('ok');
  else if (e.key === 'Tab' && Q.input.length > 1) { e.preventDefault(); Q.slot = 1 - Q.slot; drawPad(); }
});
const fmtAns = it => it.kind === 'rem' ? `${it.a[0]} あまり ${it.a[1]}` : it.kind === 'num' ? `${String(+it.a.toFixed(6))}${it.unit ? ' ' + it.unit : ''}` : it.a;
function answer(ok, btn) {
  if (Q.done) return;
  Q.done = true;
  const it = Q.list[Q.i];
  if (ok) Q.score++; else Q.miss.push(it);
  app.querySelectorAll('.ch').forEach(b => { b.disabled = true; if (it.ch[+b.dataset.k] === it.a) b.classList.add('ok'); });
  if (btn && !ok) btn.classList.add('ng');
  app.querySelectorAll('.key, .inbox').forEach(b => { b.disabled = true; });
  const ib = app.querySelector('.inrow'); if (ib) ib.classList.add(ok ? 'ok' : 'ng');
  SE.play(ok ? 'ok' : 'ng');
  const bud = app.querySelector('.buddy'), bub = app.querySelector('#bubble');
  bud.classList.add(ok ? 'yay' : 'oops');
  bub.textContent = ok ? pick(['せいかい！', 'すごい！', 'やったね！', 'その調子！']) : pick(['どんまい！', 'おしい！', 'つぎ いこう！']);
  const last = Q.i + 1 >= Q.list.length;
  app.querySelector('#fb').innerHTML = `<div class="fb ${ok ? 'ok' : 'ng'}">
    <b>${ok ? '⭕ せいかい！' : '❌ ざんねん'}</b>
    ${ok ? '' : `<p>こたえ: <span class="c"${it.nofuriCh || it.bigNofuri ? '' : ''}>${fmtAns(it)}</span></p>`}
    ${it.e ? `<p class="e">${esc(it.e)}</p>` : ''}
    <button class="btn main" id="next">${last ? 'けっかを見る' : 'つぎへ'}</button></div>`;
  const nx = app.querySelector('#next');
  nx.onclick = () => { if (last) result(); else { Q.i++; showQ(); } };
  nx.focus({ preventScroll: true });
  app.querySelector('#fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---------- けっか と ごほうび
function result() {
  const { u, score, list, miss } = Q, n = list.length, v = SUBJ[u.subj];
  const before = rec(u.id), f0 = formOf(u.id), clear = score >= PASS, perfect = score === n;
  const r = { clears: before.clears + (clear ? 1 : 0), best: Math.max(before.best, score), kira: before.kira || perfect };
  S.u[u.id] = r;
  if (clear && !S.partner) S.partner = u.id;
  save();
  const f1 = formOf(u.id), kiraNew = perfect && !before.kira;
  const ev = !clear ? 'miss' : f0 === 0 ? 'born' : f1 > f0 ? 'evolve' : kiraNew ? 'kira' : 'clear';
  const head = { miss: 'もう少し！', born: 'なかまが生まれた！', evolve: '進化した！', kira: 'キラになった！', clear: 'クリア！' }[ev];
  const next = f1 && f1 < 3 ? EVOLVE[f1] - r.clears : 0;
  history.replaceState({ s: 'result', id: u.id }, '');
  cur = { s: 'result' };
  app.innerHTML = `
    <div class="qbar" style="--c:${v.color}"><button class="back" id="quit" data-noconfirm aria-label="もどる">←</button><div class="ttl">${esc(u.title)}<small>けっか</small></div></div>
    <section class="res ${ev}">
      <div class="score">${score}<small> / ${n}</small></div>
      <div class="stars big">${[1, 2, 3].map(i => `<span class="${score >= PASS + i - 1 ? 'on' : ''}">★</span>`).join('')}</div>
      <h2>${head}</h2>
      <div class="reveal" id="reveal">${ev === 'miss' ? (f0 ? nakamaSVG(u, f0, before.kira) : eggSVG(u, 'wob')) : ev === 'born' ? eggSVG(u, 'shake') : nakamaSVG(u, f0, before.kira, ev === 'clear' ? 'bob' : 'pre')}</div>
      <p class="nm" id="nm">${ev === 'miss' ? `${PASS}問できたらクリア。${f0 ? '' : 'たまごが待っているよ！'}` : ev === 'born' ? '…あれ？たまごが動いてる！' : esc(u.names[f0 - 1])}</p>
      ${clear && next ? `<p class="hint">あと${next}回クリアで進化！</p>` : clear && f1 === 3 && !r.kira ? '<p class="hint">全問正解でキラになるよ！</p>' : ''}
    </section>
    <div class="btns">
      <button class="btn main" id="again">もう1回</button>
      <button class="btn" id="tolist">単元をえらぶ</button></div>
    ${miss.length ? `<h3 class="mh">まちがえた問題</h3><div class="miss">${miss.map(it => `<div><p>${it.q}${it.big ? `<b${it.bigNofuri ? ' data-nofuri' : ''}> ${esc(it.big)}</b>` : ''}</p><p>こたえ: <b${it.nofuriCh ? ' data-nofuri' : ''}>${fmtAns(it)}</b></p></div>`).join('')}</div>` : ''}`;
  app.querySelector('#quit').onclick = back;
  app.querySelector('#tolist').onclick = back;
  app.querySelector('#again').onclick = () => { SE.play('start'); go({ s: 'quiz', id: u.id }, true); };
  SE.play(perfect ? 'perfect' : clear ? 'result' : 'over');
  const rv = app.querySelector('#reveal'), nm = app.querySelector('#nm');
  const pop = (html, text) => setTimeout(() => {
    rv.innerHTML = `<div class="flash"></div>${html}`; rv.classList.add('popin');
    nm.innerHTML = text; SE.play('star');
  }, 1500);
  if (ev === 'born') pop(nakamaSVG(u, f1, r.kira, 'bob'), `<b>${esc(u.names[f1 - 1])}</b> が なかまになった！`);
  if (ev === 'evolve') pop(nakamaSVG(u, f1, r.kira, 'bob'), `${esc(u.names[f0 - 1])} は <b>${esc(u.names[f1 - 1])}</b> に進化した！`);
  if (ev === 'kira') pop(nakamaSVG(u, f1, true, 'bob'), `<b>${esc(u.names[f1 - 1])}</b> がキラキラにかがやいた！`);
}

// ---------- ずかん
function zukanScreen() {
  const n = owned().length;
  app.innerHTML = `
    <header class="top" data-furi-slot><button class="back" id="back" data-noconfirm aria-label="もどる">←</button><h2>📕 なかまずかん</h2><span class="pill">${n} / ${UNITS.length}</span></header>
    ${Object.entries(SUBJ).map(([k, v]) => `<h3 class="zh" style="--c:${v.color}">${v.icon} ${k}の なかま(${v.kind})</h3>
      <div class="zgrid">${UNITS.filter(u => u.subj === k).map(u => {
        const f = formOf(u.id), r = rec(u.id);
        return `<button class="zc${f ? '' : ' sil'}${r.kira ? ' kira' : ''}" data-id="${u.id}" ${f ? '' : 'disabled'}>${f ? nakamaSVG(u, f, r.kira) : nakamaSVG(u, 1, false)}<small>${f ? esc(u.names[f - 1]) : '？？？'}</small></button>`;
      }).join('')}</div>`).join('')}
    <div id="dlg"></div>`;
  app.querySelector('#back').onclick = back;
  app.querySelectorAll('.zc[data-id]').forEach(b => b.onclick = () => detail(byId[b.dataset.id]));
}
function detail(u) {
  const f = formOf(u.id), r = rec(u.id), d = app.querySelector('#dlg');
  SE.play('select');
  d.innerHTML = `<div class="modal" id="mdl"><div class="sheet" style="--c:${SUBJ[u.subj].color}">
    <div class="dbig">${nakamaSVG(u, f, r.kira, 'bob')}</div>
    <h3>${esc(u.names[f - 1])}${r.kira ? ' ✨' : ''}</h3>
    <p class="sub">${u.grade}年 ${u.subj}「${esc(u.title)}」の なかま</p>
    <div class="forms">${[1, 2, 3].map(i => `<div class="${i <= f ? '' : 'sil'}">${nakamaSVG(u, i, r.kira && i <= f)}<small>${i <= f ? esc(u.names[i - 1]) : '？？？'}</small></div>`).join('')}</div>
    <p class="sub">クリア ${r.clears}回・さいこう ${r.best}点${f < 3 ? `・あと${EVOLVE[f] - r.clears}回で進化` : ''}${r.kira ? '' : '・全問正解でキラ'}</p>
    <div class="btns"><button class="btn main" id="mate">${S.partner === u.id ? 'あいぼう です' : 'あいぼうにする'}</button><button class="btn" id="cls">とじる</button></div>
  </div></div>`;
  const close = () => { d.innerHTML = ''; };
  d.querySelector('#cls').onclick = close;
  d.querySelector('#mdl').onclick = e => { if (e.target.id === 'mdl') close(); };
  d.querySelector('#mate').onclick = () => { S.partner = u.id; save(); SE.play('ok'); d.querySelector('#mate').textContent = 'あいぼう です'; };
}

// ---------- はじまり
history.replaceState({ s: 'home' }, '');
home();
