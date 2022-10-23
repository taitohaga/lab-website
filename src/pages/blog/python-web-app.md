---
layout: "../../layouts/BlogPost.astro"
title: "Flaskでお手軽にWebアプリを作る (前編)"
description: "PHPもいいと思います"
pubDate: "2022/5/5"
heroImage: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Flask_logo.svg"
---

## 導入

別に私はWebアプリ開発者やWeb系エンジニアを目指していたわけでもない。ものづくり
は好きだが、どうしてもHTMLやCSSが個人的に好きではないし、JavaScriptは世界一恐ろ
しい言語だと思っている（個人の感想です）。

そんな私でもPythonでならWebアプリを開発してイケイケエンジニア（？）を名乗れるの
ではないかという気がして、少しずつ手を出してみることにした。現実問題として
Pythonがこの分野で用いられることは決して多くないことは何となく認識している
（Node.jsとかRuby on RailsとかPHPとかそのあたりでしょ、多分）。だが、Pythonで
やってみるのも悪くないと思う。

Pythonもそれなりに恐ろしい言語だと思うけどね……

## PythonのWeb開発

### わたしたちが作りたいモノの実態

この記事の目的はPythonでWeb開発を行う方法についての個人的な備忘録である。

ブログ、掲示板、ポートフォリオといった数々の小規模なウェブサイトは、どのように
して作成しようか、というのがこの記事の示したい目的である。主なターゲットは弊学
弊学部の学生とし、特にこのような領域に興味関心のある方たちに読んでいただくこと
を想定する。

さて、この川井ゼミは「Web技術の習得」と題してHTMLについて手ほどきを受ける（少な
くとも2期生から4期生はそのようである）。皆さんご存知のように、次のようなテンプ
レートをもとにウェブページを記述していくのだろう。

```html
<!DOCTYPE html>
<html lang="ja">
    <head>
        <meta charset="utf-8">
        <title>ウェブサイト</title>
    </head>
    <body>
        <h1>ようこそ</h1>
        <a href="./portfolio.html">About Me</a>
    </body>
</html>
```

このテキストファイルをApache HTTP Server（nginxかもしれない）が適切に設定された
マシンの適切なディレクトリ（「公開フォルダ」？）に配置するのだろう。マシンはリ
クエストを受け取って、内容を解析して、結果としてこのテキストファイルを始めとし
た各種静的ファイルをレスポンスの本体に含めて送り返す。もちろん、このようなマシ
ンを「サーバ」と呼んでいる。

大雑把にいえば、最も原始的なウェブサイトはこのような仕組みなのだろう。自己紹介
やこの個人ブログのように、人や時間によって見せる内容を変える必要がなければ、こ
の仕組みで十分である。時間によって見せる内容を変えたくても、その都度中身のテキ
ストファイルを手元でいじればよいのだ。

しかし、相手によって見せる内容を変えたいなら、この方式だと実現できない。もしくは、
掲示板サイトのように、ユーザのリクエストによってどんどん情報が増えていく場合も、
このやり方だと非常に困る。

そこで、サーバ側の処理を少し複雑にする。例えば、受け取ったリクエストの内容に応
じてローカルディレクトリにあるテキストファイルを変更してから、レスポンスの本体
に含めることができる。あるいは、受け取ったリクエストの内容を、サーバ側でどこかに
保持しておくこともできる。こういった処理を行って、ユーザに何らかのアプリケーションを
提供するのである。これらの処理はいわゆるWebの技術（HTML、リクエスト/レスポンス）を
用いて行うので、Webアプリなどと呼んだりするわけだ、と私は理解している。

### Pythonを用いたWebサーバ

「リクエストがあったら、配置された静的HTMLファイルをレスポンスの本体に含めて送
り返す」という処理は、Pythonの標準ライブラリを用いて簡単に実装することができる。

```python
import http.server

# リクエストハンドラ
class Handler(http.server.CGIHTTPRequestHandler):
    def do_GET(self):
        # メッセージ本体
        text = ""
        with open("index.html", encoding="utf-8") as f:
            text = f.read()
        text += "\n"
        text = text.encode("utf-8")
        # レスポンスヘッダー
        self.send_response(200)
        self.send_header("Content-Length", str(len(text)))
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        # ストリームに送り返す
        self.wfile.write(text)
        self.wfile.flush()


if __name__ == "__main__":
    # サーバを起動
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 5000), Handler)
    server.serve_forever()
```

