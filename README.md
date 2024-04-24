# nestjs-next-restapi-business-matching-service

## 目的
- フロントエンドのコンポーネント設計、状態管理、テスト方針の検証
	- 開発速度を保ちつつ、品質の安定性とのバランスを考えた設計・テスト方針の検証
- バックエンドのNestJS, TypeORMのキャッチアップ、テスト方針の検証

上記を目的に一般的なWebシステム(エージェントサービス)を模した開発を行う

## 参考
・styled-componentsにおいて、DOMに存在しないattributeをスタイル調整でpropsで使う
https://styled-components.com/docs/faqs#why-am-i-getting-html-attribute-warnings

## frontend側の新規開発の設計
- 専属コンポーネントをコロケーションパターンで作成 & Jest, testing-libraryで結合テストで最低限の動作を確保
	- why
		- 新規開発時の速さと品質のちょうど良い塩梅
			- 新規開発の段階で細かく共通コンポーネントに分けると、共通部分の変更が入りやすく、テスト箇所も多くなる
				- 新規開発の段階ではまだ全体的なUIの決定がこれからのため
		- 全くテストがないというのはできるだけ避けたい
			- 結合テストを書いて動作を確保しておけば、後でリファクタリングもしやすい
			- テストを書くという文化を早期に醸成
			- E2Eを書いても良いが、結合テストと合わせてどっちもは難しい...
				- ハッピーパス(典型的なユースケースに沿ったシナリオ)の確認を0→1が終わった段階で書き始めるのが良いか

## frontend側のテスト方針
https://rightcode.co.jp/blogs/40957
https://note.com/cyberz_cto/n/n3ba47e0dcfd2
https://zenn.dev/maple_siro/articles/c0988e361b73c7
https://meetup-jp.toast.com/1771
https://zenn.dev/ignorant_kenji/articles/6f740feabf6f30
https://kaminashi-developer.hatenablog.jp/entry/2023/12/12/080000
https://techblog.finatext.com/front-end-testing-strategy-with-roi-82b22eb12811
https://zenn.dev/aldagram_tech/articles/kanna-integration-test
https://blog.cybozu.io/entry/2023/12/13/123701
https://gitkado.hatenadiary.jp/entry/20230517/1684250542

- E2Eに関して
	- Page RouterかつCSRではMSWでモックできた。
	- App RouterではMSW側からモックが難しい → testmodeが登場したが、2024年4月時点ではexperimental かつ 参考文献がまだ少ない...
	- 実行時間・メンテナンスコスト・信頼性の軸で結合テストとのバランスを考えることが大事
		- 結合テストをできるだけ厚くするのがコスパ良い
		- E2Eは結合テストでは補足が難しい部分、ハッピーパス(基本的なシナリオに沿った動作)を実装する

### 新規開発の場合
- 最低限コンポーネントが正しく動作すること
- コンポーネント同士の協調動作が正しく動作すること
- テスト作成・メンテナンスのコストと信頼度のバランス取りを考えると、単体テスト < 結合テスト・E2Eとしたい
- 結合テストはmock？ or 実際の挙動？
	- mock派
	  - mockを行うことでフロントエンドのテストになる
			- ただし、一連の動作を全てmockで検証しようとすると、実際のモジュール間の連結に対する検証ができず
			- → 個々のモジュール単位の小さな単体テスト < 複数のモジュールを組み合わせた形態を一つとみなし、より大きな規模の単体テストを行った方が良い
	- 実際の挙動派
- カバレッジ出してくれる実行方法
```
npx jest --coverage
```

- Jestの統合テスト vs Cypress
	- Jestの利点
		- frontend側のコードのミスに気づきやすい
	- Cypressの利点
		- 実際のブラウザ環境で行うため、より実際の動きを検証できる
			- JestはJSdomという仮想ブラウザ環境でテストを行うため、ルーティングがmock化せざるを得ない
		- デバッグのしやすさ
			- 実際のブラウザ環境なのでDOMの状態を検証したい場合にJestよりもやりやすい
		- Seleniumなど他のテストドライバよりも速い

| テスト種別 | テストコード作成対象 | 理由 | 何をテストするか |
| ---- | ---- | ---- | ---- |
| 単体 | 共通コンポーネント | ・変更が入った時の影響範囲が大きいため | ・propsが正しく受け取れているか<br>・イベントハンドラが動作するか |
| 結合 | 共通コンポーネント(molecules以上) | ・変更が入った時の影響範囲が大きいため | ・propsが正しく受け取れているか<br>・意図通りの子コンポーネントとの協調動作をするか(実際のユースケースに基づいたpropsなどで) |
| 結合 | 専属コンポーネント(molecules以上) | ・仕様通りに動作することを確認する<br>・リグレッションテストとしても機能する<br>・リファクタリングする時の安心材料となる | ・propsが正しく受け取れているか<br>・意図通りの子コンポーネントとの協調動作をするか(実際のユースケースに基づいたpropsなどで) |


