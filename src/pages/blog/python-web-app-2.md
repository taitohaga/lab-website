---
layout: "../../layouts/BlogPost.astro"
title: "Flaskでお手軽にWebアプリを作る (中編)"
description: "Dockerわからん"
pubDate: "2022/5/7"
heroImage: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Flask_logo.svg"
---

## 前回のおさらい

[前回の記事](./python-web-app.html) では、PythonのWeb開発事情とFlaskの概要、そしてFlaskで
実際にHello Worldを行ったり、静的ウェブページを表示するところまで実践した。

そもそもWebアプリは、ユーザからのリクエストに応じて動的にHTMLページなどを生成し
て送り返すアプリのことであり（至極当たり前のことだが当たり前でない人もいると思
う）、Webサーバプログラム連携して動作することができる。そしてその連携の方法の一
つがWSGIという仕様であり、PythonのいくつかのWebフレームワークが採用している。こ
のWSGIは「Pythonウェブアプリの標準仕様」としてPEP3333で策定されている。

FlaskはそのWSGI準拠のWebフレームワークのひとつであり、スケーラビリティ、文献など
いくつかのアドバンテージを持つ有名なプロジェクトである。前回の記事では
CGIアプリの実装も残しながらウェブアプリについて力説したが、今後はFlaskを用いた
*手軽でモダンな* Webアプリのみが登場するので安心してもらいたい。

前回の記事の補足だが、Java界隈でもWebアプリとWebサーバの橋渡しとしてJavaサーブ
レットというものが存在しており、まさしくWSGIと立ち位置的に近しい。この分野では多
分Javaのほうが遥かにメジャーだと思う（要出典）ので、ついでに書いておくと有益だ
と思われる。

もう一つ、付け加えたほうが良いことがある。前回、たったこれだけのコードでハロワ
するだけの単純なWebアプリを構築した。

```python
from flask import Flask

app = Flask(__name__)

@app.route("/", methods=["GET"])
def hello():
    return "Hello, World!"
```

```python
from app import app

if __name__ == "__main__":
    app.run()
```

さて、私たちは一体どこで「Webサーバプログラム」を構築・あるいは設定したのだろ
う？　WSGIとかサーバとWebアプリの連携とか言っていたけど、Flaskを`import`して
ちょっとコード書いただけで完成しましたけど？

答えはこのアプリを`python server.py`で起動した時の出力にある。

```
 * Serving Flask app 'app' (lazy loading)
 * Environment: production
   WARNING: This is a development server. Do not use it in a production deployment.
   Use a production WSGI server instead.
 * Debug mode: off
 * Running on http://127.0.0.1:5000 (Press CTRL+C to quit)
```

この内3行目と4行目のWARNINGメッセージがそれを説明している。要するに、この
状態で起動すると、Flask自体に組み込まれた開発・デバッグ用のサーバプログラム
が背後に登場するわけだ。

このサーバプログラムは「開発用」と言う通り、実際にデプロイするときに使用しては
いけない。実用に耐えるサーバ (Apache/mod_python, Nginx, Gunicorn, uWSGI,
etc...) と違い、セキュリティ・性能面において非常に脆い。例えば自動リスタート、
エラー発生時のトラッキング表示はプロダクションサーバに必要ないし、プロキシサー
バやプロセス管理等の機能はデバッグ用サーバプログラムにはたいてい搭載されない。

## 簡易掲示板アプリの概要

### ネタ探し

お手軽に作ろうとしている「何らかのWebアプリ」だが、ここでは簡易掲示板を題材に取る。

なぜ掲示板なのかというと

- 一通りの内容を抑えられる（テンプレート、フォーム、DB）
- その場で作れる
- 作者によって今後工夫しがいがある

これらの理由があると考えている。

また「簡易」というのは、いきなり複雑なものは作れないという予防線であるとともに、

- 画像は貼れない
- テキストのファーマットができない
- XSSに対して盤石でない可能性が高い （ある程度は盤石だが……）

といった意味合いも込めている。

### 機能の決定

私はなんらかの掲示板をゴリゴリに利用していた世代でもないため、ある意味で「なん
ちゃって掲示板」になる可能性が高い。ただまあ、次のような機能を持っていれば掲示
板と呼んでいいんじゃないかと考えている。

- スレッドを立てる
- スレッドに書き込む
- スレッドにタグをつける