実に簡単だ。17行あるコードを見て簡単だと思うかは人それぞれかもしれないが、C言語
でゼロから書いたときと比べて遥かに多くのことを、この17行のソースコードは裏で実
行している。

結局やりたいことは、リクエストを受け取ったら、

1. リクエストの内容を見る
2. 静的HTMLファイルを読み込む
3. レスポンスをサーバ側で作成する
4. 送り返す

これだけにすぎない。使用されている関数の名称などから、どこで何をしているかはす
ぐに分かると思う。

### Get into Frameworks

さて、このような処理を行いながら、最終的には掲示板やブログサイトが構築できる、やったー！
と言いたいところだが、2つほど問題点がある。

一つは、自分でHTTPリクエストを処理、レスポンスを作成するという処理を
**自前で実装しなければならない**ということ。勉強のために一度やってみてもよいが、
ここではそれをしないでおきたい。やらなくてもとりあえずWebアプリは作れるし、みん
なあんまり興味がないと思うからだ。（注: 上の例だとHTTPサーバのモジュールを呼び
出してやっているため、リクエストヘッダのKey-Value設定をメソッドで一行で済ませて
いるが、普通はTCPモジュールを用いてHTTPリクエスト、レスポンス処理の実装を「勉強
のために」一度やってみるのである。多分。）

もう一つの問題点は、**オレオレ実装はなんだかんだ危険**だということ。自分で実装
したHTTPハンドラを用いて、独自のWebアプリを開発する……なんて素晴らしい立派な開発
なんだろうと思われるが、HTTPの仕様を勉強しながら初めて実装する人が苦労して構築
したそれには、確実になんらかのバグ、脆弱性、致命的な欠陥が潜んでいる。余計な回
り道をしないためにも、まずはWebアプリを作れる**便利なフレームワークを使うべきだ。**

誤解しないでほしいのだが、個人的な用途、クラッキングされても問題ないような作品、
テスト用といった事情があるのなら、オレオレ実装は大歓迎だと考えている。だが、
あまりそういった状況になってほしくないというのなら、まずは既存の製品の力を借りることを
おすすめする。昨今ではOSSが普及してきて、金や法人の力を使うことなく、比較的信頼性の
高い既存の便利な製品を用いることができるので、できればそちらを使おう、というわけだ。

## Flaskの概要

### Flaskの利点？

以上、時間と安全性の観点からフレームワークを用いた開発をとりあえず勧めてみたわ
けだが、Python + Web開発というフレームワークだと、世の中にいくつか種類がある。

Flaskは、そのようなフレームワークのうちの一つだ。私自身がFlask以外のフレーム
ワークを知らないので建設的なFlaskの紹介は他の記事等に譲りたいが、私が勝手に思っ
ている利点をあげると、

- スケーラビリティが高い: 小規模なものから大規模なものまで作れる
- 普及している: Djangoと並ぶ普及度だと思う
- 文献が豊富: 公式ドキュメントやStack Overflow、このページみたいな怪しい個人ブログなど文献が多数

このようになる。テキトーに書いたのでこの辺はあまり参考にしないでほしい。「いい
からFlaskを使うぞ」というスタイルで行く。もしDjangoがいいと思うならDjangoを使え
ばいいし、PythonじゃなくてJavaScriptがいいと思うならNode.jsでも使えばいい。

### Common Gateway Interface

さて、PythonのWebフレームワークであるところのFlaskだが、簡単に言うと、その実態
は先程実装したような簡易HTTPサーバを拡張して、ルーティング、データベースとの連
携、HTMLの生成といった一連の処理をより作りやすくするための機能群である。

若干話を戻して、再びWebアプリについて焦点を当てたい。先程実装したこの簡易HTTP
サーバだが、ソースファイルを`server.py`という名前で保存したとすると、次のような
コマンドでWebサーバを立てることができる。

```
$ python server.py
```

