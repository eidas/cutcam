# CutCam

背景除去したキャラ画像をカメラ映像に合成して写真を撮るモバイルアプリです。AI による背景除去からアルファ編集、カメラ合成・撮影までを、すべて端末上（オフライン）で完結させることを目指しています。

> **開発状況: 開発初期（プロトタイプ以前）**
> 画面遷移の骨組みと ONNX の前後処理までは実装済みですが、アプリとして通して動く状態ではありません。詳細は[開発状況](#開発状況)を参照してください。

## 目標とする機能

| 機能 | 内容 | 状況 |
|---|---|---|
| 背景除去 | ONNX Runtime による on-device AI 推論で画像の背景を自動除去 | 一部実装（画像のデコード/エンコードが未実装のため実行するとエラー） |
| アルファ編集 | ブラシツールでアルファチャンネルをピクセル単位で微調整 | 未実装（ブラシ設定の UI のみ） |
| カメラ合成 | 編集済みの切り抜き画像をリアルタイムカメラ映像に重ねて撮影 | 未実装（プレースホルダーのみ） |
| 完全オフライン | 初回のモデルダウンロード以降はネットワーク不要 | 設計方針 |

## 開発状況

実装済み:

- 画面遷移（Home → Clipper → AlphaEditor → Compositor）
- モデルのダウンロード・キャッシュ・リトライ（`ModelManager`）
- ONNX 推論セッションの作成と、前処理・後処理（`BackgroundRemover`、`preprocess`、`postprocess`）
- 画像選択と、元画像 / 処理結果の切り替え表示（Clipper 画面）
- ブラシサイズ・アルファ値の選択 UI（`BrushControls`）
- ステップ間の画像 URI 管理（Zustand の `ImageStore`）
- ユニットテスト（36 件）

未実装・未検証:

- 画像のデコード・エンコード（`BackgroundRemover.decodeImage` / `encodeImage` がスタブ）。このため Clipper 画面の「Remove Background」はエラーになります
- Skia によるアルファ編集キャンバス、Undo / Redo
- VisionCamera によるカメラ表示、リアルタイム合成、撮影、カメラロールへの保存
- モデルの取得元 URL・サイズ・入出力仕様の検証（ダウンロードサイズは UI では約 80 MB、`design.md` では約 320 MB と記載が食い違っています）
- iOS / Android 実機でのビルドと動作確認、推論性能の計測

タスクごとの進捗は [tasks.md](tasks.md) にあります。

## 技術スタック

| カテゴリ | ライブラリ |
|---|---|
| フレームワーク | React Native + Expo |
| AI 推論 | ONNX Runtime (CoreML / NNAPI) |
| 2D 描画 | @shopify/react-native-skia |
| カメラ | react-native-vision-camera |
| 画像選択 | expo-image-picker |
| ファイル | expo-file-system |
| ナビゲーション | React Navigation |
| 状態管理 | Zustand |

## 必要環境

- Node.js 20.19.4 以上（React Native 0.83 の要件）
- pnpm
- iOS: Xcode + CocoaPods
- Android: Android Studio + NDK

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/eidas/cutcam.git
cd cutcam

# 依存パッケージをインストール
pnpm install

# ネイティブプロジェクトを生成
pnpm exec expo prebuild
```

`android/` と `ios/` は Git 管理外です。

### iOS

```bash
# CocoaPods をインストール（初回のみ）
cd ios && pod install && cd ..

# 実行
pnpm ios
```

### Android

```bash
pnpm android
```

> iOS / Android の実機ビルドはまだ確認できていません。

## 使い方

想定している操作の流れです。現時点で実装済みなのは 1 と 2 までです（1 はモデルの取得元 URL が未検証で、実機でも試していません）。3 以降は上記の未実装部分が完成するまで動きません。

1. **モデルのダウンロード** — アプリ起動後、ホーム画面で AI モデルをダウンロードします（初回のみ）
2. **画像を選択** — フォトライブラリから背景を除去したい画像を選びます
3. **背景除去** — AI が自動で背景を除去します
4. **アルファ編集** — 必要に応じてブラシツールで切り抜きの境界を微調整します
5. **カメラ合成・撮影** — カメラを起動し、切り抜き画像をリアルタイムで重ねて写真を撮影します

## 開発

```bash
# 開発サーバーを起動
pnpm start

# テストを実行
pnpm test
```

テストは `preprocess` / `postprocess` / `ImageStore` / `imageUtils` / `tensorUtils` の単体テストです。全体で 200 秒ほどかかります（1024×1024 の画素ループが重いため）。ONNX 推論、`ModelManager`、各画面のテストはありません。

## プロジェクト構成

```
src/
├── screens/          # 画面コンポーネント (Home / Clipper / AlphaEditor / Compositor)
├── services/         # ビジネスロジック (ModelManager / BackgroundRemover / ImageStore)
│   └── onnx/         # ONNX 推論パイプライン (前処理・後処理)
├── components/       # 共通 UI コンポーネント
├── navigation/       # ナビゲーション定義
├── utils/            # ユーティリティ関数
└── __tests__/        # ユニットテスト
```

## ドキュメント

| ファイル | 内容 |
|---|---|
| [design.md](design.md) | 設計書（案A: React Native + ONNX Runtime） |
| [plan.md](plan.md) | 実装計画 |
| [tasks.md](tasks.md) | タスク一覧と進捗 |
| [react-native-vs-flutter.md](react-native-vs-flutter.md) | 技術選定の比較（React Native vs Flutter） |
| [architecture-proposal-v2-local.md](architecture-proposal-v2-local.md) | ローカル完結構成の検討メモ |

## ライセンス

Private
