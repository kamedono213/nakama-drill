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

if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
const out = path.join(__dirname, '../app/data/units.js');
fs.writeFileSync(out, '// 自動生成(tools/build-data.js)。data/*.txt を直して作り直す。\nwindow.ND = ' + JSON.stringify({ units, kanji, pref }) + ';\n');
const by = {};
units.forEach(u => { by[u.subj] = (by[u.subj] || 0) + 1; });
console.log('単元', units.length, by, '4択の問題', units.reduce((s, u) => s + (u.qs ? u.qs.length : 0), 0));
