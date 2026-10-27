// data/*.txt から app/data/units.js を作る(window.ND = { units, kanji, pref })。
// 確かめること: 単元IDと名前の重複、問題数(10問以上)、正解とちがう答えの重なり。
// 実行: node tools/build-data.js
const fs = require('fs');
const path = require('path');
const D = path.join(__dirname, '../data');
const read = f => fs.readFileSync(path.join(D, f), 'utf8').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
const errs = [];

const units = [];
for (const f of ['kanji-units.txt', 'sansu.txt', 'choice-kokugo.txt', 'choice-rika.txt', 'choice-shakai.txt']) {
  let u = null;
  for (const line of read(f)) {
    if (line.startsWith('@unit ')) {
      const [id, subj, grade, title, names, extra] = line.slice(6).split('|');
      u = { id, subj, grade: +grade, title, names: names.split('/') };
      if (u.names.length !== 3) errs.push(`${id}: 名前が3つない`);
      if (extra && extra.startsWith('gen:')) u.gen = extra.slice(4); else { u.qs = []; if (extra) u.ask = extra; }
      units.push(u);
      continue;
    }
    const [q, a, d1, d2, d3, e] = line.split('|');
    const d = [d1, d2, d3].filter(Boolean);
    const item = { q, a };
    if (d.length) item.d = d;
    if (e) item.e = e;
    if (d.length && d.length !== 3) errs.push(`${u.id}: ちがう答えが3つない「${q}」`);
    if (d.includes(a) || new Set(d).size !== d.length) errs.push(`${u.id}: 答えが重なっている「${q}」`);
    u.qs.push(item);
  }
}
const ids = new Set(), names = new Set();
for (const u of units) {
  if (ids.has(u.id)) errs.push('ID重複 ' + u.id);
  ids.add(u.id);
  u.names.forEach(n => { if (names.has(n)) errs.push('名前重複 ' + n); names.add(n); });
  if (u.qs) {
    if (u.qs.length < 10) errs.push(`${u.id}: 問題が${u.qs.length}問(10問以上ほしい)`);
    // ちがう答えを自動で選ぶ単元は、正解どうしが重ならないこと
    if (u.qs.some(x => !x.d) && new Set(u.qs.map(x => x.a)).size !== u.qs.length) errs.push(`${u.id}: 正解が重なっている`);
    const qset = new Set();
    u.qs.forEach(x => { if (qset.has(x.q)) errs.push(`${u.id}: 問題重複「${x.q}」`); qset.add(x.q); });
  }
}

const kanji = {};
let g = 0;
for (const line of read('kanji.txt')) {
  if (line.startsWith('@')) { g = +line.slice(1); kanji[g] = []; continue; }
  kanji[g].push(line.split('|'));
}
// 書きの問題で、同じ読みのことばが同じ学年にあると答えが2つになる
for (const k in kanji) {
  const ys = {};
  kanji[k].forEach(([w, y]) => { if (ys[y]) errs.push(`${k}年: 読みが同じ ${ys[y]} / ${w}`); ys[y] = w; });
}
const pref = read('todofuken.txt').map(l => l.split('|'));
if (pref.length !== 47) errs.push('都道府県が47ない: ' + pref.length);


// ---------- 集めるカード(元素くん・国旗くん・星座くん)
// 元素: data/elements.txt。国旗: 国旗検定(KokkiKentei)の国名・由来と国旗画像。星座: ほしぞらドリルの d3-celestial データ(BSD-3-Clause)
const STATE = { H: '気体', He: '気体', N: '気体', O: '気体', F: '気体', Ne: '気体', Cl: '気体', Ar: '気体', Kr: '気体', Xe: '気体', Rn: '気体', Br: '液体', Hg: '液体' };
const el = read('elements.txt').map(l => { const [n, sym, ja, cat, note] = l.split('|'); return { n: +n, sym, ja, cat, note: note || '', st: STATE[sym] || (+n >= 100 ? '' : '固体') }; });
if (el.length !== 118 || el.some((e, i) => e.n !== i + 1)) errs.push('元素が1〜118にそろっていない');
const GAMES = 'C:/Users/user/Desktop/自作ゲーム/3_大型・制作中';
const REG = { asia: 'アジア', europe: 'ヨーロッパ', africa: 'アフリカ', namerica: '北アメリカ', samerica: '南アメリカ', oceania: 'オセアニア' };
const flag = JSON.parse(fs.readFileSync(GAMES + '/KokkiKentei/app/data/countries.json', 'utf8')).map(c => ({ c: c.c, ja: c.ja, reg: REG[c.region], note: c.origin }));
flag.forEach(f => { if (!fs.existsSync(path.join(__dirname, '../app/flags', f.c + '.svg'))) errs.push('国旗画像がない ' + f.c); });
const RES = GAMES + '/TenmonDrill/research/';
const cnames = JSON.parse(fs.readFileSync(RES + 'constellations.json', 'utf8')).features;
const lines = JSON.parse(fs.readFileSync(RES + 'constellations.lines.json', 'utf8')).features;
const star = [];
for (const f of cnames) {
  const id = f.id.replace(/\d$/, '');           // へび座は頭(Ser1)と尾(Ser2)に分かれているので1つにまとめる
  if (star.some(s => s.id === id)) continue;
  const segs = lines.filter(l => l.id.replace(/\d$/, '') === id).flatMap(l => l.geometry.coordinates);
  const [lon0, lat0] = f.properties.display;
  const r = Math.PI / 180, d0 = lat0 * r;
  // 星座の中心から見た向きで平面に写す(東が左)
  const pts = segs.map(seg => seg.map(([lon, lat]) => {
    const dl = (lon - lon0) * r, d = lat * r;
    return [-Math.cos(d) * Math.sin(dl), Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(dl)];
  }));
  const all = pts.flat(), xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys), k = 84 / Math.max(w, h, 1e-6);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const P = ([x, y]) => [Math.round(50 + (x - cx) * k), Math.round(50 - (y - cy) * k)];
  const path_ = pts.map(seg => 'M' + seg.map(p => P(p).join(' ')).join('L')).join('');
  const dots = [...new Set(all.map(p => P(p).join(',')))].join(' ');
  const ra = ((lon0 % 360) + 360) % 360 / 15;
  // よく見える季節(夜8時ごろ南の空に来るころ)のめやす。北の空の星座と、日本からほとんど見えない南の星座は別に書く
  const season = lat0 > 65 ? '一年中(北の空)' : lat0 < -55 ? '日本からはほとんど見えない' : ra >= 3 && ra < 9 ? '冬' : ra >= 9 && ra < 15 ? '春' : ra >= 15 && ra < 21 ? '夏' : '秋';
  star.push({ id, ja: f.properties.ja, la: f.properties.la || f.properties.name, season, d: path_, dots });
}
if (star.length !== 88) errs.push('星座が88ない: ' + star.length);
const cards = { el, flag, star };

if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
const out = path.join(__dirname, '../app/data/units.js');
fs.writeFileSync(out, '// 自動生成(tools/build-data.js)。data/*.txt を直して作り直す。\nwindow.ND = ' + JSON.stringify({ units, kanji, pref, cards }) + ';\n');
const by = {};
units.forEach(u => { by[u.subj] = (by[u.subj] || 0) + 1; });
console.log('カード', el.length, flag.length, star.length);
console.log('単元', units.length, by, '4択の問題', units.reduce((s, u) => s + (u.qs ? u.qs.length : 0), 0));
