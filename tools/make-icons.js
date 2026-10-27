// PWA用アイコン: 算数のなかま(3だんかい・キラ)を、紫の地に描いて PNG にする(Playwright で撮る)。
// 実行: node tools/make-icons.js
const { chromium } = require('C:/Users/user/Desktop/自作ゲーム/2_カードゲーム/DigimonCard/node_modules/playwright');
const path = require('path'), fs = require('fs');
const out = path.join(__dirname, '../app/icons');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  const html = fs.readFileSync(path.join(__dirname, '../app/index.html'), 'utf8');
  await p.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0"></body>');
  await p.addScriptTag({ path: path.join(__dirname, '../app/data/units.js') });
  await p.addScriptTag({ content: 'document.body.innerHTML=\'<div id="app"></div>\';' });
  await p.addScriptTag({ path: path.join(__dirname, '../app/app.js') });
  for (const [name, size, pad] of [['icon-192.png', 192, 0.08], ['icon-512.png', 512, 0.08], ['maskable-512.png', 512, 0.2], ['apple-touch-icon.png', 180, 0.1]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.evaluate(([size, pad]) => {
      document.body.innerHTML = `<div style="width:${size}px;height:${size}px;background:radial-gradient(circle at 50% 40%,#6c5ce7,#3a2f7a);display:grid;place-items:center"><div style="width:${size * (1 - pad * 2)}px">${nakamaSVG(byId['m-tashi'], 3, false)}</div></div>`;
    }, [size, pad]);
    await p.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width: size, height: size } });
  }
  await b.close();
  console.log('icons written');
})();
