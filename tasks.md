# タスク一覧

凡例: `[x]` 完了 / `[~]` 一部実装（備考参照） / `[ ]` 未着手

最終更新: 2026-09-19（コード実態に合わせて更新）

## Phase 0: 技術検証

### 0-1: プロジェクト初期化
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 0-1-1 | Expo TypeScript プロジェクト作成 (`create-expo-app`) | [x] | `package.json`, `app.json` | |
| 0-1-2 | Expo prebuild 設定 | [~] | `ios/`, `android/` | `android/` のみ生成済み（git 管理外）。`ios/` は未生成 |
| 0-1-3 | 依存パッケージインストール (`onnxruntime-react-native`, `react-native-skia`, `vision-camera`, `expo-file-system`, `zustand`, `react-navigation`) | [x] | `package.json` | 他に `expo-image-picker`, `expo-media-library`, `gesture-handler`, `reanimated` も追加済み |
| 0-1-4 | iOS 実機ビルド確認 | [ ] | — | |
| 0-1-5 | Android 実機ビルド確認 | [ ] | — | |

### 0-2: ONNX モデル動作確認
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 0-2-1 | withoutBG Focus v1.0.0 ONNX モデルを HuggingFace から取得 | [ ] | モデルファイル | `ModelManager` に URL (`nicjac/withoutbg` の `isnet-general-use.onnx`) を仮置きしているが未検証。UI の「約 80MB」と design.md の「約 320MB」も不一致 |
| 0-2-2 | モデルの入出力仕様調査 (shape, 型, 正規化方法) | [ ] | 仕様メモ | 入力名 `input`、正規化 0〜1 は仮定。出力が sigmoid 済みかも未確認 |
| 0-2-3 | `InferenceSession.create()` でモデルロード確認 | [ ] | — | コードは `BackgroundRemover.initialize()` にあるが実機未確認 |
| 0-2-4 | ダミー入力で推論実行・エラーなし確認 | [ ] | — | |

### 0-3: 前処理パイプライン移植
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 0-3-1 | withoutBG Python ソースから前処理ロジック読解 (リサイズ, 正規化, テンソル shape) | [ ] | — | |
| 0-3-2 | `preprocess.ts` を TypeScript で実装 | [x] | `src/services/onnx/preprocess.ts` | 1024×1024 最近傍リサイズ + 0〜1 正規化 + NCHW。Python 版の仕様とは未照合（リサイズ方式・平均/標準偏差の有無） |
| 0-3-3 | Python 版と同一画像で出力テンソルを比較・一致確認 | [ ] | — | |

### 0-4: 推論性能計測
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 0-4-1 | 実画像で端末上背景除去を実行 | [ ] | — | 画像 decode/encode が未実装のため実行不可 |
| 0-4-2 | 推論時間計測 (CoreML / NNAPI / CPU) | [ ] | 計測データ | `BackgroundRemover` に所要時間の `console.log` のみ |
| 0-4-3 | メモリ使用量確認 | [ ] | 計測データ | |
| 0-4-4 | Go/No-Go 判断 (推論 <10秒, メモリ <1.5GB, 品質同等) | [ ] | 判断結果 | |

---

## Phase 1: Clipper (背景除去)

### 1-1: モデル DL・キャッシュ管理
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 1-1-1 | `expo-file-system` でモデル DL 機能実装 (HuggingFace → documentDirectory) | [x] | `src/services/ModelManager.ts` | |
| 1-1-2 | DL 進捗コールバック実装 | [~] | `src/components/ProgressBar.tsx` | コールバック引数はあるが 0 と 1 しか通知しない（途中経過なし）。`ProgressBar` は未使用で、`HomeScreen` は独自のバーを描画している |
| 1-1-3 | キャッシュ判定 (DL 済みならスキップ) | [x] | — | `isModelCached` / `ensureModel` |
| 1-1-4 | DL 失敗時リトライ・エラーハンドリング | [~] | — | 指数バックオフで最大 3 回リトライ済み。最終失敗時は `HomeScreen` が握りつぶしていて通知しない |

