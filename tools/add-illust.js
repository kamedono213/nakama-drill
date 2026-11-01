// ストーリー用のイラストを1まい足す。画像を横1200pxのJPEGにして app/illust/ に置き、app/data/illusts.js の最後に足す。
// イラスト1まい = ストーリーの1しょう(9ステージ)。9ステージクリアで完成し、ずかんとバトルのカードになる。
// 実行: node tools/add-illust.js <画像> --name ほのおのドラゴン --place ドラゴンの山 --hand p --num 8
//   --hand は g(グー)/c(チョキ)/p(パー)、--num はカードの数字(6〜9 くらい。ふつうのなかまは2〜5)
//   --fx はカードの効果(なくてもよい): triple / minus2 / guard / tie / plus2(中身は app.js の FX)
// ふっかつのじゅもんがこの順番を使うので、かならず最後に足す(並べかえ・削除をしない)
const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/user/Desktop/自作ゲーム/2_カードゲーム/DigimonCard/node_modules/playwright');

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
const src = args[0], name = opt('name'), place = opt('place'), hand = opt('hand'), num = +opt('num'), fx = opt('fx');
if (!src || !name || !place || !'gcp'.includes(hand || 'x') || !(num >= 1 && num <= 9)) {
  console.log('usage: node tools/add-illust.js <画像> --name 名前 --place ばしょ --hand g|c|p --num 1〜9'); process.exit(1);
}
const DATA = path.join(__dirname, '../app/data/illusts.js');
const list = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, 'utf8').replace(/^[^[]*/, '').replace(/;\s*$/, '')) : [];
const id = 'ill' + String(list.length + 1).padStart(2, '0');
const out = path.join(__dirname, '../app/illust', id + '.jpg');
fs.mkdirSync(path.dirname(out), { recursive: true });

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const ext = path.extname(src).slice(1).toLowerCase().replace('jpg', 'jpeg');
    const url = `data:image/${ext};base64,` + fs.readFileSync(src).toString('base64');
    const r = await page.evaluate(async url => {
      const img = new Image(); img.src = url; await img.decode();
      const w = Math.min(1200, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      return { w, h, data: c.toDataURL('image/jpeg', 0.85) };
    }, url);
    fs.writeFileSync(out, Buffer.from(r.data.split(',')[1], 'base64'));
    list.push({ id, file: `illust/${id}.jpg`, w: r.w, h: r.h, name, place, hand, num, ...(fx ? { fx } : {}) });
    fs.writeFileSync(DATA, '// 自動生成(tools/add-illust.js)。ストーリーのイラスト。順番を変えない(ふっかつのじゅもんが使う)\nwindow.ND_ILL = ' + JSON.stringify(list, null, 1) + ';\n');
    console.log(`${id} ${name} ${r.w}x${r.h} ${(fs.statSync(out).size / 1024).toFixed(0)}KB`);
  } finally { await browser.close(); }
})();
