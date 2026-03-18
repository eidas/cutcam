# CutCam

背景除去したキャラ画像をカメラ映像に合成して写真を撮るモバイルアプリです。AI による背景除去からアルファ編集、カメラ合成・撮影までをすべてオフラインで完結できます。

## 機能

- **背景除去** — ONNX Runtime による on-device AI 推論で画像の背景を自動除去
- **アルファ編集** — ブラシツールでアルファチャンネルをピクセル単位で微調整
- **カメラ合成** — 編集済みの切り抜き画像をリアルタイムカメラ映像に重ねて撮影
- **完全オフライン** — 初回のモデルダウンロード（約 80 MB）以降はネットワーク不要

## 技術スタック

| カテゴリ | ライブラリ |
|---|---|
| フレームワーク | React Native + Expo |
| AI 推論 | ONNX Runtime (CoreML / NNAPI) |
| 2D 描画 | @shopify/react-native-skia |
| カメラ | react-native-vision-camera |
| 状態管理 | Zustand |

## 必要環境

- Node.js 18 以上
- npm または yarn
- iOS: Xcode + CocoaPods
- Android: Android Studio + NDK

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/eidas/cutcam.git
cd cutcam

# 依存パッケージをインストール
npm install

# ネイティブプロジェクトを生成
npx expo prebuild
```

### iOS

```bash
# CocoaPods をインストール（初回のみ）
cd ios && pod install && cd ..

# 実行
npm run ios
```

### Android

```bash
npm run android
```

## 使い方

1. **モデルのダウンロード** — アプリ起動後、ホーム画面で AI モデルをダウンロードします（初回のみ、約 80 MB）
2. **画像を選択** — フォトライブラリから背景を除去したい画像を選びます
3. **背景除去** — AI が自動で背景を除去します
4. **アルファ編集** — 必要に応じてブラシツールで切り抜きの境界を微調整します
5. **カメラ合成・撮影** — カメラを起動し、切り抜き画像をリアルタイムで重ねて写真を撮影します

## 開発

```bash
# 開発サーバーを起動
npm start

# テストを実行
npm test
```

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

## ライセンス

Private
