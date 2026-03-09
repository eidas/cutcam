# 案A 技術選定: React Native vs Flutter 比較

## 1. ONNX Runtime 対応 (最重要)

withoutBG の ONNX モデルを端末上で推論する部分が本プロジェクトの要。

### React Native

- **`onnxruntime-react-native`** — Microsoft 公式パッケージ
- npm で配布、Expo prebuild 対応
- v1.13 以降フル版 ONNX Runtime を内包 (全オペレータ対応)
- NNAPI (Android) / CoreML (iOS) のハードウェア加速をサポート
- 実績: Whisper、画像分類等のサンプルプロジェクトが複数存在

### Flutter

- **`flutter_onnxruntime`** — コミュニティ製 (2025年4月〜)
  - MIT ライセンス、pub.dev で 150 points / 472 DL
  - ネイティブラッパーで公式 ONNX Runtime ライブラリを呼び出す
  - Android / iOS / Web / Linux / macOS / Windows 対応
  - GPU / ハードウェア加速サポートあり
- **`onnxruntime` (dart:ffi 版)** — もう1つのコミュニティ製
  - 別 Isolate での推論対応 (UI スレッドブロック回避)
  - ネイティブと同等の推論速度を謳う
  - 2025年後半にメンテナ不在 → fork 版 `onnxruntime_v2` が登場
- **`fonnx`** — 別のコミュニティ製
  - 6プラットフォーム対応だが **GPL v2 ライセンス** (商用は有料)

### 判定

```
React Native: ◎ Microsoft 公式パッケージ。安定性・継続性に優れる
Flutter:      ○ 動作はするが、どのパッケージもコミュニティ製で成熟度が低い
              メンテナ交代やforkの発生が既に起きている
```

---

## 2. Canvas / 描画性能 (アルファ編集に直結)

### React Native

- **react-native-skia** (@shopify/react-native-skia)
  - Skia エンジンを React Native に持ち込むライブラリ
  - GPU 加速、ピクセルバッファへの直接アクセス可能
  - タッチ描画の実績多数 (ドローイングアプリ等)
  - JSI ベースでブリッジオーバーヘッドなし

### Flutter

- **CustomPainter + Canvas API** (フレームワーク標準)
  - Flutter 自体が Skia / Impeller でレンダリングしており、
    Canvas API がフレームワークに組み込み済み
  - 追加ライブラリ不要でピクセルレベルの描画が可能
  - `dart:ui` の `Image.toByteData()` でピクセルデータ取得

### 判定

```
React Native: ○ react-native-skia で同等の描画力を獲得。追加依存が必要
Flutter:      ◎ 描画エンジンが組み込みで、Canvas操作がファーストクラス
```

---

## 3. カメラ (リアルタイム合成に必須)

### React Native

- **react-native-vision-camera**
  - Frame Processor でフレーム単位の処理が可能
  - Worklet (JSI) ベースで高速
  - Skia との連携実績あり

### Flutter

- **camera** (公式プラグイン) + **CameraController**
  - 標準的なカメラプレビュー・撮影
  - フレーム単位のストリーム処理 (`startImageStream`)
  - CustomPainter と組み合わせてオーバーレイ描画

### 判定

```
React Native: ◎ Frame Processor が強力でリアルタイム処理に向く
Flutter:      ○ startImageStream で可能だが、フレーム処理のDX がやや煩雑
```

---

## 4. 開発体験・エコシステム

| 観点 | React Native | Flutter |
|------|-------------|---------|
| 言語 | TypeScript (JS経験者が多い) | Dart (学習コストあり) |
| 既存コード流用 | React プロトタイプの知識・ロジックを活かせる | 全面書き直し |
| パッケージ数 | npm 巨大エコシステム | pub.dev は小規模だが成長中 |
| ホットリロード | ○ Fast Refresh | ◎ Hot Reload (より高速・安定) |
| ビルド速度 | △ Gradle/Xcode に依存 | ○ やや速い |
| デバッグ | ○ Flipper, Chrome DevTools | ◎ DevTools が統合的 |
| Expo 対応 | ◎ prebuild で簡易化 | — (不要: CLI 標準で十分) |

