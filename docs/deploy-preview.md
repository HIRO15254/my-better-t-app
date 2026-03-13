# デプロイガイド（プレビュー環境 + 本番環境）

## 1. 概要

このリポジトリでは、Pull Request ごとに独立したプレビュー環境が自動でデプロイされます。

- **フロントエンド**: Cloudflare Pages（ブランチデプロイ）
- **API サーバー**: Cloudflare Workers（PR 番号付きの個別 Worker）
- **データベース**: Neon ブランチ（メインDBのコピー）

PR がオープンされると環境が自動作成され、マージまたはクローズ時に自動クリーンアップされます。すべて Free プランの範囲で利用可能です。

## 2. 前提条件

- [Cloudflare](https://dash.cloudflare.com/sign-up) アカウント（Free plan OK）
- [Neon](https://console.neon.tech/signup) アカウント（Free plan OK）
- GitHub リポジトリの管理者権限（Secrets 設定に必要）
- [Bun](https://bun.sh/) がローカルにインストール済み

## 3. Neon セットアップ

### 3.1 プロジェクト作成

1. [Neon コンソール](https://console.neon.tech/) にログイン
2. 「New Project」をクリック
3. プロジェクト名（例: `my-better-t-app`）とリージョンを選択して作成

### 3.2 API キー取得

1. 左下の「Account Settings」を開く
2. 「API Keys」ページへ移動
3. 「Generate new API key」をクリック
4. 生成されたキーを安全な場所にコピーしておく（後で GitHub Secrets に設定）

### 3.3 プロジェクト ID の確認

プロジェクトダッシュボードの URL から確認できます。

```
https://console.neon.tech/app/projects/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                        この部分がプロジェクト ID
```

または、ダッシュボードの「Settings」ページにも表示されています。

### 3.4 メインブランチにマイグレーション実行

Neon コンソールの接続情報から `DATABASE_URL` を取得し、マイグレーションを実行します。

```bash
DATABASE_URL="postgresql://user:password@ep-xxxx-xxxx-xxxxxx.region.aws.neon.tech/neondb?sslmode=require" bun run db:migrate
```

> 接続文字列はNeonダッシュボードの「Connection Details」からコピーできます。

## 4. Cloudflare セットアップ

### 4.1 アカウント作成

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/sign-up) でアカウントを作成
2. ログイン後、左サイドバーの「Workers & Pages」を開く

### 4.2 API トークン作成

1. [API トークン画面](https://dash.cloudflare.com/profile/api-tokens) を開く
2. 「Create Token」をクリック
3. 「Custom token」を選択し、以下の権限を付与:
   - **Account** > **Cloudflare Pages** > **Edit**
   - **Account** > **Workers Scripts** > **Edit**
4. トークンを生成し、安全な場所にコピーしておく

### 4.3 Account ID の確認

Cloudflare ダッシュボードで「Workers & Pages」概要ページを開くと、右サイドバーに Account ID が表示されています。

### 4.4 Pages プロジェクト作成

```bash
npx wrangler pages project create my-better-t-app-web
```

> プロジェクト名は `my-better-t-app-web` にしてください。変更する場合は[カスタマイズ](#6-カスタマイズ)を参照。

## 5. GitHub Secrets 設定

リポジトリの **Settings > Secrets and variables > Actions > New repository secret** から以下を追加します。

### 共通（プレビュー・本番両方で使用）

| Secret 名 | 取得元 | 説明 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare ダッシュボード | Workers/Pages 編集権限付きトークン |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare ダッシュボード | Workers & Pages 概要ページの右サイドバー |
| `BETTER_AUTH_SECRET` | 自分で生成 | 認証用シークレット（32文字以上） |

### プレビュー環境用

| Secret 名 | 取得元 | 説明 |
|---|---|---|
| `NEON_PROJECT_ID` | Neon コンソール | プロジェクトダッシュボードの URL または Settings から確認 |
| `NEON_API_KEY` | Neon Account Settings | API Keys ページで生成したキー |

### 本番環境用

| Secret 名 | 取得元 | 説明 |
|---|---|---|
| `PRODUCTION_DATABASE_URL` | Neon コンソール | メインブランチの接続文字列 |
| `PRODUCTION_API_URL` | Cloudflare | 本番 Worker の URL（例: `https://my-better-t-app-api.<subdomain>.workers.dev`） |
| `PRODUCTION_WEB_URL` | Cloudflare | 本番 Pages の URL（例: `https://my-better-t-app-web.pages.dev`） |

`BETTER_AUTH_SECRET` の生成例:

```bash
openssl rand -base64 32
```

> `PRODUCTION_API_URL` / `PRODUCTION_WEB_URL` はカスタムドメインを設定する場合、そのドメインを指定してください。

## 6. カスタマイズ

### Worker 名の変更

`wrangler.toml` の `name` フィールドを変更した場合、以下のファイルも合わせて更新が必要です。

- `.github/workflows/preview-deploy.yml` の `WORKER_NAME` 変数（`my-better-t-app-api-pr-${PR_NUMBER}` の `my-better-t-app-api` 部分）
- `.github/workflows/preview-cleanup.yml` の `--name` 引数（同上）

### Pages プロジェクト名の変更

`preview-deploy.yml` の `PAGES_PROJECT` 変数を変更してください。

```yaml
PAGES_PROJECT="your-custom-project-name"
```

### 本番デプロイ

本番デプロイは `.github/workflows/production-deploy.yml` で自動化されています。master ブランチへの push 時に以下が実行されます:

1. CI（型チェック・lint・テスト）
2. Neon メインブランチへのマイグレーション
3. Worker デプロイ（`wrangler.toml` の `name` をそのまま使用）
4. Pages デプロイ（`main` ブランチ = 本番）

GitHub Secrets の `PRODUCTION_DATABASE_URL`、`PRODUCTION_API_URL`、`PRODUCTION_WEB_URL` を設定すれば動作します。

> `concurrency` 設定により、複数の push が同時に来ても本番デプロイは直列実行されます。

## 7. 動作確認

1. **テスト PR を作成する**

   ```bash
   git checkout -b test/preview-deploy
   echo "# test" >> README.md
   git add README.md
   git commit -m "test: verify preview deployment"
   git push -u origin test/preview-deploy
   ```

   GitHub 上で PR を作成します。

2. **Actions タブでワークフローを確認する**

   リポジトリの「Actions」タブを開き、「Preview Deploy」ワークフローが実行されていることを確認します。以下の順序でジョブが実行されます:
   - `setup` - 変数の設定
   - `neon-branch` - Neon データベースブランチ作成
   - `db-migrate` - マイグレーション実行
   - `deploy-api` - Worker デプロイ + シークレット設定
   - `deploy-web` - Pages デプロイ
   - `comment` - PR にコメント投稿

3. **PR コメントでプレビュー URL を確認する**

   デプロイ完了後、PR に以下のようなコメントが自動投稿されます:

   | Service | URL |
   |---------|-----|
   | Frontend | `https://pr-123.my-better-t-app-web.pages.dev` |
   | API | `https://my-better-t-app-api-pr-123.<account>.workers.dev` |

4. **PR をクローズしてクリーンアップを確認する**

   PR をクローズ（またはマージ）すると「Preview Cleanup」ワークフローが実行され、Worker と Neon ブランチが削除されます。PR コメントも「cleaned up」に更新されます。

## 8. トラブルシューティング

### `CLOUDFLARE_API_TOKEN` 権限不足

```
Error: Authentication error
```

API トークンに以下の権限が付与されているか確認してください:
- Account > Cloudflare Pages > Edit
- Account > Workers Scripts > Edit

### Neon ブランチ作成失敗

```
Error: Could not find project
```

- `NEON_API_KEY` が有効か確認（Account Settings > API Keys で再生成可能）
- `NEON_PROJECT_ID` が正しいか確認（ダッシュボード URL と一致しているか）

### Worker デプロイ失敗

```
Error: compatibility_date is too old
```

`apps/server/wrangler.toml` の `compatibility_date` を最新の日付に更新してください。現在の設定:

```toml
compatibility_date = "2025-01-01"
```

### マイグレーション失敗

```
Error: connection refused
```

- `DATABASE_URL` のフォーマットが正しいか確認:
  ```
  postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
  ```
- Neon ブランチが正常に作成されているか、Neon コンソールで確認

### Pages デプロイ失敗

```
Error: A project with this name does not exist
```

Pages プロジェクト名がワークフローの `PAGES_PROJECT` と一致しているか確認してください。事前に `npx wrangler pages project create my-better-t-app-web` でプロジェクトを作成する必要があります。

## 9. アーキテクチャ

### デプロイの流れ（PR オープン時）

```
PR open/synchronize
  |
  +-> Neon ブランチ作成 (pr-<番号>)
  |     |
  |     +-> マイグレーション実行
  |           |
  |           +-> Worker デプロイ (my-better-t-app-api-pr-<番号>)
  |                 |  - DATABASE_URL, BETTER_AUTH_SECRET をシークレットとして設定
  |                 |  - CORS_ORIGIN, BETTER_AUTH_URL を環境変数として設定
  |                 |
  |                 +-> Pages デプロイ (pr-<番号> ブランチ)
  |                       |  - VITE_SERVER_URL に Worker の URL を設定してビルド
  |                       |
  |                       +-> PR にプレビュー URL をコメント
```

### クリーンアップの流れ（PR クローズ時）

```
PR close/merge
  |
  +-> Worker 削除 (my-better-t-app-api-pr-<番号>)
  +-> Neon ブランチ削除 (pr-<番号>)
  +-> PR コメントを「cleaned up」に更新
```

各プレビュー環境は PR 番号で完全に分離されるため、複数の PR が同時に存在しても競合しません。

### 本番デプロイの流れ（master push 時）

```
push to master
  |
  +-> CI (型チェック, lint, テスト)
        |
        +-> マイグレーション実行 (Neon メインブランチ)
              |
              +-> Worker デプロイ (my-better-t-app-api)
              |     - DATABASE_URL, BETTER_AUTH_SECRET をシークレットとして設定
              |     - CORS_ORIGIN, BETTER_AUTH_URL を環境変数として設定
              |
              +-> Pages デプロイ (main ブランチ = 本番)
                    - VITE_SERVER_URL に本番 Worker の URL を設定してビルド
```

> 本番デプロイは `concurrency` 設定により直列実行されます。CI が失敗した場合、デプロイはスキップされます。
