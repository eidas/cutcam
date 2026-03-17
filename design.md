# 案A 設計書: React Native + ONNX Runtime

## 概要

背景除去したキャラ画像を合成して写真を撮るモバイルアプリ。
すべての処理を端末上で完結させ、サーバー不要・オフライン対応を実現する。

**方式**: React Native + ONNX Runtime (端末上推論)
**推奨度**: ★★★★★

---

## 選定理由

1. **ONNX Runtime が Microsoft 公式パッケージ** — `onnxruntime-react-native` が npm で提供されており、全オペレータ対応・ハードウェア加速 (NNAPI / CoreML) をサポート
2. **withoutBG の Focus モデルが ONNX 形式** — モデルファイルを端末にDLすればサーバーなしで背景除去が完結
3. **React Native エコシステムが成熟** — カメラ・ファイル操作・GPU描画のライブラリが揃っている
4. **TypeScript で既存の React プロトタイプの知見を流用可能**

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                  React Native アプリ                          │
│                                                               │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Clipper     │  │  Alpha Stamp    │  │    Camera        │  │
│  │  Screen      │→│  Editor Screen  │→│    Compositor    │  │
│  │             │  │                 │  │    Screen        │  │
│  └──────┬──────┘  └─────────────────┘  └─────────────────┘  │
│         │                  │                     │            │
│         ▼                  ▼                     ▼            │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ ONNX        │  │ react-native-   │  │ react-native-   │  │
│  │ Runtime     │  │ skia            │  │ camera +        │  │
│  │ (on-device) │  │ (Canvas描画)     │  │ skia (合成)      │  │
│  └──────┬──────┘  └─────────────────┘  └─────────────────┘  │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────────────────────┐                         │
│  │ withoutBG Focus ONNX モデル      │                         │
│  │ (~320MB, 初回起動時にDL)         │                         │
│  │                                  │                         │
│  │ ハードウェア加速:                  │                         │
│  │   Android → NNAPI / XNNPACK     │                         │
│  │   iOS     → CoreML / XNNPACK    │                         │
│  └─────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 技術スタック

| 要素 | 選定 | 役割 |
|------|------|------|
| フレームワーク | React Native + Expo (prebuild) | クロスプラットフォーム UI |
| 言語 | TypeScript | 型安全な開発 |
| ML 推論 | onnxruntime-react-native | withoutBG ONNX モデルの端末上推論 |
| 2D 描画 | @shopify/react-native-skia | アルファ編集 Canvas、カメラ合成 |
| カメラ | react-native-vision-camera | リアルタイムカメラ入力 |
| 画像処理 | react-native-image-manipulator | リサイズ・クロップなどの前処理 |
| ファイル | expo-file-system | モデル DL、画像保存 |
| 状態管理 | Zustand | ステップ間のデータ受け渡し |
| ナビゲーション | @react-navigation/native | 画面遷移 |

---

## 画面設計

### 1. Clipper (背景除去)

画像を選択し、端末上で ONNX 推論を実行して背景を除去する。

- `InferenceSession.create()` でモデルをロード (iOS: CoreML、Android: NNAPI)
- 入力画像をモデルが期待するサイズにリサイズ → RGB を Float32 に正規化
- 出力のアルファマットを元画像サイズに拡大適用

```typescript
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

class BackgroundRemover {
  private session: InferenceSession | null = null;

  async loadModel(modelPath: string) {
    this.session = await InferenceSession.create(modelPath, {
      executionProviders: ['coreml'],  // iOS
      // executionProviders: ['nnapi'],  // Android
    });
  }

  async removeBackground(imageData: Float32Array, dims: number[]) {
    const inputTensor = new Tensor('float32', imageData, dims);
    const results = await this.session!.run({ input: inputTensor });
    return results;
  }
}
```

**前処理パイプラインの移植が必要**: withoutBG の Python 版が行う PIL によるリサイズ・正規化・テンソル変換を TypeScript で再実装する。

### 2. Alpha Stamp Editor (アルファ編集)

react-native-skia の Canvas 上で画像を表示し、タッチ操作でアルファ値を編集する。

- Skia のピクセルバッファへの直接アクセスでアルファ値を書き換え
- ピンチズーム・パンは react-native-gesture-handler で実装
- Undo / Redo・保存機能

### 3. Camera Compositor (カメラ合成)

react-native-vision-camera でカメラフレームを取得し、Skia Canvas 上で切り抜き画像とリアルタイム合成する。

- Frame Processor (Worklet ベース) でフレーム単位の処理
- 画像の移動・拡縮・回転操作
- 静止画キャプチャ

---

## モデル配布戦略

**推奨: 初回起動時 DL + 量子化モデル併用**

