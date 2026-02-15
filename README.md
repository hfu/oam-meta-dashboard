# OAM Meta Dashboard

## English

A static dashboard displaying OpenAerialMap metadata by region. Choose from Sierra Leone Western Area (28 assets) or Global (1GB+ files). Built with Vite (vanilla JS) and outputs a single HTML file for GitHub Pages.

### Features

- **Multi-region support**: Sierra Leone Western Area or Global (≥1GB files)
- Regional data selector with URL persistence
- Asset cards with title, platform badge, date, provider, resolution, file size, and UUID link
- Responsive grid layout
- Sorting by date and size
- Total size and asset count display
- Build-time snapshots for CORS-free, deterministic loading

### Tech Stack

- Vite (vanilla JS)
- Static build output to `docs/`
- JS/CSS inlined into HTML on build
- Build-time data fetching with pagination support

### Project Structure

```
/
  index.html           Core HTML structure
  main.js              App logic, state, rendering
  style.css            Responsive design
  vite.config.js       Build configuration
  package.json         Dependencies and scripts
  scripts/
    prefetch.mjs       Fetches OAM API, generates data-*.json
  public/
    data-sierra-leone.json    (generated at npm run prefetch)
    data-global-1gb.json      (generated at npm run prefetch)
  docs/
    index.html         (generated at npm run build)
```

### Setup

```bash
npm install
```

### Scripts

**Three distinct workflows:**

#### 1. **Prefetch Data** (explicit, ~2-3 minutes)
```bash
npm run prefetch
```
- Generates `public/data-sierra-leone.json` and `public/data-global-1gb.json`
- Fetches from OpenAerialMap API with pagination
- Shows progress with `x` (< 1GB) and `o` (≥ 1GB) indicators
- **Run this only when you need fresh data**

#### 2. **Development** (fast, uses cached data)
```bash
npm run dev
```
- Starts Vite dev server at `http://localhost:5173/`
- Uses existing `public/data-*.json` files
- **Does NOT re-fetch data** (much faster)
- Supports live reload

#### 3. **Build & Deploy** (for GitHub Pages)
```bash
npm run build
```
- Uses existing `public/data-*.json` files
- Outputs single `docs/index.html`
- Ready for GitHub Pages deployment

### Typical Workflow

```bash
# First time or updating data (takes ~2-3 minutes)
npm run prefetch

# During development (instant)
npm run dev

# When ready to deploy
npm run build
git add -A
git commit -m "Update dashboard"
git push origin main
```

### Deploy (GitHub Pages)

1. Set GitHub Pages source to `docs/` folder on default branch
2. Push to repository
3. Site available at `https://github.com/hfu/oam-meta-dashboard`

### Data Details

- **Sierra Leone**: Western Area bounding box, all assets available (28 items)
- **Global (≥1GB)**: Filters 1GB+ files from entire OpenAerialMap dataset (~150-200 items)
- Data files exclude geometry (bbox/geojson/footprint) to reduce size
- File sizes resolved via `HEAD` request to S3 URLs for accuracy

---

## 日本語

複数地域対応の静的ダッシュボード。Sierra Leone Western Area（28ファイル）またはグローバル（1GB以上）を選択できます。Vite（Vanilla JS）で構築し、GitHub Pages 用に単一 HTML へビルドします。

### 特長

- **複数地域対応**: Sierra Leone Western Area またはグローバル（1GB以上）
- 地域選択ドロップダウン＆URL 保存
- タイトル、Platform バッジ、日付、Provider、解像度、ファイルサイズ、UUID リンク表示
- レスポンシブなグリッド
- 日付/サイズの並び替え
- 合計サイズと件数の表示
- ビルド時スナップショットで CORS 回避

### 技術構成

- Vite（Vanilla JS）
- `docs/` に静的ビルド
- ビルド時に JS/CSS を HTML へインライン
- ページネーション対応のビルド時データ取得

### 構成

```
/
  index.html           HTML 本体
  main.js              App ロジック、状態管理、レンダリング
  style.css            レスポンシブデザイン
  vite.config.js       ビルド設定
  package.json         依存関係とスクリプト
  scripts/
    prefetch.mjs       OAM API 取得、data-*.json 生成
  public/
    data-sierra-leone.json    (npm run prefetch で生成)
    data-global-1gb.json      (npm run prefetch で生成)
  docs/
    index.html         (npm run build で生成)
```

### セットアップ

```bash
npm install
```

### スクリプト

**3つのワークフロー:**

#### 1. **データ取得** (明示的実行、約2-3分)
```bash
npm run prefetch
```
- `public/data-sierra-leone.json` と `public/data-global-1gb.json` を生成
- OpenAerialMap API からページネーション取得
- 進捗を `x` (< 1GB) と `o` (≥ 1GB) で表示
- **データ更新時のみ実行**

#### 2. **開発** (高速、キャッシュデータ使用)
```bash
npm run dev
```
- Vite dev サーバーを `http://localhost:5173/` で起動
- 既存の `public/data-*.json` を使用
- **データを再取得しない** (とても高速)
- ホットリロード対応

#### 3. **ビルド＆公開** (GitHub Pages)
```bash
npm run build
```
- 既存の `public/data-*.json` を使用
- `docs/index.html` を生成
- GitHub Pages デプロイ可能

### 典型的なワークフロー

```bash
# 初回またはデータ更新時 (約2-3分)
npm run prefetch

# 開発中 (瞬時)
npm run dev

# 公開する時
npm run build
git add -A
git commit -m "Update dashboard"
git push origin main
```

### 公開（GitHub Pages）

1. GitHub Pages のソースを `docs/` フォルダ（デフォルトブランチ）に設定
2. リポジトリへ push
3. サイトが利用可能: `https://github.com/hfu/oam-meta-dashboard`

### データ詳細

- **Sierra Leone**: Western Area バウンディングボックス、利用可能な全ファイル（28個）
- **グローバル（≥1GB）**: 全 OAM データセットから 1GB 以上を抽出（約150-200個）
- データファイルはサイズ削減のためジオメトリ（bbox/geojson/footprint）を除外
- ファイルサイズは S3 への `HEAD` リクエストで精密に解決
