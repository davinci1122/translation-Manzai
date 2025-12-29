# 翻訳漫才：オカンが忘れた言葉

ミルクボーイ風の漫才形式で翻訳ストラテジーを学べるインタラクティブなブラウザゲームです。

## 機能

- **3段階の難易度**: 初級・中級・上級
- **AIツッコミ**: Gemini APIを使用したミルクボーイ風の返答
- **翻訳ストラテジー分析**: 16種類の翻訳ストラテジーでプレイヤーの表現を分析
- **漫才台本生成**: ゲーム後に完成版の漫才台本を自動生成
- **PDF出力**: 分析結果と台本をPDFとして保存

## セットアップ

### 必要なもの

- Node.js 20以上
- Gemini API Key

### インストール

```bash
npm install
```

### 環境変数

`.env`ファイルを作成:

```
GEMINI_API_KEY=your_gemini_api_key_here
APP_PASSWORD=your_app_password_here
```

### 開発

```bash
# フロントエンド開発サーバー
npm run dev

# バックエンドサーバー（別ターミナルで）
npm run server
```

### ビルド

```bash
npm run build
npm run build:server
```

### 本番環境

```bash
npm run start
```

## デプロイ（Render）

1. GitHubにリポジトリをプッシュ
2. Renderで新しいWeb Serviceを作成
3. GitHubリポジトリを接続
4. 環境変数を設定:
   - `GEMINI_API_KEY`: Gemini APIキー
   - `APP_PASSWORD`: アプリアクセス用パスワード

## 技術スタック

- **フロントエンド**: Vite + TypeScript + Vanilla CSS
- **バックエンド**: Express.js
- **AI**: Google Gemini API