---

## 5. パフォーマンス比較

| 観点 | React Native | Flutter |
|------|-------------|---------|
| UI レンダリング | ネイティブコンポーネント + Skia | 自前 Skia/Impeller (GPU直接) |
| アニメーション | Reanimated + Skia で 60fps 可 | 標準で 60-120fps |
| 重い画像処理 | JSI で同期呼出し可能 | Isolate で UI ブロック回避 |
| アプリサイズ | 初期 ~15-20MB | 初期 ~20-25MB (Skia同梱) |
| 起動速度 | Hermes で高速化 | AOT コンパイルで高速 |

Flutter は描画がフレームワークの根幹にあるため、
カスタムUI・アニメーション系では一般的に React Native より有利。
ただし react-native-skia の登場でその差は大幅に縮まっている。

---

## 6. 本プロジェクト固有のリスク

### React Native を選んだ場合のリスク

- react-native-skia でのピクセル直接操作が、Flutter の Canvas ほど
  ドキュメント化されていない (描画は得意だがピクセル読み書きの事例が少ない)
- onnxruntime-react-native は公式だが、画像セグメンテーションモデルの
  実機実績が画像分類ほど多くない

### Flutter を選んだ場合のリスク

- ONNX Runtime パッケージがすべてコミュニティ製
  → メンテナ離脱で fork が既に発生 (onnxruntime → onnxruntime_v2)
  → withoutBG のモデルが使う全オペレータをサポートしているか要検証
- Dart の習得コスト (TypeScript 経験者が前提の場合)
- 既存の React プロトタイプのコード・知見がまったく活かせない

---

## 7. 総合判定

```
                         React Native    Flutter
─────────────────────────────────────────────────
ONNX Runtime 信頼性       ◎ 公式          △ コミュニティ製
Canvas / 描画             ○              ◎
カメラ連携                 ◎              ○
既存コード流用             ◎              ×
学習コスト                 ◎ (TS)         △ (Dart)
UI カスタム自由度          ○              ◎
長期メンテナンス           ○              ○
─────────────────────────────────────────────────
総合                      ★★★★☆         ★★★☆☆
```

### 結論: 本プロジェクトでは React Native を維持推奨

理由を優先度順に並べると:

1. **ONNX Runtime の信頼性が決定的**
   — このプロジェクトは ONNX 推論が動くことが大前提。
   Microsoft 公式パッケージがある React Native の方がリスクが小さい。
   Flutter 側はメンテナ交代が既に起きており、withoutBG のような
   複雑なマルチステージモデルが確実に動く保証がない。

2. **既存資産の活用**
   — React で作った alpha_stamp_editor のロジックと設計知見を流用できる。
   Flutter だと Dart で全面書き直しになる。

3. **TypeScript の汎用性**
   — 将来 Web 版も並行して維持する場合、React / React Native で
   コードを共有しやすい。

### Flutter が有利になるケース

逆に以下の条件が揃えば Flutter の方が良い場合もある:

- チームに Dart / Flutter 経験者がいる
- 既存の React コードを捨ててよい
- ONNX ではなく TFLite に変換してモデルを動かす方針に切り替えられる
  (TFLite は Flutter との連携が `tflite_flutter` で比較的安定している)
- Canvas 描画の品質を最重視し、react-native-skia に不安がある

---

## 補足: TFLite 変換という選択肢

Flutter を選ぶ場合の ONNX リスクを回避する手段として、
withoutBG の ONNX モデルを TensorFlow Lite に変換する方法がある。

```
ONNX モデル → onnx-tf (変換ツール) → SavedModel → TFLite
```

ただし、withoutBG の4段パイプライン (Depth → ISNet → Matting → Refiner)
のすべてが正しく変換できるかは未検証であり、変換時の精度劣化リスクもある。

この変換検証にかかる工数 vs React Native でそのまま ONNX を使う工数を
天秤にかけると、現時点では React Native の方が確実性が高い。
