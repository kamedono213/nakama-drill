// data/kanji.txt を確かめる: その学年までの漢字だけか、その学年の漢字があるか、読みが kuromoji と合うか。
// 実行: node tools/check-kanji.js  (合わないものだけ表示。kuromoji のまちがいもあるので、目で見て判断する)
const fs = require('fs');
const path = require('path');
const kuromoji = require('D:/onze.ltd/tools/furigana/node_modules/kuromoji');
const H = JSON.parse(fs.readFileSync(path.join(__dirname, 'haitou.json'), 'utf8'));
const gradeOf = {};
for (const g in H) for (const c of H[g]) gradeOf[c] = +g;
const kata2hira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const words = [];
let g = 0;
for (const line of fs.readFileSync(path.join(__dirname, '../data/kanji.txt'), 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  if (line.startsWith('@')) { g = +line.slice(1); continue; }
  const [w, y] = line.split('|');
  words.push({ g, w, y });
}
let bad = 0;
const seen = {};
for (const x of words) {
  const ks = [...x.w].filter(c => /[一-鿿]/.test(c));
  const over = ks.filter(c => !gradeOf[c] || gradeOf[c] > x.g);
  if (over.length) { bad++; console.log(`学年オーバー ${x.g}年 ${x.w}: ${over.map(c => c + '(' + (gradeOf[c] || '外') + ')').join(' ')}`); }
  if (!ks.some(c => gradeOf[c] === x.g)) { bad++; console.log(`その学年の字なし ${x.g}年 ${x.w}`); }
  if (seen[x.w]) { bad++; console.log('重複', x.w); }
  seen[x.w] = 1;
}
kuromoji.builder({ dicPath: 'D:/onze.ltd/tools/furigana/node_modules/kuromoji/dict' }).build((err, tk) => {
  if (err) throw err;
  for (const x of words) {
    const r = kata2hira(tk.tokenize(x.w).map(t => t.reading || t.surface_form).join(''));
    if (r !== x.y) console.log(`読み? ${x.g}年 ${x.w} 書いた:${x.y} kuromoji:${r}`);
  }
  const byG = {};
  words.forEach(x => byG[x.g] = (byG[x.g] || 0) + 1);
  console.log('語数', byG, '学年の問題', bad);
});