ところでスレッドを立てる、スレッドに文を書き込むといった行為は、しばしば匿名で
行うことができる。しかし、既存の大手掲示板を見てみると、書き込みにはそれぞれ書
き込んだクライアントを表すランダム文字列が書き込みとともに併記されているように
みえる。このランダム文字列をIDと呼ぶことにすると、IDはおそらく書き込みを行った
端末（とはいうが、大抵の場合は動的に設定された家庭用ルータがもつ）のIPアドレス
に紐づけて生成されているのだろう。プロキシサーバを介した書き込みやロードバラン
サを導入した構成でなければ、HTTPリクエストヘッダの`Remote-Addr`プロパティで端末
のIPアドレスを一応取得することができる。

よって、次の機能も盛り込むと良さそうだ。

- 書き込みにIPアドレスに対応したIDも加える
- 書き込みにハンドルネームをつけることもできる

一旦、必要な機能は以上の通りとしておく。今後必要な機能を思いつくかもしれない
が、その都度コードを書いたりすればよかろう。適度な手軽さを保っているということ
にして、次から早速プロジェクトのディレクトリを作ってみる。

## 環境を構築する

### 環境を隔離する

私はこのアプリをひとまずWindows上で開発する。そんなとき、特にDS学部生な
ら、すでにマシンにAnacondaがインストールされている場合が多い。UNIX系のプラット
フォームなら、システムに最初からPython2やPython3などが最初から入っている可能性
も高い。これらの既存のシステムの上にウェブアプリを構築してしまうと、これから作
成するアプリの構成がわかりにくくなるだけでなく、既存の環境まで余計な手を加えて
しまって、作業量が増えてしまう可能性がある。

もちろんみんなが常に固定グローバルIPを持ったPCで普段作業していて、ウェブアプリ
を公開するときは自分のPCのポートを開けたりしているというのなら、それで良いのか
もしれないが、普通はウェブアプリを実行するためだけのマシンにデプロイすると思
う。このデプロイされた環境を、私たちのマシンから隔離された「仮想環境」という形
で再現したいわけだ。

Anacondaに含まれるcondaは仮想環境を作成することができるので

```
$ conda create -n bbs python=3.10
```

とすれば、仮想環境を作成して開発を進めることができる（のかな？）。Anacondaが大
好きだという人はこれを使うと良いのかもしれない。

しかしこのシリーズではAnacondaを想定しない。あれはあくまでデータサイエンスや数
値計算に特化したPythonディストリビューションであり、仮想環境の構築は主目的では
ない。UNIX系に最初から組み込まれたPython環境から独立して、データサイエンスや数
値計算を行えるようなPython環境を提供するのが主目的であり、そのためにJupyterが同
梱されていたり、便利なのかよくわからないGUIが提供されているわけである。（個人的
にAnacondaは、データサイエンス以外の用途で遊ぶには非常に使い勝手が悪い………。なの
で私はAnacondaとは別にPython 3.10をインストールしており、手元のPCにPythonが2つ
ある状態となっている。よくわからない人はこういうことをしないようにしよう）

Pythonの実行環境とライブラリを複数使い分ける手法として、pipenvやpyenvやvenvなど
がある。例えばライブラリ開発者は様々な環境でそのライブラリが利用されることを想定し
て、複数のPython実行環境でライブラリのテストを行いたいはずだ。そのような場合、
これらのツールが非常に有用になる。

しかし、私たちがローカルから隔離したいのはPython環境だけではない。掲示板の書き
込みを保持するためのデータベースが少なくとも必要になる。どうせならこれもついで
に隔離したほうがよいだろう。

以上のニーズを踏まえて、このシリーズではDockerを利用することにする。

### Dockerの導入

Dockerでは、「コンテナ」という単位で、アプリケーション本体のみならず、各種ミド
ルウェア（DBMSなど）までひとまとめにしてホストから隔離させた上で実行できる。し
かも従来の仮想マシンと異なり軽量で、起動と終了を比較的素早く行えるという特徴が
ある。

