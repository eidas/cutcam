# 統合画像ワークフローツール — ローカルモバイルアプリ構成案 (改訂版)

## 方針転換: サーバーなし・ローカル完結

前回の構成案ではサーバー (FastAPI) を前提としていたが、
ランニングコストを避けるため **すべての処理を端末上で完結** させる方針に変更する。

核心的な問題は「withoutBG の ONNX モデル (~320MB) をモバイル端末上で動かせるか」であり、
調査の結果 **ONNX Runtime Mobile が Android / iOS 両方で公式サポートされている** ことを確認した。

---

## 構成案の比較

| | 案A | 案B | 案C |
|--|-----|-----|-----|
| **方式** | React Native + ONNX Runtime | Capacitor + ONNX Plugin | PWA + ローカルPC連携 |
| **背景除去** | 端末上でONNX推論 | 端末上でONNX推論 | PCのwithoutBGが処理 |
| **UI** | React Native (ネイティブUI) | React (WebView) | React (ブラウザ) |
| **Canvas操作** | react-native-skia | Web Canvas API | Web Canvas API |
| **カメラ** | react-native-camera | Capacitor Camera | getUserMedia |
| **配布** | App Store / Google Play | App Store / Google Play | URL共有のみ |
| **開発コスト** | 高 | 中 | 低 |
| **推奨度** | ★★★★★ | ★★★☆☆ | ★★☆☆☆ |

---

## 案A: React Native + ONNX Runtime (推奨)

### なぜこれが最適か

1. **`onnxruntime-react-native` が公式パッケージとして存在する**
   - npm パッケージとして提供されており、React Native アプリ内で
     ONNX モデルを直接ロード・推論できる
   - v1.13 以降はフル版 ONNX Runtime を使用し、全オペレータ・全型をサポート
   - Android は NNAPI / XNNPACK、iOS は CoreML / XNNPACK でハードウェア加速可能

2. **withoutBG の Focus モデルが ONNX 形式**
   - withoutBG のオープンソースモデル (Focus v1.0.0) は ONNX で配布されている
   - このモデルファイルをアプリにバンドルまたは初回起動時にDLすれば、
     サーバーなしで背景除去が端末上で完結する

3. **React Native のエコシステムが成熟している**
   - カメラ、ファイル操作、画像処理のライブラリが豊富
   - react-native-skia で高性能な2D描画 (アルファ編集用Canvas) が可能
   - iOS / Android 両方のネイティブアプリを1つのコードベースで開発

### アーキテクチャ図

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
│  │ (~320MB, アプリ内 or 初回DL)      │                         │
│  │                                  │                         │
│  │ ハードウェア加速:                  │                         │
│  │   Android → NNAPI / XNNPACK     │                         │
│  │   iOS     → CoreML / XNNPACK    │                         │
│  └─────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### 技術スタック

| 要素 | 選定 | 役割 |
|------|------|------|
| **フレームワーク** | React Native + Expo (prebuild) | クロスプラットフォームUI |
| **言語** | TypeScript | 型安全な開発 |
| **ML推論** | onnxruntime-react-native | withoutBG ONNX モデルの端末上推論 |
| **2D描画** | @shopify/react-native-skia | アルファ編集Canvas, カメラ合成 |
| **カメラ** | react-native-vision-camera | リアルタイムカメラ入力 |
| **画像処理** | react-native-image-manipulator | リサイズ・クロップなどの前処理 |
| **ファイル** | expo-file-system | モデルDL、画像保存 |
| **状態管理** | Zustand | ステップ間のデータ受け渡し |
| **ナビゲーション** | @react-navigation/native | 画面遷移 |

### 各ツールの実装方針

#### 1. Clipper (背景除去)

```typescript
// 端末上での ONNX 推論イメージ
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

class BackgroundRemover {
  private session: InferenceSession | null = null;

  async loadModel(modelPath: string) {
    // Focus モデルをロード (初回は数秒かかる)
    this.session = await InferenceSession.create(modelPath, {
      executionProviders: ['coreml'],  // iOS の場合
      // executionProviders: ['nnapi'],  // Android の場合
    });
  }

  async removeBackground(imageData: Float32Array, dims: number[]) {
    const inputTensor = new Tensor('float32', imageData, dims);
    const results = await this.session!.run({ input: inputTensor });
    // 結果のアルファマットを取得して元画像に適用
    return results;
  }
}
```

**注意点: 前処理パイプラインの移植が必要**

withoutBG の Python 版は内部で PIL による画像のリサイズ・正規化・
テンソル変換を行っている。この前処理ロジックを TypeScript で
再実装する必要がある。具体的には:

- 入力画像を ONNX モデルが期待するサイズにリサイズ
- RGB 値を 0-1 の Float32 に正規化
- 出力のアルファマットを元画像サイズにリサイズして適用

withoutBG のリポジトリ (Apache-2.0 ライセンス) からモデルの
入出力仕様を確認し、同等の前処理を実装する。

