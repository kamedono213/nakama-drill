// 「ひみつの章」のパック(JSON)を作る。家で使うだけの画像を、公開サイトに置かずに子どもの端末へ入れるためのもの。
// できたファイルを端末にうつし、アプリの ストーリー → ひみつの章 → ファイルから読みこむ で入れる(IndexedDB に保存される)。
// 実行: node tools/make-pack.js <リスト.json> <出力.json>
//   リスト = [{ "src": "画像のパス", "name": "名前", "place": "ばしょ", "hand": "g|c|p", "num": 1〜9, "fx": "triple|minus2|guard|tie|plus2" }, …]
// id はリストの順番で決まる(pk01〜)。ふっかつのじゅもんが順番を使うので、足すときは最後に足す
// パックもリストも、このリポジトリ(公開)には入れない
const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/user/Desktop/自作ゲーム/2_カードゲーム/DigimonCard/node_modules/playwright');

const [listPath, outPath] = process.argv.slice(2);
if (!listPath || !outPath) { console.log('usage: node tools/make-pack.js <リスト.json> <出力.json>'); process.exit(1); }
const list = JSON.parse(fs.readFileSync(listPath, 'utf8'));
const base = path.dirname(path.resolve(listPath));

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const items = [];
    for (const [i, x] of list.entries()) {
      const src = path.resolve(base, x.src);
      const ext = path.extname(src).slice(1).toLowerCase().replace('jpg', 'jpeg');
      // 端末の容量をおさえるため、長い辺を900pxにする
      const r = await page.evaluate(async url => {
        const img = new Image(); img.src = url; await img.decode();
        const k = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        return { w, h, data: c.toDataURL('image/jpeg', 0.82) };
      }, `data:image/${ext};base64,` + fs.readFileSync(src).toString('base64'));
      items.push({ id: 'pk' + String(i + 1).padStart(2, '0'), name: x.name, place: x.place, hand: x.hand, num: x.num, fx: x.fx, w: r.w, h: r.h, data: r.data });
      console.log(items.at(-1).id, x.name, `${r.w}x${r.h}`);
    }
    fs.writeFileSync(outPath, JSON.stringify({ type: 'nakama-pack', made: new Date().toISOString().slice(0, 10), items }));
    console.log(outPath, (fs.statSync(outPath).size / 1048576).toFixed(1) + 'MB');
  } finally { await browser.close(); }
})();
