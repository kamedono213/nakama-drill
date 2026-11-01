// 家族用(非公開)の版を作る。公開版 docs/ をコピーし、家で使うだけのイラスト(make-pack.js のパック)を ふつうの章として足す。
// 出力先はリポジトリの外(..\NakamaDrill-private\site\)。Firebase Hosting の別サイトに置き、検索にも出さない(noindex)。
// 画像やパックは、このリポジトリ(公開)には入れない
// 実行: node tools/build-pages.js のあとに node tools/build-family.js <パック.json>
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pack = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, '../../NakamaDrill-private/pack.json'), 'utf8'));
const DOCS = path.join(__dirname, '../docs');
const OUT = path.join(__dirname, '../../NakamaDrill-private/site/public');
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(DOCS, OUT, { recursive: true });

// イラストをファイルにして、illusts.js の最後に足す
const dataFile = path.join(OUT, 'data/illusts.js');
const src = fs.readFileSync(dataFile, 'utf8');
const list = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));
for (const x of pack.items) {
  const file = `illust/${x.id}.jpg`;
  fs.writeFileSync(path.join(OUT, file), Buffer.from(x.data.split(',')[1], 'base64'));
  const { data, ...rest } = x;
  list.push({ ...rest, file });
}
fs.writeFileSync(dataFile, '// 家族用(tools/build-family.js)\nwindow.ND_ILL = ' + JSON.stringify(list) + ';\n');

// 検索に出さない・名前を変える
const idx = path.join(OUT, 'index.html');
fs.writeFileSync(idx, fs.readFileSync(idx, 'utf8').replace('<head>', '<head>\n<meta name="robots" content="noindex, nofollow">'));
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
const man = path.join(OUT, 'manifest.webmanifest'), m = JSON.parse(fs.readFileSync(man, 'utf8'));
m.name = m.short_name = 'なかまドリル(家)';
fs.writeFileSync(man, JSON.stringify(m, null, 2));

// サービスワーカーのキャッシュ名を中身から作り直す(家族用の中身が変わったら入れかわるように)
const files = [];
(function walk(d, rel) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f), r = rel ? rel + '/' + f : f; if (fs.statSync(p).isDirectory()) walk(p, r); else files.push(r); } })(OUT, '');
const h = crypto.createHash('sha1');
files.filter(f => f !== 'sw.js').sort().forEach(f => h.update(f).update(fs.readFileSync(path.join(OUT, f))));
const sw = path.join(OUT, 'sw.js');
fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/const CACHE = 'nakama-[^']*';/, `const CACHE = 'nakama-fam-${h.digest('hex').slice(0, 10)}';`));
console.log(`site built: ${list.length}しょう, ${files.length} files`);
