import { useRef, useState } from "react";
import { ScreenLayout } from "../components/ScreenLayout";
import { getServerUrl } from "../hooks/useServerUrl";

type Stage = "select" | "processing" | "done" | "error";

export function ClipperScreen() {
  const [stage, setStage] = useState<Stage>("select");
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    setResultUrl(null);
    setStage("select");
  }

  async function handleProcess() {
    if (!fileRef.current?.files?.[0]) return;

    setStage("processing");
    setError("");

    const formData = new FormData();
    formData.append("file", fileRef.current.files[0]);

    try {
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/api/remove-background`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStage("error");
    }
  }

  function handleDownload() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "cutout.png";
    a.click();
  }

  function handleUseInEditor() {
    if (!resultUrl) return;
    // Store the result blob URL for the alpha editor to pick up
    sessionStorage.setItem("cutcam_clipper_result", resultUrl);
    window.location.href = "/alpha-editor";
  }

  return (
    <ScreenLayout title="Clipper">
      <div style={styles.content}>
        {/* File input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />

        {!sourceUrl && (
          <div style={styles.dropzone}>
            <button
              className="btn-primary"
              style={{ fontSize: 16, padding: "14px 32px" }}
              onClick={() => fileRef.current?.click()}
            >
              写真を選択 / 撮影
            </button>
            <p style={styles.hint}>カメラで撮影するか、ライブラリから選択</p>
          </div>
        )}

        {sourceUrl && (
          <>
            <div style={styles.preview}>
              <div style={styles.imageRow}>
                <div style={styles.imageBox}>
                  <p style={styles.imageLabel}>元画像</p>
                  <img src={sourceUrl} alt="source" style={styles.img} />
                </div>
                {resultUrl && (
                  <div style={styles.imageBox}>
                    <p style={styles.imageLabel}>結果</p>
                    <div style={styles.checkerboard}>
                      <img src={resultUrl} alt="result" style={styles.img} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.actions}>
              {stage === "select" && (
                <>
                  <button className="btn-primary" onClick={handleProcess}>
                    背景を除去
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => fileRef.current?.click()}
                  >
                    別の写真を選択
                  </button>
                </>
              )}

              {stage === "processing" && (
                <div style={styles.loading}>
                  <div style={styles.spinner} />
                  <p>処理中... PCサーバーで背景を除去しています</p>
                </div>
              )}

              {stage === "done" && (
                <>
                  <button className="btn-primary" onClick={handleUseInEditor}>
                    Alpha Editor で編集
                  </button>
                  <button className="btn-secondary" onClick={handleDownload}>
                    ダウンロード
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setSourceUrl(null);
                      setResultUrl(null);
                      setStage("select");
                    }}
                  >
                    新しい画像
                  </button>
                </>
              )}

              {stage === "error" && (
                <>
                  <p style={{ color: "#f44336" }}>エラー: {error}</p>
                  <button className="btn-primary" onClick={handleProcess}>
                    再試行
                  </button>
                  <p style={styles.hint}>
                    サーバー設定を確認してください
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </ScreenLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: 16,
    gap: 16,
  },
  dropzone: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    border: "2px dashed var(--border)",
    borderRadius: 12,
    padding: 32,
  },
  hint: {
    fontSize: 12,
    color: "var(--text-secondary)",
    textAlign: "center",
  },
  preview: {
    flex: 1,
    overflow: "auto",
  },
  imageRow: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
  },
  imageBox: {
    flex: 1,
    maxWidth: "50%",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  imageLabel: {
    fontSize: 11,
    color: "var(--text-secondary)",
    textAlign: "center",
  },
  img: {
    width: "100%",
    height: "auto",
    borderRadius: 8,
    objectFit: "contain",
    maxHeight: "50vh",
  },
  checkerboard: {
    background:
      "repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 50% / 16px 16px",
    borderRadius: 8,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "stretch",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: 20,
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