#### 2. Alpha Stamp Editor

react-native-skia を使い、SkCanvas 上で画像を表示しつつ
タッチイベントでアルファ値を書き換える。

```typescript
// Skia Canvas でのアルファ編集イメージ
import { Canvas, Image, Paint, useImage } from '@shopify/react-native-skia';

// タッチ座標のピクセルに対してアルファ値を変更
// → SkImage のピクセルデータを直接操作
// → 変更後の画像を再描画
```

Skia はピクセルバッファへの直接アクセスが可能で、
Web Canvas の ImageData と同等の操作ができる。
ピンチズーム・パンは react-native-gesture-handler で実装。

#### 3. Camera Compositor

react-native-vision-camera でカメラフレームを取得し、
Skia Canvas 上で切り抜き画像とリアルタイム合成する。

vision-camera の Frame Processor 機能を使えば、
各フレームに対して JavaScript/Worklet で処理を挟める。

```typescript
// カメラフレーム + 切り抜き画像の合成イメージ
import { Camera, useFrameProcessor } from 'react-native-vision-camera';

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  // frame にオーバーレイ画像を合成
}, []);
```

### モデル配布戦略

320MB のモデルをどう扱うかは重要な設計判断:

| 方式 | メリット | デメリット |
|------|----------|------------|
| **アプリにバンドル** | オフラインで即使用可 | アプリサイズ 400MB超。ストア審査で不利 |
| **初回起動時にDL** | アプリ本体は軽量 (30MB程度) | 初回に Wi-Fi 必要。DL進捗UIが必要 |
| **量子化モデルを使用** | モデルサイズ ~80MB に削減可能 | 若干の品質低下の可能性 |

**推奨: 初回起動時DL + 量子化モデル併用**

- アプリ本体は軽量に保つ
- 初回起動時に量子化済みモデル (~80MB) を HuggingFace から DL
- 高品質が必要なユーザーにはフルモデル (320MB) のDLオプションを提供


### ディレクトリ構成

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
│   │   │   ├── BackgroundRemover.ts  # ONNX推論ラッパー
│   │   │   ├── preprocess.ts         # 画像前処理 (リサイズ・正規化)
│   │   │   └── postprocess.ts        # マスク後処理
│   │   ├── ModelManager.ts           # モデルDL・キャッシュ管理
│   │   └── ImageStore.ts             # Zustand ストア
│   ├── components/
│   │   ├── SkiaCanvas.tsx            # Skia ベースの画像Canvas
│   │   ├── BrushControls.tsx         # ブラシサイズ・アルファ値UI
│   │   ├── CameraOverlay.tsx         # カメラ合成オーバーレイ
│   │   └── ProgressBar.tsx           # モデルDL進捗
│   └── utils/
│       ├── imageUtils.ts             # 画像変換ユーティリティ
│       └── tensorUtils.ts            # テンソル変換
├── assets/
│   └── (アイコン、スプラッシュなど)
├── app.json                          # Expo 設定
├── metro.config.js                   # ONNX拡張子登録
├── package.json
└── tsconfig.json
```

### 開発ロードマップ

```
Phase 0: 技術検証 (2-3日)
├── withoutBG の ONNX モデルを React Native 上で動作確認
├── 前処理パイプラインの仕様確認・TypeScript移植
└── 推論時間の計測 (iPhone / Android 実機)

Phase 1: Clipper (3-4日)
├── モデルDL・キャッシュ機構
├── 画像選択 → 背景除去 → 結果表示UI
└── NNAPI / CoreML によるハードウェア加速

Phase 2: Alpha Stamp Editor (3-4日)
├── Skia Canvas ベースの画像表示
├── タッチスタンプ操作
├── ピンチズーム・パン
└── Undo/Redo・保存

Phase 3: Camera Compositor (3-4日)
├── vision-camera でカメラ入力
├── Skia 上でリアルタイム合成
├── 画像の移動・拡縮・回転操作
└── 静止画キャプチャ

Phase 4: 統合・仕上げ (2-3日)
├── ワークフロー画面 (Clipper → Editor → Compositor)
├── ステップ間のデータ受け渡し
├── エラー処理・UX改善
└── ストアビルド準備
```

---

## 案B: Capacitor + カスタム ONNX プラグイン

### 概要

既存の React (Web) コードを Capacitor でネイティブアプリ化し、
ONNX 推論部分だけカスタムネイティブプラグインとして実装する方式。

```
┌─────────────────────────────────────────────┐
│           Capacitor ネイティブシェル            │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │          WebView (React アプリ)           │ │
│  │  ・alpha_stamp_editor (既存コード流用)    │ │
│  │  ・camera_compositor (getUserMedia)      │ │
│  │  ・Clipper UI                            │ │
│  └──────────────┬──────────────────────────┘ │
│                 │ Capacitor Bridge            │
│  ┌──────────────▼──────────────────────────┐ │
│  │     カスタム ONNX プラグイン              │ │
│  │  ・Android: Java + ONNX Runtime          │ │
│  │  ・iOS: Swift + ONNX Runtime             │ │
│  │  ・withoutBG Focus モデル推論             │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### メリット

