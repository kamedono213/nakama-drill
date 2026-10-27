# なかまドリル

小学校の国語・算数・理科・社会のドリル(1〜6年・64単元)。10問中8問でクリアすると、たまごから単元ごとの「なかま」が生まれる。3回・6回クリアで進化、全問正解でキラ。ずかんで集めたなかまを見られる。

公開: https://kamedono213.github.io/nakama-drill/

## 問題を足す・直す
- 漢字: `data/kanji.txt`(`node tools/check-kanji.js` で学年の範囲と読みを確認)
- 4択: `data/choice-*.txt`(書き方はファイルの先頭)。都道府県は `data/todofuken.txt`
- 算数: `app/app.js` の `GEN`(その場で作る)
- 集めるカード: 元素 `data/elements.txt`、国旗は国旗検定(KokkiKentei)の国名・由来・画像、星座はほしぞらドリルの d3-celestial データ(BSD-3-Clause)。カードはクリアの記録から決まる(ふっかつのじゅもんで戻せる)
- **単元を足すときは必ず各ファイルの最後に足す**(ふっかつのじゅもんが UNITS の順番を使うため)
1. `node tools/build-data.js`
2. `node D:/onze.ltd/tools/furigana/make-furi.js .`(文章を変えたとき)
3. `node tools/build-pages.js` で `docs/` を作り直してpush

共通部品(もどる確認・ふりがな・効果音)を入れ直す: `node tools/assemble.js`
確認用: `node serve.js docs` → http://localhost:5403
