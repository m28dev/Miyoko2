# Miyoko

## Description
受付のミヨコさんはお客さんの顔を覚えます。

![overview](https://user-images.githubusercontent.com/29790650/37645713-f87e4c5c-2c6a-11e8-877f-13ab60e77b12.png)

## Installation
### AWS Resources
まずAmazon Rekognitionの顔コレクションを作成します。作成後、ARNをコピーしておいてください。

```
$ aws rekognition create-collection --collection-id 'miyoko-test'
```

残りはCloudFormationのテンプレート(template.yaml)から作成できます。RekognitionのARNとGoogleのOAuth2.0 Client IDを用意しておいてください。

CloudFormationスタックの詳細は以下です。

- DynamoDBTable: Rekognitionが返したFaceIdに対する名前と会社名を保存します。
- CognitoIdPool: Google Sign-Inで認証し、AWSリソースに対する一時的なアクセス許可をユーザーへ与えます。
- MiyokoRole: Cognitoで認証されたユーザーに与えられるロールです。
- CognitoAttachedRole: "CognitoIdPool"と"MiyokoRole"を関連付けます。

### Authentication
- Google Sign-Inをセットアップします。（詳細は「Amazon Cognito フェデレーテッドアイデンティティ」のドキュメントを参照してください）
- .envファイルをルートディレクトリに作成し、IDプールとGoogleクライアントIDを記述します。

```
POOL_ID=<POOL_ID>
CLIENT_ID=<GoogleクライアントID>
```

## Usage
```
$ npm start
```

## TODO
- [x] セットアップをAWS CloudFormationにする
- [ ] アクセストークンの期限が切れた場合の更新処理
