# 実装計画書 (案A: React Native + ONNX Runtime)

design.md に基づく具体的な実装計画。各タスクに完了条件と成果物を定義する。

---

## Phase 0: 技術検証

**目的**: ONNX モデルが React Native 上で実用的に動作するか確認する。
ここで Go/No-Go を判断し、問題があれば案Bまたは案Cへのフォールバックを決定する。

### タスク 0-1: プロジェクト初期化

- [ ] `npx create-expo-app cutcam --template blank-typescript`
- [ ] Expo prebuild 設定 (`expo prebuild`)
- [ ] 基本的な依存パッケージのインストール
  - `onnxruntime-react-native`
  - `@shopify/react-native-skia`
  - `react-native-vision-camera`
  - `expo-file-system`
  - `zustand`
  - `@react-navigation/native`
- [ ] iOS / Android 両方でビルドが通ることを確認

**完了条件**: 空のアプリが実機で起動する

### タスク 0-2: ONNX モデルの動作確認

- [ ] withoutBG Focus v1.0.0 ONNX モデルを HuggingFace から取得
- [ ] モデルの入出力仕様を調査 (入力テンソルの shape・型・正規化方法)
- [ ] `InferenceSession.create()` でモデルをロードできることを確認
- [ ] ダミー入力でエラーなく推論が完了することを確認

**完了条件**: 実機で ONNX モデルのロードと推論が成功する

### タスク 0-3: 前処理パイプラインの移植

- [ ] withoutBG の Python ソースから前処理ロジックを読み取る
  - 入力リサイズ (PIL → TypeScript)
  - RGB 正規化 (0-1 Float32)
  - テンソル shape の構築 (NCHW or NHWC)
- [ ] TypeScript で `preprocess.ts` を実装
- [ ] Python 版と同じ入力画像で出力テンソルを比較し、一致を確認

**完了条件**: Python 版と同等の前処理結果が TypeScript で再現できる

### タスク 0-4: 推論性能の計測

- [ ] 実際の画像を使って端末上で背景除去を実行
- [ ] 推論時間を計測 (CoreML / NNAPI / CPU)
- [ ] メモリ使用量を確認
- [ ] 結果を記録し、実用性を判断

**完了条件**: 推論時間とメモリ使用量の計測データが得られる

### Go/No-Go 判断基準

| 項目 | Go | No-Go |
|------|-----|-------|
| 推論時間 | < 10 秒 (ミッドレンジ端末) | > 30 秒 |
| メモリ使用量 | < 1.5 GB | クラッシュ発生 |
| 出力品質 | Python 版と同等 | 明らかな劣化 |

No-Go の場合: 量子化モデルで再検証 → それでも不可なら案Cにフォールバック

---

## Phase 1: Clipper (背景除去画面)

**前提**: Phase 0 が Go 判定であること

### タスク 1-1: モデルDL・キャッシュ管理 (`ModelManager.ts`)

- [ ] `expo-file-system` でモデルファイルのDL機能を実装
  - DL元: HuggingFace (量子化モデル ~80MB)
  - 保存先: `FileSystem.documentDirectory`
- [ ] DL進捗のコールバック (ProgressBar 用)
- [ ] キャッシュ判定 (既にDL済みならスキップ)
- [ ] DL失敗時のリトライ・エラーハンドリング

**成果物**: `src/services/ModelManager.ts`, `src/components/ProgressBar.tsx`

### タスク 1-2: 背景除去サービス (`BackgroundRemover.ts`)

- [ ] Phase 0 の前処理パイプラインを組み込み
- [ ] `BackgroundRemover` クラスとして API を整理
  - `loadModel(path)` → セッション初期化
  - `removeBackground(imageUri)` → URI を受け取り RGBA PNG を返す
- [ ] 後処理の実装 (`postprocess.ts`)
  - アルファマットを元画像サイズにリサイズ
  - 元画像にアルファチャンネルとして適用
  - RGBA PNG として保存

**成果物**: `src/services/onnx/BackgroundRemover.ts`, `preprocess.ts`, `postprocess.ts`

### タスク 1-3: Clipper 画面 UI

- [ ] 画像選択 (expo-image-picker)
- [ ] 「背景除去」ボタン → 処理中スピナー → 結果表示
- [ ] 処理結果のプレビュー (元画像 / 処理後の切り替え)
- [ ] 結果の保存・次画面への受け渡し

