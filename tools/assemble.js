// app.js に共通部品を入れる: 「もどる」確認(@@LEAVE の場所)と、ふりがな・効果音(sync-runtime.js と同じ印の間)。
// 実行: node tools/assemble.js
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '../app/app.js');
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
if (s.includes('//@@LEAVE\n')) {
  const leave = fs.readFileSync('D:/onze.ltd/reference/leave-confirm-snippet.js', 'utf8').replace(/\r\n/g, '\n').split('\n').slice(1).join('\n')
    .replace('const ROUTED = false;', 'const ROUTED = true;');
  s = s.replace('//@@LEAVE\n', leave.endsWith('\n') ? leave : leave + '\n');
}
fs.writeFileSync(f, s);
require('child_process').execFileSync('node', ['D:/onze.ltd/tools/furigana/sync-runtime.js', path.join(__dirname, '..')], { stdio: 'inherit' });