### 1-2: 背景除去サービス
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 1-2-1 | `BackgroundRemover` クラス実装 (`loadModel`, `removeBackground`) | [~] | `src/services/onnx/BackgroundRemover.ts` | セッション作成・推論の流れは実装済み（実行プロバイダは iOS: coreml / Android: nnapi、フォールバック: xnnpack, cpu）。`decodeImage` / `encodeImage` は例外を投げるスタブ |
| 1-2-2 | 前処理パイプライン組み込み (Phase 0 の成果) | [x] | `src/services/onnx/preprocess.ts` | |
| 1-2-3 | 後処理実装 (アルファマットリサイズ → 元画像に適用 → RGBA PNG 保存) | [~] | `src/services/onnx/postprocess.ts` | アルファ抽出（min-max 正規化 + 最近傍リサイズ）と適用は実装済み。PNG 保存（`encodeImage`）が未実装 |

### 1-3: Clipper 画面 UI
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 1-3-1 | 画像選択機能 (`expo-image-picker`) | [x] | `src/screens/ClipperScreen.tsx` | |
| 1-3-2 | 背景除去ボタン + 処理中スピナー + 結果表示 | [x] | — | UI は実装済み。ただし 1-2-1 のスタブにより、押すとエラーになる |
| 1-3-3 | 処理結果プレビュー (元画像 / 処理後 切り替え) | [x] | — | |
| 1-3-4 | 結果保存・次画面への受け渡し | [x] | — | `ImageStore.setClippedImage` + `AlphaEditor` へ遷移 |

---

## Phase 2: Alpha Stamp Editor (アルファ編集)

`AlphaEditorScreen` は画像を `<Image>` で表示するプレースホルダーのみ（"coming in Phase 2"）。

### 2-1: Skia Canvas 基盤
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 2-1-1 | `react-native-skia` で画像を Canvas 上に表示 | [ ] | `src/components/SkiaCanvas.tsx` | ファイル未作成 |
| 2-1-2 | ピンチズーム・パン操作 (`react-native-gesture-handler`) | [ ] | — | |
| 2-1-3 | Canvas 座標系とタッチ座標のマッピング | [ ] | — | |

### 2-2: アルファ編集操作
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 2-2-1 | タッチ座標のピクセルのアルファ値変更機能 | [ ] | `src/screens/AlphaEditorScreen.tsx` | 画面はあるが編集ロジックなし。ピクセル単位のヘルパー `setPixelAlpha`（`imageUtils.ts`）のみ存在 |
| 2-2-2 | ブラシサイズ調整 UI | [x] | `src/components/BrushControls.tsx` | プリセット 10/20/40/60。値は state に入るだけで描画には未反映 |
| 2-2-3 | アルファ値設定 (消す: 0 / 戻す: 255 / 半透明) | [~] | — | Erase(0) / Half(128) / Restore(255) の選択 UI のみ |
| 2-2-4 | ピクセルバッファ直接操作による反映 | [ ] | — | |

### 2-3: Undo/Redo・保存
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 2-3-1 | 編集履歴スタック管理 | [ ] | — | |
| 2-3-2 | Undo / Redo ボタン UI | [ ] | — | |
| 2-3-3 | 編集結果を RGBA PNG として保存 | [ ] | — | |
| 2-3-4 | 次画面 (Compositor) へのデータ受け渡し | [~] | — | 遷移は実装済みだが、編集結果ではなく入力の `imageUri` をそのまま渡している（`editedImageUri` は未使用） |

---

## Phase 3: Camera Compositor (カメラ合成)

`CompositorScreen` はプレースホルダーのみ（"coming in Phase 3"）。カメラ映像は表示されず、切り抜き画像を固定サイズ 200×200 で重ねているだけ。

### 3-1: カメラ入力
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 3-1-1 | `react-native-vision-camera` でカメラプレビュー表示 | [ ] | `src/screens/CompositorScreen.tsx` | |
| 3-1-2 | カメラ権限リクエスト処理 | [ ] | — | `app.json` に iOS の権限文言と vision-camera プラグイン設定のみ |
| 3-1-3 | 前面 / 背面カメラ切り替え | [~] | — | Flip ボタンと state のみ。カメラ本体に未接続 |

