# OAM Meta Dashboard

## English

A static dashboard that lists OpenAerialMap metadata for the Western Area (Freetown + Waterloo). It is built with Vite (vanilla JS) and outputs a single HTML file for GitHub Pages.

### Features

- Build-time snapshot for deterministic, CORS-free loading
- Asset cards with title, platform badge, date, provider, resolution, file size, and UUID link
- Responsive grid layout
- Sorting by date and size
- Total size and asset count

### Tech Stack

- Vite (vanilla JS)
- Static build output to `docs/`
- JS/CSS inlined into the HTML on build

### Project Structure

```
/
  index.html
  main.js
  style.css
  vite.config.js
  package.json
  scripts/
    prefetch.mjs
  public/
    data.json
  docs/
    index.html
```

### Setup

```bash
npm install
```

### Development

```bash
npm run dev
```

This command runs `scripts/prefetch.mjs` first and writes the snapshot to `public/data.json`.

### Build

```bash
npm run build
```

The build step runs the snapshot prefetch and outputs a fully static site to `docs/`.

### Deploy (GitHub Pages)

- Set the GitHub Pages source to the `docs/` folder on the default branch.
- Push the repository to GitHub.

### Notes

- The snapshot fetch uses the OpenAerialMap API and resolves file sizes via `HEAD` to S3 URLs.
- Re-run `npm run build` whenever you want to refresh the snapshot.

---

## 日本語

OpenAerialMap の Western Area（フリータウン＋ウォータールー）向けメタデータを一覧表示する静的ダッシュボードです。Vite（Vanilla JS）で構築し、GitHub Pages 用に単一 HTML へビルドします。

### 特長

- ビルド時スナップショットで CORS を回避
- タイトル、Platform バッジ、日付、Provider、解像度、ファイルサイズ、UUID リンクをカード表示
- レスポンシブなグリッド
- 日付/サイズの並び替え
- 合計サイズと件数の表示

### 技術構成

- Vite（Vanilla JS）
- `docs/` に静的ビルド
- ビルド時に JS/CSS を HTML へインライン

### 構成

```
/
  index.html
  main.js
  style.css
  vite.config.js
  package.json
  scripts/
    prefetch.mjs
  public/
    data.json
  docs/
    index.html
```

### セットアップ

```bash
npm install
```

### 開発

```bash
npm run dev
```

`npm run dev` 実行時に `scripts/prefetch.mjs` が走り、`public/data.json` を生成します。

### ビルド

```bash
npm run build
```

ビルド前にスナップショットを取得し、`docs/` に静的サイトを出力します。

### 公開（GitHub Pages）

- GitHub Pages のソースをデフォルトブランチの `docs/` に設定してください。
- リポジトリを GitHub へ push します。

### 補足

- スナップショット取得時に OpenAerialMap API を呼び、S3 の `HEAD` で実サイズを解決します。
- スナップショット更新は `npm run build` を再実行してください。