実行して、ブラウザから http://127.0.0.1:5000/ にアクセスしてみよう。index.html
に書き込んだ内容がブラウザを通じてウェブページとして表示される。ブラウザから
http://127.0.0.1:5000/ にアクセスするとき、ブラウザは裏でHTTPリクエスト（と呼ば
れるテキスト）を生成して、作成したPythonのWebサーバに送信するのだが、このリクエ
ストは`Handler`オブジェクトやその中の`do_GET()`メソッドに直接送り込まれるのでは
ない。HTTPリクエストはまず最初にSimple HTTP Serverという、`ThreadingHTTPServer`
が内部で実装しているWebサーバプログラムに渡される。この内部で実装しているWeb
サーバプログラムは、何らかのやり方で私たちが書いた`Handler`オブジェクトにリクエ
ストの内容を渡して、レスポンスを獲得する必要がある。Common Gateway Interface
(CGI)はそれを実現するためのやり方（仕様）の一つである。

CGIでは、標準入出力を用いてWebサーバプログラムと外部のWebアプリケーションを連携
するためのやり方を策定している。`CGIHTTPRequestHandler`モジュールは、CGIにもと
づいたアプリケーションを作成するための簡易なシステムであり、CGIにもとづいたアプ
リケーションのことはCGIアプリケーションと単純に呼ばれる。

このCGIという仕様だが、リクエストのたびに外部のプログラムを呼び出さなければなら
ないので、システムに大きな負荷をかけてしまいがちであった。そこでWebサーバプログ
ラムがインタプリタを常時起動させておくことで、負荷の軽減を試みる仕組みが考案さ
れた。mod_phpはその例であり、WebサーバがPHPのエンジンを統合することで、HTMLペー
ジの動的生成を可能としているのである。

### Web Server Gateway Interface

ここでPython界隈に焦点を移動させる。Webアプリケーションを作成するための言語とし
てPythonを使おうとする人々も当然存在し、その流れで「Webフレームワーク」を作る
人々も存在した。だがここで一つ問題があり、フレームワークによって対応するWebサー
バプログラムや異なったり、逆にWebサーバプログラムによって対応するフレームワーク
が異なるという事態が発生した。

このような問題を解決するために、Pythonで書かれたWebアプリケーションとWebサーバ
プログラムの連携の仕組みを取り決めた。それがWeb Server Gateway Interface (WSGI)
である。

WSGIはPEP3333で定義されており、WSGIアプリケーションはApache (mod_wsgiや
mod_Python)でも動かすことができる。uWSGIはWSGIアプリケーションをサポートする実
用的なWebサーバプログラムである。またGunicornはUNIX系環境で動作するPythonで書か
れたWebサーバプログラムであり、ワーカー数の設定やプロセス管理などの機能を備えて
いる。

WSGIをサポートするWebサーバプログラムはPythonの標準ライブラリにも含まれている。
`wsgiref`はそのようなモジュールであり、文字通りWSGIのリファレンス実装である。
`wsgiref`を用いて、先程のCGIアプリを実装し直すと、次のようになる。

```python
from wsgiref import simple_server

def application(environ, start_response):
    print(environ)
    print(start_response)
    text = ""
    with open("index.html", encoding="utf-8") as f:
        text = f.read()
    text += "\n"
    text = text.encode("utf-8")
    status = "200 OK"
    headers = [("Content-Length", str(len(text))),
            ("Content-Type", "text/html; charset=utf-8")]
    start_response(status, headers)
    return [text]


if __name__ == "__main__":
    with simple_server.make_server("127.0.0.1", 5000, application) as httpd:
        print("Serving on port 5000...")
        httpd.serve_forever()
```

WSGIに従ったWebアプリは、callableオブジェクトをアプリの本体とする。callableとい
うのは、`def`文で定義されるメソッドやLambda式、その他`__call__`属性を持つオブ
ジェクトなどが該当する。

`application`メソッドは、環境変数を参照するための`environ`とレスポンスを送り返
すための`start_response`というcallableオブジェクトを受け取る必要がある。

レスポンスの本体（殆どの場合HTML形式のウェブページ）を作成したら、
start_responseを呼び出してステータスコードとヘッダー情報を送り、iterableオブ
ジェクトとしてレスポンスの本体をreturnなどする。CGIでは様々なプログラミング言語
で利用するために標準入出力を使ったが、WSGIではメモリ上のPythonオブジェクトを介
してやり取りを行う。

