# Miyoko

## 概要
受付のミヨコさんはお客さんの顔を覚えます。

## セットアップ
## AWS Resource
1. S3バケット作成(Static Website Hosting)
2. Amazon CloudFront作成
3. Amazon DynamoDB作成
4. Amazon Rekognition作成

顔の取り込みで使用しているWeb APIのMediaDevicesはSecure Contextsでのみ動作するためCloudFrontを利用します

## Application
1. $ npm build
2. publicとbuildの内容をS3にコピー

## Authentication
- Amazon Cognito Identity Pool作成
- GoogleでOIDC
- .envにIDプールとクライアントIDを記述

## TODO
- [ ] セットアップをAWS CloudFormationにする
- [ ] アクセストークンの期限が切れた場合の更新処理
