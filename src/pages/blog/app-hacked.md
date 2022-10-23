---
layout: "../../layouts/BlogPost.astro"
title: "卒論のために脆弱性を無視してアプリを魔改造"
description: "おすすめはしない"
pubDate: "Oct 23 2022"
heroImage: "/lab/member/2109/images/Pasted image 20221017011444.png"
---

# いきさつ

私は卒論含め、文書はほとんどTeXで書いている。Texのソースコードは手元で見られるのだが、実際のPDFファイルがどのような見た目になるのかを確認するためには、どうしてもPDFビューアーを横に配置する必要がある。Windowsのウィンドウマネジメント機能により、画面を左右に分割して片方にエディタ、もう片方にビューアー（私はWebブラウザしか使わない) を置くのが一般的だと思う。

このやり方、意外とデメリットもある。

一番困ったのが、エディタを表示する際に出力先のPDF（と参考文献のPDF）を表示しているブラウザのウィンドウを並べて表示するためにマウスを使わざるをえないということだった。Windows 11になってから、画面分割をするとその画面構成自体も記憶してタスクバーから選択できるようになったが、分割されたウィンドウを逐一拾ってくる手間が省けただけで、ブラウザとエディタのウィンドウが並んでいるタスクアイテムを選ぶ必要があるというのは何も変わっていない。実際の執筆作業ではそのアクションを何度も行う必要があり、私はよく選択をミスって英単語の意味を調べていたときのウィンドウを表示してしまう。

編集と閲覧がシームレスにできるということの利便性はいうまでもない。WYSIWYGのワードプロセッサがメジャーなのはそのためだろうし、プログラマ的にはソースコードを保存した途端にコンパイルやリロードが自動で実行されるのは非常にありがたく感じる。エディタとブラウザを個別に開いてマウスによるオペレーションで編集と閲覧を合わせるのは、その意味で非効率だと感じられるようになった。エディタがターミナルで動くなら、PDFもターミナルで閲覧できたらいいのに、と思うのはある程度自然な流れなんじゃなかろうか。