| 方式 | メリット | デメリット |
|------|----------|------------|
| アプリにバンドル | オフラインで即使用可 | アプリサイズ 400MB 超 |
| 初回起動時に DL | アプリ本体は軽量 (~30MB) | 初回に Wi-Fi 必要 |
| 量子化モデル使用 | モデルサイズ ~80MB に削減 | 若干の品質低下 |

- アプリ本体は軽量に保つ
- 初回起動時に量子化済みモデル (~80MB) を HuggingFace から DL
- 高品質が必要なユーザーにはフルモデル (320MB) の DL オプションを提供

---

## ディレクトリ構成

```
project-root/
├── src/
│   ├── App.tsx
│   ├── navigation/
│   │   └── RootNavigator.tsx         # 画面遷移定義
│   ├── screens/
│   │   ├── HomeScreen.tsx            # ツール選択画面
│   │   ├── ClipperScreen.tsx         # 背景除去
│   │   ├── AlphaEditorScreen.tsx     # アルファ編集
│   │   ├── CompositorScreen.tsx      # カメラ合成
│   │   └── WorkflowScreen.tsx        # 統合ワークフロー
│   ├── services/
│   │   ├── onnx/
│   │   │   ├── BackgroundRemover.ts  # ONNX 推論ラッパー
│   │   │   ├── preprocess.ts         # 画像前処理 (リサイズ・正規化)
│   │   │   └── postprocess.ts        # マスク後処理
│   │   ├── ModelManager.ts           # モデル DL・キャッシュ管理
│   │   └── ImageStore.ts             # Zustand ストア
│   ├── components/
│   │   ├── SkiaCanvas.tsx            # Skia ベースの画像 Canvas
│   │   ├── BrushControls.tsx         # ブラシサイズ・アルファ値 UI
│   │   ├── CameraOverlay.tsx         # カメラ合成オーバーレイ
│   │   └── ProgressBar.tsx           # モデル DL 進捗
│   └── utils/
│       ├── imageUtils.ts             # 画像変換ユーティリティ
│       └── tensorUtils.ts            # テンソル変換
├── assets/
├── app.json                          # Expo 設定
├── metro.config.js                   # ONNX 拡張子登録
├── package.json
└── tsconfig.json
```

---

## 推論性能の見込み

withoutBG Focus モデルは 4 段パイプライン (Depth → ISNet → Matting → Refiner) で構成。

| 端末 | 推論時間 (推定) | 備考 |
|------|----------------|------|
| iPhone 15 Pro (CoreML) | 1-3 秒 | A17 Pro Neural Engine |
| iPhone 13 (CoreML) | 3-5 秒 | 十分実用的 |
| Pixel 8 (NNAPI) | 2-4 秒 | Tensor G3 TPU |
| ミッドレンジ Android (CPU) | 5-15 秒 | XNNPACK で改善可能 |

INT8 量子化で更に 2-3 倍の高速化が見込める。実測値は Phase 0 で確認する。

---

## 開発ロードマップ

```
Phase 0: 技術検証 (2-3日)
├── withoutBG ONNX モデルの React Native 上での動作確認
├── 前処理パイプラインの仕様確認・TypeScript 移植
└── 推論時間の計測 (iPhone / Android 実機)

Phase 1: Clipper (3-4日)
├── モデル DL・キャッシュ機構
├── 画像選択 → 背景除去 → 結果表示 UI
└── NNAPI / CoreML によるハードウェア加速

Phase 2: Alpha Stamp Editor (3-4日)
├── Skia Canvas ベースの画像表示
├── タッチスタンプ操作
├── ピンチズーム・パン
└── Undo / Redo・保存

Phase 3: Camera Compositor (3-4日)
├── vision-camera でカメラ入力
├── Skia 上でリアルタイム合成
├── 画像の移動・拡縮・回転操作
└── 静止画キャプチャ

Phase 4: 統合・仕上げ (2-3日)
├── ワークフロー画面 (Clipper → Editor → Compositor)
├── ステップ間のデータ受け渡し
├── エラー処理・UX 改善
└── ストアビルド準備
```

---

## 他の案との比較

| | 案A (本設計) | 案B (Capacitor) | 案C (PWA+PC) |
|--|-------------|-----------------|--------------|
| サーバー代 | ¥0 | ¥0 | ¥0 |
| オフライン動作 | ○ 完全対応 | ○ 完全対応 | × PC 必須 |
| ストア配布 | ○ | ○ | × |
| 開発コスト | 大 (2-3 週間) | 中 (1-2 週間) | 小 (数日) |
| 描画性能 | ◎ Skia (GPU) | △ WebView | △ ブラウザ |
| ML 推論性能 | ◎ ネイティブ加速 | ○ ネイティブ加速 | ◎ PC GPU |
| 既存コード流用 | △ 書き直し | ○ ほぼ流用 | ◎ そのまま |