**成果物**: `src/screens/ClipperScreen.tsx`

---

## Phase 2: Alpha Stamp Editor (アルファ編集画面)

### タスク 2-1: Skia Canvas 基盤

- [ ] `@shopify/react-native-skia` で画像を Canvas 上に表示
- [ ] ピンチズーム・パン操作 (`react-native-gesture-handler`)
- [ ] Canvas 座標系とタッチ座標のマッピング

**成果物**: `src/components/SkiaCanvas.tsx`

### タスク 2-2: アルファ編集操作

- [ ] タッチ座標のピクセルのアルファ値を変更する機能
- [ ] ブラシサイズ調整 UI
- [ ] アルファ値の設定 (消す: 0 / 戻す: 255 / 半透明)
- [ ] ピクセルバッファの直接操作による反映

**成果物**: `src/components/BrushControls.tsx`, `src/screens/AlphaEditorScreen.tsx`

### タスク 2-3: Undo/Redo・保存

- [ ] 編集履歴のスタック管理
- [ ] Undo / Redo ボタン
- [ ] 編集結果を RGBA PNG として保存
- [ ] 次画面 (Compositor) へのデータ受け渡し

---

## Phase 3: Camera Compositor (カメラ合成画面)

### タスク 3-1: カメラ入力

- [ ] `react-native-vision-camera` でカメラプレビュー表示
- [ ] カメラ権限のリクエスト処理
- [ ] 前面/背面カメラの切り替え

### タスク 3-2: リアルタイム合成

- [ ] Skia Canvas 上にカメラフレーム + 切り抜き画像を合成表示
- [ ] 切り抜き画像の移動 (ドラッグ)
- [ ] 拡縮 (ピンチ)
- [ ] 回転 (二本指回転)

**成果物**: `src/components/CameraOverlay.tsx`, `src/screens/CompositorScreen.tsx`

### タスク 3-3: キャプチャ・保存

- [ ] 合成結果の静止画キャプチャ
- [ ] カメラロールへの保存
- [ ] シェア機能 (オプション)

---

## Phase 4: 統合・仕上げ

### タスク 4-1: ナビゲーションとワークフロー

- [ ] `RootNavigator.tsx` で画面遷移を定義
  - Home → Clipper → Alpha Editor → Compositor
- [ ] `WorkflowScreen.tsx` で統合ワークフロー UI
- [ ] Zustand ストアによるステップ間データ管理 (`ImageStore.ts`)

**成果物**: `src/navigation/RootNavigator.tsx`, `src/screens/WorkflowScreen.tsx`, `src/services/ImageStore.ts`

### タスク 4-2: エラー処理・UX

- [ ] モデルDL失敗時のリトライ UI
- [ ] 推論中のプログレス表示
- [ ] メモリ不足時のフォールバック (画像リサイズ)
- [ ] 各画面のローディング状態管理

### タスク 4-3: ストアビルド準備

- [ ] アプリアイコン・スプラッシュスクリーン
- [ ] `app.json` の設定 (バンドルID、バージョン、権限)
- [ ] iOS: Xcode でアーカイブビルド確認
- [ ] Android: APK / AAB ビルド確認

---

## 依存関係

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4
(技術検証)    (Clipper)   (Editor)   (Compositor)  (統合)
              ↓
         Go/No-Go 判断
```

- Phase 0 → Phase 1: 必須 (Go 判定が前提)
- Phase 1 → Phase 2: Clipper の出力が Editor の入力
- Phase 2 → Phase 3: Editor の出力が Compositor の入力
- Phase 3 → Phase 4: 全画面が揃ってから統合

Phase 2 と Phase 3 は入出力のインターフェースを先に決めれば並行開発も可能。

---

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| ONNX モデルがモバイルで遅すぎる | 全体計画に影響 | Phase 0 で早期に検証。量子化モデルを試す |
| 前処理の移植が難しい | Phase 0 遅延 | withoutBG のソースを詳細に読む。テスト画像で出力比較 |
| Skia でピクセル直接操作が困難 | Phase 2 遅延 | `makeImageFromEncoded` + `readPixels` の API を事前調査 |
| vision-camera + Skia 合成の性能不足 | Phase 3 遅延 | Frame Processor の代わりに静止画キャプチャ+合成に切り替え |
| モデル DL が大きすぎてユーザー離脱 | UX 低下 | 量子化モデル (~80MB) を既定にする |