## 0→1終了 or リプレイスの場合
- 新規開発の観点にプラス、E2EでAPI込みでページが動作すること
| テスト種別 | テストコード作成対象 | 理由 | 何をテストするか |
| ---- | ---- | ---- | ---- |
| E2E | 各ページ | ・仕様通りに動作することを確認する<br>・リグレッションテストとしても機能する<br>・リファクタリングする時の安心材料となる | ・最低限壊れずに動作するか<br>・ユースケースに基づいた入力で正しく動作するか |

・frontend側のテストの設定
https://nextjs.org/docs/pages/building-your-application/testing/jest
https://qiita.com/masakiwakabayashi/items/204ed2b32254bbc9a5c1#jestconfigjs%E3%82%92%E4%BD%9C%E6%88%90%E3%81%99%E3%82%8B
https://zenn.dev/arsaga/articles/056e7196b41c08

・frontend側のテスト参考サイト
https://fwywd.com/tech/next-testing-mock
https://zenn.dev/tkdn/books/react-testing-patterns/viewer/context-and-testing
https://ucwork.hatenablog.com/entry/2019/01/02/211136
https://qiita.com/s_karuta/items/ee211251d944e72b2517#jestspyon%E3%82%92%E3%81%A4%E3%81%8B%E3%81%86-1
https://qiita.com/Leech/items/5cd1e83253d0179b0cec
https://stackoverflow.com/questions/67872622/jest-spyon-not-working-on-index-file-cannot-redefine-property
https://qiita.com/m-yo-biz/items/e9b6298d111ff6d03a5e

## NestJSのテスト
https://blog.koh.dev/2022-07-02-jest-speedup/
https://zenn.dev/naonao70/articles/5167d8c18c81e2#%E3%83%86%E3%82%B9%E3%83%88%E3%82%B3%E3%83%BC%E3%83%89
https://developer.dip-net.co.jp/entry/2022/07/11/NestJS_x_Jest_x_TypeORM%E3%81%A7Unit~E2E%E3%83%86%E3%82%B9%E3%83%88%E3%82%92%E8%A1%8C%E3%81%86
https://qiita.com/suzuki0430/items/e4f8cabc61fc1fd41dcc
https://qiita.com/piggydev/items/a34321afb163588a9a7e

## NestJSの環境変数の設定
https://for.kobayashiii.dev/articles/yun50wtl9rc

## コマンド類
NestJSでresource(controller, service, module, entity)を一式作成する
```
nest g resource [name]
```

マイグレーション作成
```
npx ts-node ./node_modules/.bin/typeorm migration:generate -d ./data-source.ts ./migrations/
```

マイグレーション実行
```
npx ts-node ./node_modules/.bin/typeorm migration:run -d ./data-source.ts
```

バックエンドコンテナ内でCLIのバッチを実行する
```
npx ts-node src/commands/cli.ts <commandName> <args>
```

localstack
```

```

エラーハンドリング
これ試す
https://qiita.com/H-goto16/items/49cc54d53bcd9102316d

localstack
https://dennie.tokyo/it/?p=4019
https://dennie.tokyo/it/?p=4024
https://qiita.com/y-u-t-a/items/712e98e2298bdbe1a66c#s3-%E3%83%90%E3%82%B1%E3%83%83%E3%83%88%E5%86%85%E3%81%AE%E3%82%AA%E3%83%96%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88%E4%B8%80%E8%A6%A7%E5%8F%96%E5%BE%97
https://qiita.com/hamu3864kA/items/3472c2f5230f88ecdbb7

Node.js localstack s3操作
https://qiita.com/taisuke101700/items/d7efaca27b33adf29833
https://stackoverflow.com/questions/74378854/localstack-aws-s3-javascript-error-getaddrinfo-enotfound-bucketname-localhost

ファイルアップロードを伴うWebAPIの設計パターン
https://techblog.imagemagic.jp/2023/06/12/%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%82%A2%E3%83%83%E3%83%97%E3%83%AD%E3%83%BC%E3%83%89%E3%82%92%E4%BC%B4%E3%81%86webapi%E3%81%AE%E8%A8%AD%E8%A8%88%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3%E3%82%92/

→ 今回はファイルアップロード箇所が限定的 & ファイルサイズも〜数百KBなのでBase64でJSONで扱う

ファイルダウンロード
https://qiita.com/hamu3864kA/items/3472c2f5230f88ecdbb7