そういうわけで、卒論を書くために今回[Hyper](https://github.com/vercel/hyper)というアプリケーションのソースコードを弄くり、ペインをブラウザビューとして使えるように変更してみた。

# やり方

## 先行研究

実は先駆者がいる。 https://dev.to/craftzdog/getting-side-by-side-preview-in-a-terminal-app-hyper-20ii

この記事に影響されて、私もターミナルでPDFを表示できたらいいのになと思うようになった。私は趣味や仕事でウェブページやウェブアプリを記述することもあるので、このように表示できたらとてもいいだろうなと思った。

やり方は意外とシンプル。HyperというターミナルエミュレータはElectronで構築されたアプリケーションであるので、ソースコードを弄ってターミナルコンポーネントのレンダリングで`webview`タグを使えば良い。記事で言及されている通り、もともとHyperはこの機能を持っていたのだが、セキュリティの観点から削除されたようだ。

さて、私のニーズとこのブログ記事の違いは、その表示の使い道である。私は効率的に編集できたらいいなという思惑を持ってこのブログ記事を見つけたが、この人の場合はどうやら、Web開発のチュートリアル動画を制作する立場から、コードを書く様子と実際の出力が並んで表示できたら作業が楽でいい、という発想のもとでこのようなことをしているらしい。

そうなると、ターミナルに埋め込まれたPDFないしブラウザに持たせた機能も若干異なってくる。私は最低限、これらの機能があると嬉しい。

- Webビュー機能
- リロード
- 戻る / 進む

いずれも`webview`タグのAPIで実現可能なものである。幸い、私はこの記事のとおりに実装をすればよさそうだ。

## 問題発生

### ファーストトライ

この記事ではdiffへのリンクが貼ってあるだけでなく、プロジェクトをフォークして単純なコマンド操作だけでアプリがビルドできるように指示書がついていた。Zenスタイルな指示だが、ないよりはマシだと思って書いてある通りにビルドをしてみる。

まずはリポジトリをクローン。

```sh
git clone git@github.com:craftzdog/hyper.git hyper-webview
cd hyper-webview
```

そしてコマンドをコピペ。アプリのビルドというより、ソースコードの変更を検知して自動でビルドするようにアプリを起動するという、開発者モードだが。

```sh
yarn run dev
# 別のターミナルを開く
yarn run app
```

すると、エラーが発生する。長いのでログ全文は書かないが、どうやらバージョンの依存解決に起因するエラーに見えた。私はNode.jsのバージョン関係のエラーを解決しようとすると時間が無限に溶けることを予期して (なおかつ私の経験値では解決まで持っていくことはできないのもあって) 、あまり深入りはせず、別のアプローチをとることにした。

### セカンドオピニオン

Hyperのソースコードをある程度理解する必要があるという事実を受け入れて、公式のリポジトリをクローンして、それに変更を加える形にしようと考えた。

```sh
git clone git@github.com:vercel/hyper.git hyper
cd hyper
```

あとは`README.md`にかかれているような方法でアプリをビルドする。さすがにこの方法ならうまくアプリを立ち上げることができた。DBやらコンテナやらも使っていないので特に苦労はない。

元のブログ記事では、ある程度ソースコードの変更指針が記されているので、それに従って変更を試みた。

記事によれば、`lib/components/term.tsx`で定義されている`Term`コンポーネントには`url`というpropsがまだ残されている。これを用いて実装を進めていく。実際のソースコードは、元の記事にdiffで載っている。 のでそれを引用。

```diff
@@ -430,18 +436,35 @@ export default class Term extends React.PureComponent<TermProps> {
         style={{padding: this.props.padding}}
         onMouseUp={this.onMouseUp}
       >
-        {this.props.customChildrenBefore}
-        <div ref={this.onTermWrapperRef} className="term_fit term_wrapper" />
-        {this.props.customChildren}
-        {this.props.search ? (
-          <SearchBox
-            search={this.search}
-            next={this.searchNext}
-            prev={this.searchPrevious}
-            close={this.closeSearchBox}
+        {this.props.url ? (
+          <webview
+            src={this.props.url}
+            style={{
+              background: '#fff',
+              position: 'absolute',
+              top: 0,
+              left: 0,
+              display: 'inline-flex',
+              width: '100%',
+              height: '100%'
+            }}
           />
         ) : (
-          ''
+          <>
+            {this.props.customChildrenBefore}
+            <div ref={this.onTermWrapperRef} className="term_fit term_wrapper" />
+            {this.props.customChildren}
+            {this.props.search ? (
+              <SearchBox
+                search={this.search}
+                next={this.searchNext}
+                prev={this.searchPrevious}
+                close={this.closeSearchBox}
+              />
+            ) : (
+              ''
+            )}
+          </>
         )}

         <style jsx global>{`
```

ちなみに`webview`タグはElectronのバージョン5以上ではデフォルトで無効化されている。なので、`app/ui/window.ts`でオプションを変更する。

```diff
   const winOpts: BrowserWindowConstructorOptions = {
     minWidth: 370,
     minHeight: 190,
     backgroundColor: toElectronBackgroundColor(cfg.backgroundColor || '#000'),
     titleBarStyle: 'hiddenInset',
     title: 'Hyper.app',
     // we want to go frameless on Windows and Linux
     frame: process.platform === 'darwin',
     transparent: process.platform === 'darwin',
     icon,
     show: Boolean(process.env.HYPER_DEBUG || process.env.HYPERTERM_DEBUG || isDev),
     acceptFirstMouse: true,
     webPreferences: {
       nodeIntegration: true,
       navigateOnDragDrop: true,
       enableRemoteModule: true,
-      contextIsolation: false
+      contextIsolation: false,
+      webviewTag: true
     },
     ...options_
   };
```

あとはリンクをクリックしたときの挙動を変更する。

```diff
@@ -160,7 +160,13 @@ export default class Term extends React.PureComponent<TermProps> {
       this.term.loadAddon(
         new WebLinksAddon(
           (event: MouseEvent | undefined, uri: string) => {
-            if (shallActivateWebLink(event)) void shell.openExternal(uri);
+            // if (shallActivateWebLink(event)) void shell.openExternal(uri);
+            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
+            store.dispatch({
+              type: 'SESSION_URL_SET',
+              uid: props.uid,
+              url: uri
+            });
           },
           {
             // prevent default electron link handling to allow selection, e.g. via double-click
```

ここで私のvim-lspがエラーを指摘してくる。どうやらstoreという名前が見つけられないようだ。

Reactはアルバイトで1ヶ月ほど触った程度でその時はReduxを使っていなかった。状態管理はContextばかり使っていたので、Reduxの使い方はさっぱり知らない。

その後も記事通りに作業を進めていくが、そこでも新しいエラーが出てくる。ここまでの一連のエラーは同じような状況になった人がいるのでそれを貼っておく。この人はフォーク先のリポジトリでそのコミットの時点でビルドを試みたようだが。

https://github.com/craftzdog/hyper/commit/8baac5c2706d7be317cf372810c5164fc7ff1cd4#commitcomment-59584486

「自分で直せ」というリプライに素直に従い、私も自分で解決策を探ることにした。

## 解決法

結局、Reduxの仕様はわからずじまいだった。

私は、`Term`コンポーネントがpropsに持っているURLを使わず、`Term`に普通のステートを持たせることにした。とっても原始的な実装である。

```diff
@@ -94,6 +176,7 @@ export default class Term extends React.PureComponent<TermProps> {
   term!: Terminal;
   resizeObserver!: ResizeObserver;
   resizeTimeout!: NodeJS.Timeout;
+  state: {url: string | null};
   constructor(props: TermProps) {
     super(props);
     props.ref_(props.uid, this);
```

```diff
@@ -104,6 +187,7 @@ export default class Term extends React.PureComponent<TermProps> {
     this.termDefaultBellSound = null;
     this.fitAddon = new FitAddon();
     this.searchAddon = new SearchAddon();
+    this.state = {url: null};
   }
 
   // The main process shows this in the About dialog

```

URLをクリックしたときの挙動は、Reduxの操作でなく`Term`コンポーネントの`url`ステートの操作で実装することになる。

次に、`webview`タグを埋め込むわけだが、ここでは`webview`の他に戻るボタンやリロードボタンなどを内蔵した以下のようなコンポーネントを定義することにした。

```diff
@@ -82,6 +85,85 @@ const getTermOptions = (props: TermProps): ITerminalOptions => {
   };
 };
 
+export interface IWebViewProps {
+  className?: string;
+  src?: string;
+}
+
+export class WebView extends React.PureComponent<IWebViewProps> {
+  webviewRef: React.RefObject<Electron.WebviewTag>;
+  constructor(props: IWebViewProps) {
+    super(props);
+    this.webviewRef = React.createRef();
+  }
+
+  public goBack = (w: Electron.WebviewTag | null) => {
+    if (w?.canGoBack()) w.goBack();
+  };
+
+  public goForward = (w: Electron.WebviewTag | null) => {
+    if (w?.canGoForward()) w.goForward();
+  };
+
+  public reload = (w: Electron.WebviewTag | null) => {
+    w?.reload();
+  };
+
+  public openDevTools = (w: Electron.WebviewTag | null) => {
+    if (w?.isDevToolsOpened()) w.closeDevTools();
+    else w?.openDevTools();
+  };
+
+  public render(): JSX.Element {
+    return (
+      <div
+        style={{
+          background: '#000',
+          position: 'absolute',
+          top: 0,
+          left: 0,
+          display: 'flex',
+          flexDirection: 'column',
+          width: '100%',
+          height: '100%'
+        }}
+        onKeyPress={() => console.log('key pressed')}
+      >
+        <div
+          style={{
+            display: 'flex',
+            flexDirection: 'row'
+          }}
+        >
+          <button style={{flexGrow: 1}} onClick={() => this.goBack(this.webviewRef.current)}>
+            Back
+          </button>
+          <button style={{flexGrow: 1}} onClick={() => this.goForward(this.webviewRef.current)}>
+            Forward
+          </button>
+          <button style={{flexGrow: 1}} onClick={() => this.reload(this.webviewRef.current)}>
+            Reload
+          </button>
+          <button style={{flexGrow: 1}} onClick={() => this.openDevTools(this.webviewRef.current)}>
+            Toggle Devtools
+          </button>
+        </div>
+        <webview
+          ref={this.webviewRef}
+          className={this.props.className}
+          style={{
+            background: '#fff',
+            display: 'inline-flex',
+            width: '100%',
+            height: '100%'
+          }}
+          src={this.props.src}
+        />
+      </div>
+    );
+  }
+}
+
 export default class Term extends React.PureComponent<TermProps> {
   termRef: HTMLElement | null;
   termWrapperRef: HTMLElement | null;
```

ちなみにボタン群にはスタイルシートをほとんど追加していないので、**非常にダサい**。このアプリは以下のように「美しさ」を重視しているようだが、彼らのいう美しさにこのボタンデザインが適うかどうかは一考の余地がある。

> The goal of the project is to create a beautiful and extensible experience for command-line interface users, built on open web standards. In the beginning, our focus will be primarily around speed, stability and the development of the correct API for extension authors.
>
> 公式のREADME.md

最後に作ったコンポーネントを埋め込んで完成。

```diff
@@ -432,20 +517,25 @@ export default class Term extends React.PureComponent<TermProps> {
         style={{padding: this.props.padding}}
         onMouseUp={this.onMouseUp}
       >
-        {this.props.customChildrenBefore}
-        <div ref={this.onTermWrapperRef} className="term_fit term_wrapper" />
-        {this.props.customChildren}
-        {this.props.search ? (
-          <SearchBox
-            search={this.search}
-            next={this.searchNext}
-            prev={this.searchPrevious}
-            close={this.closeSearchBox}
-          />
+        {this.state.url ? (
+          <WebView src={this.state.url} />
         ) : (
-          ''
+          <>
+            {this.props.customChildrenBefore}
+            <div ref={this.onTermWrapperRef} className="term_fit term_wrapper" />
+            {this.props.customChildren}
+            {this.props.search ? (
+              <SearchBox
+                search={this.search}
+                next={this.searchNext}
+                prev={this.searchPrevious}
+                close={this.closeSearchBox}
+              />
+            ) : (
+              ''
+            )}
+          </>
         )}
-
         <style jsx global>{`
           .term_fit {
             display: block;
```

# 使い方

## 脆弱性について

すでに述べた通り、セキュリティ上の理由で削除された機能を復活させたにすぎないので、脆弱性が十分に存在することを理解する必要がある。削除されたのは2018年であるが、この頃はElectron製のアプリでの (`webview`を用いた) 任意コード実行の脆弱性が何度も噂され、何かと騒がしかったようだ。

元の記事の言い分は、`webview`タグがデフォルトでNodeのAPIにアクセスできないようにしているので、ファイルシステムを読み取ったり外部のモジュールを追加したりといったことは起こらないというものである。さらに、自分が何をしているのかを理解しておけば、まだ安全といえるのだという。

私はこの機能が安全だと言い切る自信はない。ただ上記の事情を加味した脆弱性と機能の利便性を天秤にかけた結果使うのであり、それは完全に個人の自己責任であると断っておきたい。

## インストール

気が向いたらインストーラをどこかで配布するかもしれないが、なんせ自己責任の代物なので、コマンド指示を交えたZenスタイルのインストール方法だけ書いておく。

[このリポジトリ](https://github.com/taitohaga/hyper-webview)をクローンして、アプリをビルドする。ビルド方法は同じである。ただし、ブランチは分けてあるので、そちらをfetchする必要がある。

```sh
git clone git@github.com:taitohaga/hyper-webview.git hyper
cd hyper
git fetch origin webview
git checkout webview
# install dependencies
yarn
# start electron demon
yarn run dev
# go to another terminal and start the app
yarn run app
```

問題なくアプリが起動できれば、そのまま`README.md`の指示に従ってアプリを配布用にビルドして、バイナリを好きな場所にインストールする。問題があった場合は………… (逃走)

## 使い方

ターミナルを開いたら、Ctrl + Shift + Dでウィンドウを縦に分割できる。分割したペインで、表示したいURLを打ち込む。すると、URLをクリックできるようになる。

"Toggle Devtools"ボタンから開発者ツールも使用可能である。ウェブ開発をするときなどに必須アイテムだと思われるので、いちおうつけてある。

# まとめ

そういうわけで、ソースコードを弄くって無理やりウェブブラウザをターミナルに埋め込むことに成功した。あくまで私が便利そうだと思うからそのようにしただけであり、真似するならばセキュリティ上の問題は何も改善されていないことに注意するべきである。

特に、ローカルサーバへのアクセスのみに限定するなどして外部からのアクセスを極力断つように心がける。外部のサーバにアクセスするときであってもドキュメントやその他信頼できるウェブサイトに限定したほうがよい。
