---
layout: "../../layouts/BlogPost.astro"
title: "Flaskでお手軽にWebアプリを作る (後編)"
subtitle: ""
pubDate: "2022/5/15"
heroImage: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Flask_logo.svg"
draft: true
---

## 後編？

「Flaskでお手軽にWebアプリを作る」シリーズとしては、この後編をもって
最終回とする。ご贔屓ありがとうございました。

とはいうものの、このページではあくまでFlaskの基本的な使い方を述べるだけで、
本来の目的である「掲示板アプリの完成」には至らない。掲示板アプリの完成は
続編シリーズに委ねるとし、一旦「Flaskでお手軽にWebアプリを作る」は
完結となる。

## 前回のおさらい

前回はようやく開発環境を整えることができた。

作成した雛形のWebアプリをDockerfileを使ってコンテナ化し、その中でアプリを
起動するところまで実現させた。その際、Pythonのライブラリ依存を明確にするために
ホストマシン上でもPython環境を隔離させた。Dockerfileを書き上げたら、ターミナル
から`docker build`を実施し、イメージを構築する。起動する際は`docker run`コマンドを
用いる。