### 3-2: リアルタイム合成
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 3-2-1 | Skia Canvas 上にカメラフレーム + 切り抜き画像を合成表示 | [ ] | `src/components/CameraOverlay.tsx` | ファイル未作成 |
| 3-2-2 | 切り抜き画像の移動 (ドラッグ) | [ ] | — | |
| 3-2-3 | 切り抜き画像の拡縮 (ピンチ) | [ ] | — | |
| 3-2-4 | 切り抜き画像の回転 (二本指回転) | [ ] | — | |

### 3-3: キャプチャ・保存
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 3-3-1 | 合成結果の静止画キャプチャ | [ ] | — | Capture ボタンは Alert を出すだけ |
| 3-3-2 | カメラロールへの保存 | [ ] | — | `expo-media-library` は依存に追加済みだが、コードでは未使用で `app.json` にもプラグイン設定がない |
| 3-3-3 | シェア機能 (オプション) | [ ] | — | |

---

## Phase 4: 統合・仕上げ

### 4-1: ナビゲーションとワークフロー
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 4-1-1 | `RootNavigator.tsx` で画面遷移定義 (Home → Clipper → Editor → Compositor) | [x] | `src/navigation/RootNavigator.tsx` | |
| 4-1-2 | `WorkflowScreen.tsx` で統合ワークフロー UI | [ ] | `src/screens/WorkflowScreen.tsx` | ファイル未作成。現状は Home から各画面へ順に遷移する構成 |
| 4-1-3 | Zustand ストアによるステップ間データ管理 | [~] | `src/services/ImageStore.ts` | ストアは実装済み。`sourceImageUri` / `editedImageUri` は未使用で、AlphaEditor 以降は route params で受け渡している |

### 4-2: エラー処理・UX
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 4-2-1 | モデル DL 失敗時のリトライ UI | [ ] | — | 自動リトライのみで、失敗を UI に出さない |
| 4-2-2 | 推論中のプログレス表示 | [ ] | — | スピナーのみ |
| 4-2-3 | メモリ不足時のフォールバック (画像リサイズ) | [ ] | — | |
| 4-2-4 | 各画面のローディング状態管理 | [~] | — | Home（DL 中）と Clipper（処理中）のみ |

### 4-3: ストアビルド準備
| # | タスク | 状態 | 成果物 | 備考 |
|---|--------|------|--------|------|
| 4-3-1 | アプリアイコン・スプラッシュスクリーン作成 | [ ] | `assets/` | 画像ファイルはあるが、独自デザインかは未確認 |
| 4-3-2 | `app.json` 設定 (バンドルID, バージョン, 権限) | [~] | `app.json` | バンドル ID / パッケージ名 / バージョン / iOS 権限文言は設定済み。`expo-media-library` プラグイン設定と Android 権限は未設定 |
| 4-3-3 | iOS アーカイブビルド確認 | [ ] | — | |
| 4-3-4 | Android APK / AAB ビルド確認 | [ ] | — | |

---

## その他（計画外で実施済み）

- Jest テストスイート（`ImageStore`, `preprocess`, `postprocess`, `imageUtils`, `tensorUtils`）— ただし現状 `node_modules` 未インストールのため実行未確認
- `README.md`（概要・インストール・使い方）— 機能一覧は目標の記述で、実装状況とは一致しない
- pnpm workspace 設定（`pnpm-workspace.yaml`）

---

## サマリー

| Phase | タスク数 | 完了 | 一部 | 未着手 | 状態 |
|-------|---------|------|------|--------|------|
| Phase 0: 技術検証 | 16 | 3 | 1 | 12 | 実機検証が未着手 |
| Phase 1: Clipper | 11 | 7 | 4 | 0 | 実装途中（decode/encode がスタブで動作しない） |
| Phase 2: Alpha Editor | 11 | 1 | 2 | 8 | UI 部品のみ |
| Phase 3: Compositor | 10 | 0 | 1 | 9 | プレースホルダーのみ |
| Phase 4: 統合 | 11 | 1 | 3 | 7 | ナビゲーションのみ |
| **合計** | **59** | **12** | **11** | **36** | — |