![https://knowledge.sakura.ad.jp/13265/](https://knowledge.sakura.ad.jp/lab/member/2109/images/2018/01/VM_Container-768x437.jpg)

Dockerの利点は何と言っても、ソフトウェアの構成設定だけでなく、OSやミドルウェア
などのサーバ自体の各種設定までをも自動化することにより、作成した環境の再現性を
高めたり、配布を用意に行えるということである。みんなのOSがWindowsだけど私だけ
LinuxやMacだから、開発を実行できないといった問題も、最初からDockerで開発をすす
めていれば、問題をある程度未然に防ぐことができるとされる。

Dockerは以下のリンクからインストールすることができる。それぞれのOSに応じた
Dockerが手に入るのでぜひ利用しよう。

[https://www.docker.com/get-started/](https://www.docker.com/get-started/)

さてWindows PCにDockerを導入したら、WSLを有効化するとよい。Dockerはもともと
Linuxの仮想化技術を用いたシステムであり、**そもそもLinuxでしか使えない。**
Windows版Docker (Docker Desktop) はWindowsの仮想化システム (Hyper-V)を用いて
Linuxカーネルを実行するのだが、WSL版のDockerはMicrosoftが提供している（WSL向け
にカスタマイズされた）Linuxカーネルを利用する。Windows Home版ではこのWSL版
Dockerしか使うことができないが、実際問題としてこのWSL版のほうがよく使われている
ようである。

私もWSLでDockerを動かす方を推奨したい。WSLを有効にするには[Microsoftの公式ドキュメント](https://docs.microsoft.com/ja-jp/windows/wsl/install)
の通りにコマンドを実行すればよいが、要するに次のコマンドを
Powershellで実行すればよいようだ。（管理者権限が必要）

```
PS > wsl --install
```

これによりUbuntuが勝手にインストールされてしまうが、別にUbuntuがなければDocker
を動かせないわけではない。Ubuntuを入れずにWSLの機能を有効にするだけなら、
[このページ](https://kb.seeck.jp/archives/8788)を参考にすれば良い。

書いてある作業をざっくり言うと、Powershellを管理者権限で起動し、次のコマンド
を使う。

```
PS > Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```

無事にDockerを導入できたら、次のようなコマンドを入力して確認してみよう。

```
$ docker --version
```

## 作成に取り掛かる

ようやくアプリの作成に取りかかれるぞ！

Dockerによる環境構築とかいろいろ書いたけど、ここでは雛形レベルの完成度の段階か
らDockerコンテナ化するという戦略で行く。なのでいきなりDockerfile（後述）を書く
のではなく、先にPythonソースコードなどアプリの中身を先に用意していきたい。

### ボイラープレート

今後のディレクトリ操作などはすべてPowershellやcmdといったターミナルを前提とする
（これまでもそうだったけど）。まずはプロジェクトのディレクトリを作成しよう。

```
$ mkdir bbs
$ cd bbs
```

これまで、ほとんどのコマンドは`$`を行頭において説明してきた。もちろん、実際に手
元でコマンドを打つときは、この`$`を入力する必要はない。じゃあなぜ書いているのか
というと、Linux的な慣習で非特権ユーザでコマンドを実行するときはこの`$`でそのこ
とを明示しているに過ぎない。逆に特権ユーザのときは`#`がよく使われる。

次は、アプリ本体のディレクトリを用意しよう。ひとまず次のような形になるように
ディレクトリを構成する。

```
bbs
|- bbs/
    |  __init__.py
|  server.py
```

新たに作成したのは`bbs/__init__.py`と`server.py`になる。

`server.py`はアプリ本体を起動するためのスクリプトであり、アプリのエントリーポイ
ントは`bbs/__init__.py`とする。この`bbs/__init__.py`というソースファイルは、
`server.py`内で以下を実行したときに最初に実行されるファイルである。

```python
import bbs
```

つまり、`__init__.py`という名前のファイルを含むディレクトリは、Pythonにとって
「ひとかたまりのモジュール」と認識される。例えば、`bbs/test.py`というソース
ファイルを新たに作成し、以下のような内容を含んで保存する。

```
value = 10
```

そして、`bbs/__init__.py`に以下のように書き込む。

```python
from .test import value as VALUE
```

`server.py`内で以下のように書くと、まるで`bbs`というオブジェクトの中に
`VALUE`が含まれているかのように`import`することができる。

```python
from bbs import VALUE

print(VALUE)
```

このように`__init__.py`はディレクトリに保管された複数の`.py`ファイル
を取りまとめて**名前空間を管理して外部に公開する**機能を持っている。

`bbs/test.py`は今後必要ないので削除して、早速`bbs/__init__.py`の
中身を書いていこう。もちろん先程の`import`文も必要ない。

```python
from flask import Flask

app = Flask(__name__)

@app.route("/", methods=["GET"])
def index():
    return "ようこそ掲示板へ"

```

前回の記事でも書いたように、アプリを起動するスクリプトを`server.py`に書く。

```python
from bbs import app

if __name__ == "__main__":
    app.run()
```

前回の記事でFlaskをインストールしていれば、「ようこそ掲示板へ」を表示するだけのアプリが起動する。

```
$ python server.py
```

### Containerize!

この段階でそろそろアプリをコンテナ化しようと思う。

Dockerコンテナの構築方法として、一旦次のような発想で考えてみることとする。

1. ベースとなるイメージを決める
2. ソースコード、依存関係などを導入する
3. `python server.py`などプロセスを開始するためのコマンドを実行する

以上の3ステップでコンテナが起動する。「イメージ」というのはコンテナをビルドした
ときに出来上がるアプリ本体及び依存関係やOSといったそれ単体で動かせるものを指
す。私たちが「コンテナ化する」というときは、すでに存在しているイメージを流用し
て、その上に独自の環境を構築していく。

「ベース」というのは、例えばUbuntuがインストールされた`ubuntu:20.04`というベー
スイメージがある。もしくは`node:latest`という、Alpine Linuxの上に最新版のNode.js
がインストールされたベースイメージがある。

何を選んでも良いわけではなく、基本的に必要のないパッケージやライブラリが含まれ
ないものを選ぶ必要がある。ここでは`python:3.10-alpine`を選んでみよう。これは
Alpine LinuxにPython 3.10がインストールされたベースイメージであり、とても軽量で
あるとされている。

手始めに、アプリのコンテナを構築するのに必要なパッケージを`requirements.txt`と
いうファイルに書き出してみよう。今のところはFlaskだけでよいので一行しかない。

```
Flask
```

`requirements.txt`にはこのように、パッケージの名前を一行ずつ記すことができる。
これがなんの役に立つのかというと、次のようなコマンドを実行すれば複数のパッケー
ジをすぐに導入することができる。

```
pip install -r requirements.txt
```

次に、Dockerfileを作成する。Dockerfileはイメージの構築方法をコマンド形式で記述
したものである。とりあえず次のように書いておこう。有識者からすればこのままだと
少々問題があるが、それについては後から改善していくことにする。

```
FROM python:3.10-alpine
WORKDIR /usr/app
COPY . .
RUN pip install -r requirements.txt
ENV FLASK_APP=server.py
ENV FLASK_ENV=development
CMD ["flask", "run", "--host", "0.0.0.0"]
```

一行目は文字通りPython 3.10のベースイメージを取得し、そこから私たちの好みの環境
を作り上げて行くことを明示している。

`WORKDIR`は、イメージ構築する上での作業ディレクトリを指定する。存在しなければ新
しく作られる。`COPY`はローカルマシンにあるファイルやディレクトリをイメージ内に
コピーするための命令で、最初の`.`はビルドしたディレクトリにあるすべてのサブディ
レクトリ、フォルダを表している。二つ目の`.`は今いるディレクトリを意味している。

`RUN`はコンテナ内部でコマンドを実行する。`requirements.txt`にあるパッケージをイ
ンストールする。`ENV`はイメージ内部に環境変数を設定する。`FLASK_APP`という環境
変数は、Flaskがアプリの起点として認識するファイル名として使用される。
`FLASK_ENV`はアプリを開発モードか製品モードで起動するかを指定する。
`development`を代入すると開発モードで起動し、ソースを変更するたびにFlaskが勝手
に再起動するようになる。

`CMD`は、コンテナを起動する際に実行するコマンドを指定する。ここではFlaskのアプ
リを開始させたいので`flask run`を指定している。引数で`--host`を渡すのは、
Flask（を含むほとんどのWebフレームワーク）がデフォルトでlocalhost (127.0.0.1)
しか通信を聞こうとせず、隔離されたホストマシンからのアクセスを拒否してしまうか
らである。0.0.0.0を指定すれば自身を含む同一ネットワーク内のすべてのマシンで
通信を聞くことができる。

### 実行する

これでコンテナを実行してイメージをビルドすることで、独立した環境でこの原始的な
Webアプリを実行することができるようになった。Dockerfileを保存したら、ターミナルで
次のコマンドを実行して、Dockerfileからイメージをビルドする。

```
$ docker build -t bbs-app .
```

`-t`は作成したイメージにタグを付けるためのオプションである。わかり易い名前をつ
けよう。

イメージビルドしたら、次のコマンドでコンテナを立ち上げよう。

```
$ docker run -d -p 5000:5000 --name bbs-app bbs-app
```

このとき`-p`フラグが重要になる。見ての通りだが、ホスト側の5000番ポートを起動し
たコンテナの5000番ポートにマッピングする。この指定がないとホスト側はコンテナに
アクセスするすべがなくなってしまう。

`--name`は起動しているコンテナに名前を付与する。わかり易い名前を付けるとあとあ
と便利だ。そして最後に起動したいコンテナのタグ名を指定する。

`-d`はコンテナ起動をバックグラウンドで実行するように指定するもので、別になくて
も構わない。

起動しているかどうかは

```
$ docker ps
```

で確認することができる。

### 準備完了？

ひとまず雛形レベルのアプリを作り、Dockerfileを構成し、イメージビルドしてコンテ
ナを実行することができた。いよいよ掲示板アプリ本体を作っていこうと言いたいとこ
ろだが、先程作ったDockerfileにもうひと工夫してから、本格的な開発に移りたい。

現時点のDockerfileを見直してみる。

```
FROM python:3.10-alpine
WORKDIR /usr/app
COPY . .
RUN pip install -r requirements.txt
ENV FLASK_APP=server.py
ENV FLASK_ENV=development
CMD ["flask", "run", "--host", "0.0.0.0"]
```

ここで、Dockerfileの命令文をそれぞれ「レイヤー」と呼ぶ。

Dockerにはデータをキャッシュする機能があり、すでに作ったレイヤーは再利用する仕
組みがある。キャッシュにないイメージをビルドする必要がある場合に処理を行うわけ
だが、このDockerfileの3行目で僅かな変更が加えられたソースファイルをコピーしなけ
ればならないため、イメージの再ビルドが必要になる。よってその後の`pip install`も
実行しなければならなくなる。

これを回避するために、次のように書き換えることはとても良い選択肢だ。

```
FROM python:3.10-alpine
WORKDIR /usr/app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
ENV FLASK_APP=server.py
ENV FLASK_ENV=development
CMD ["flask", "run", "--host", "0.0.0.0"]
```

次に手元のPython環境の仮想化を考える。現状のように手元で`requirements.txt`に書き
加えても動作するが、実際に`pip install flask`を実行した際にはいくつかの依存ライ
ブラリが一緒に導入される。また今後複数のライブラリを導入することを考えると、手
元にある依存ライブラリのリストとコンテナ内で導入されている依存ライブラリリスト
が一致していないのは後々不都合になる。

そのために、ここではvenvを導入する。

```
$ python -m venv venv
$ .\venv\Scripts\activate
```

2行目の命令で仮想環境を有効化する。もしLinuxなら、`source [newenvname]/bin/activate`
で有効化する。

さて、有効化した仮想環境の中で改めてFlaskをインストールする。

```
(venv) $ pip install flask
```

`pip freeze`してみると、Flaskが必要とするライブラリだけでなくそのバージョ
ンまでもしっかりと記録されていることがわかる。

```
click==8.1.3
colorama==0.4.4
Flask==2.1.2
itsdangerous==2.1.2
Jinja2==3.1.2
MarkupSafe==2.1.1
Werkzeug==2.1.2
```

これを`requirements.txt`に記すのだが、`pip freeze > requirements.txt`で完了す
る。

Dockerfileを工夫してやったことで、このように2回目以降のビルドでは
（requirements.txtを変更することがない限り）キャッシュされたイメージを
用いてビルドを短縮するようになった。

![変更前](/lab/member/2109/images/docker-notcaching.png)

![変更後](/lab/member/2109/images/docker-caching.png)

## To Be Continued

ひとまず雛形レベルのWebアプリをコンテナ化して起動するところまで進めることができ
た。Dockerコンテナの構築については今後もまだ変更することがある（バインドマウン
トとかデータベースとか）が、面倒くさいので先送りにしたい。

次回からはようやくアプリ本体について考えていく……と言いたいところだが、今度は
Flaskにおけるアプリ開発について触れていくことになる。少なくとも今回よりかはアプ
リ開発寄りな話になるはず。