- 既存の React プロトタイプ (alpha_stamp_editor) のコードをほぼそのまま流用できる
- Web Canvas API がそのまま使えるため、ピクセル操作の実装が楽
- Capacitor のカメラプラグインでネイティブカメラ連携可能

### デメリット

- **ONNX プラグインを Android (Java/Kotlin) と iOS (Swift) の2つ書く必要がある**
- WebView 経由のため、大きな画像のやり取りにオーバーヘッドがある
  (Base64 エンコード/デコードが発生)
- react-native-skia のようなGPU描画が使えず、Canvas 描画性能が劣る
- WebView のメモリ制限にかかる可能性がある

### 判定

既存コードの流用を優先したい場合は検討に値するが、
ONNX プラグインをネイティブで2プラットフォーム分書くコストと
WebView のパフォーマンス制約を考えると、案Aの方が総合的に有利。

---

## 案C: PWA + ローカル PC 連携

### 概要

React アプリを PWA としてスマホのブラウザで動かし、
背景除去だけは同じ LAN 内の PC (Python + withoutBG) で処理する。

```
スマホ (ブラウザ/PWA)          同一LAN内のPC
┌───────────────┐           ┌──────────────────┐
│  React PWA    │ ──WiFi──→ │  FastAPI          │
│  (UI全般)     │ ←─────── │  + withoutBG      │
│               │  RGBA PNG │  (localhost:8000)  │
└───────────────┘           └──────────────────┘
```

### メリット

- サーバー代ゼロ (PC は自宅のもの)
- withoutBG を一切改変せず使える
- 開発が最も簡単 (前回構成案のバックエンドをPC上で動かすだけ)

### デメリット

- **PC が起動していないと背景除去が使えない**
- 外出先では背景除去機能が利用不可
- LAN 内ネットワーク設定 (IP固定、ファイアウォール) が必要
- 一般配布には向かない (個人利用限定)

### 判定

開発速度を最優先する場合や、当面は個人利用のみの場合に有効。
ただし「モバイルアプリ」とは言い難く、利便性が大きく制限される。

---

## 総合比較と推奨

```
                    案A (React Native)    案B (Capacitor)     案C (PWA+PC)
──────────────────────────────────────────────────────────────────────────
サーバー代           ¥0                   ¥0                  ¥0
オフライン動作       ○ 完全対応            ○ 完全対応           × PC必須
ストア配布           ○                    ○                   ×
開発コスト           大 (2-3週間)          中 (1-2週間)         小 (数日)
描画性能             ◎ Skia (GPU)         △ WebView Canvas    △ ブラウザ Canvas
ML推論性能           ◎ ネイティブ加速      ○ ネイティブ加速     ◎ PC GPU使用
既存コード流用       △ 書き直し            ○ ほぼ流用           ◎ そのまま
保守性               ○                    △ プラグイン管理      ○
──────────────────────────────────────────────────────────────────────────
総合推奨             ★★★★★              ★★★☆☆             ★★☆☆☆
```

### 推奨ロードマップ

**短期 (今すぐ)**: 案C で動くものを作り、ワークフローを検証する
  → 前回構成案の FastAPI バックエンドを PC で起動、React PWA をスマホで利用

**中期 (本格開発)**: 案A (React Native) で完全ローカルアプリを開発する
  → Phase 0 の技術検証から開始し、ONNX 推論がモバイルで実用的な速度か確認

**このアプローチにより**:
- 案C で素早くワークフロー全体の UX を検証できる
- その検証結果をフィードバックして案A の設計に反映できる
- 案A が完成すれば、サーバー不要・オフライン対応の本格アプリになる

---

## 補足: モバイル端末での ONNX 推論性能の見込み

withoutBG の Focus モデルは4段パイプライン (Depth → ISNet → Matting → Refiner) で構成されている。
モバイル端末での推論時間は以下が目安:

| 端末 | 推論時間 (推定) | 備考 |
|------|---------------|------|
| iPhone 15 Pro (CoreML) | 1-3 秒 | A17 Pro の Neural Engine が加速 |
| iPhone 13 (CoreML) | 3-5 秒 | 十分実用的 |
| Pixel 8 (NNAPI) | 2-4 秒 | Tensor G3 の TPU が加速 |
| ミッドレンジ Android (CPU) | 5-15 秒 | XNNPACK で多少改善可能 |

※ 量子化 (INT8) を適用すればさらに 2-3 倍高速化の可能性がある。
※ 実測値は Phase 0 の技術検証で確認する必要がある。

大きな画像は推論前にリサイズして処理し、結果のマスクを元サイズに拡大適用する
パイプラインにすれば、メモリ使用量も抑えられる。