長くなったが、FlaskはこのWSGIのもとに構築されたフレームワークであると
言うことができる。

## Getting Started

さて、これからなにかウェブアプリを作ろう。まずは仮想環境を立ててデータベースを
設定して……ってやっていきたいところだが、私たちはいきなり成果物に取り掛かるので
なく、まず「PythonあるいはFlaskを用いたウェブアプリの開発ってこんな感じになるん
だなあ」というイメージをつかもうと思う。WSGIとかCGIとかの話は一旦忘れても構わな
い（某企業のインターンで「最近の若い子は、サーバから立てたりはしないのかな。
Apacheとか、知らないのかな（要約）」と盛大に煽られた私みたいになりたくなけれ
ば、ちゃんと覚えておいた方がいい）。ともかく、最初に述べた「わたしたちが作りた
いモノの実態」の内容だけは頭に入れたまま、Flaskに入門するとしよう。

### Flaskのインストール

仮想環境とかデータベースとかすっ飛ばしたとしても、Flask自体を入手しなければ話にならない。

```
$ pip install flask
```

特に難しいことはないと思うので、次に行こう。

### Hello World

Flaskの公式サイトにあるGetting Startedは、非常に良いHello Worldを提供しているので、
それを見ても良いが、私も改めてHello Worldを提示してみよう。ターミナルで次のような
コマンドを実行して、最初のFlaskアプリを作成する。

```
mkdir flask-hello-world
cd flask-hello-world
touch app.py
```

作成したソースファイル`app.py`をお好みのテキストエディタで開き、次のように書き込んで保存する。

```python
from flask import Flask

app = Flask(__name__)

@app.route("/", methods=["GET"])
def hello():
    return "Hello, World!"
    
```

もう一つ、`server.py`というソースファイルも作成する。これはアプリケーション本体
である`app.py`の`app`オブジェクトを起動するためのスクリプトである。

```python
from app import app

if __name__ == "__main__":
    app.run()

```

以上、2つのファイルを作成した。ディレクトリ構成はこのようになっているはず。

- flask-hello-world
    - app.py
    - server.py

そしたら`flask-hello-world/`で、次のようにウェブアプリを起動させよう。

```
$ python server.py
```

すると、だいたいこんな感じのメッセージが表示される。

```
 * Serving Flask app 'app' (lazy loading)
 * Environment: production
   WARNING: This is a development server. Do not use it in a production deployment.
   Use a production WSGI server instead.
 * Debug mode: off
 * Running on http://127.0.0.1:5000 (Press CTRL+C to quit)
```

コンソールにはこれ以降何も表示されず、ちゃんと動作しているのか不安になるかもし
れないが、ブラウザを立ち上げて http://127.0.0.1:5000 にアクセスしてみよう。

![お決まりのメッセージ](/lab/member/2109/images/flask-hello-world.png)

これでチュートリアルは完了だ！

何をしているのかを詳細に見てみると、

1. Flaskモジュールをインポート
2. Flaskオブジェクトを作成
3. パスとメソッドを対応付ける
4. メソッド内に処理を書く

これだけである。

次にFlaskを用いて、先程まで実装例としてきたCGIアプリやWSGIアプリを再実装してみよう。

`app.py`を次のように書き換える。

```python
from flask import Flask

app = Flask(__name__)

@app.route("/", methods=["GET"])
def index():
    text = ""
    with open("./index.html", encoding="utf-8") as f:
        text = f.read()
    return text
```

`/`に対応付けられたメソッドの中身を書き換えて、`index.html`を読み込んでそのまま
送り返すようにしただけである。ヘッダー設定などはFlask側が親切丁寧にやってくれる
ため、私たちはファイルを読み込んでそれをそっくりそのまま返すという処理を書くだ
けで良い。

## To Be Continued...

記事一つで完結するつもりが、周辺知識も一緒に載せたせいで長くなってしまったの
で、分割して書いていくことにする。次回はなんらかのWebアプリをローカルでとりあえ
ず動かすところまでやりたい。

[次回の記事](./python-web-app-2.html)
