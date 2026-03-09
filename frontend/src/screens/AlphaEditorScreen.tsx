import { useCallback, useEffect, useRef, useState } from "react";
import { ScreenLayout } from "../components/ScreenLayout";

type Tool = "erase" | "restore";

export function AlphaEditorScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [tool, setTool] = useState<Tool>("erase");
  const [brushSize, setBrushSize] = useState(30);
  const [loaded, setLoaded] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const isDrawing = useRef(false);

  // Load image from clipper result or file
  const loadImage = useCallback((src: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Scale to fit screen while maintaining aspect ratio
      const maxW = containerRef.current?.clientWidth || 360;
      const maxH = (containerRef.current?.clientHeight || 500) - 100;
      const scale = Math.min(1, maxW / img.width, maxH / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      setImageData(data);
      setOriginalImageData(new ImageData(new Uint8ClampedArray(data.data), w, h));
      setLoaded(true);
      setUndoStack([]);
    };
    img.src = src;
  }, []);

  // Try loading from clipper result on mount
  useEffect(() => {
    const clipperResult = sessionStorage.getItem("cutcam_clipper_result");
    if (clipperResult) {
      sessionStorage.removeItem("cutcam_clipper_result");
      loadImage(clipperResult);
    }
  }, [loadImage]);

  function pushUndo() {
    if (!imageData) return;
    const copy = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height,
    );
    setUndoStack((prev) => [...prev.slice(-19), copy]);
  }

  function handleUndo() {
    if (undoStack.length === 0 || !canvasRef.current) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setImageData(prev);
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.putImageData(prev, 0, 0);
  }

  function applyBrush(x: number, y: number) {
    if (!imageData || !canvasRef.current) return;

    const { width, height, data } = imageData;
    const r = brushSize / 2;

    for (let py = Math.max(0, Math.floor(y - r)); py < Math.min(height, Math.ceil(y + r)); py++) {
      for (let px = Math.max(0, Math.floor(x - r)); px < Math.min(width, Math.ceil(x + r)); px++) {
        const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
        if (dist > r) continue;

        const idx = (py * width + px) * 4;
        if (tool === "erase") {
          // Fade alpha based on distance from brush center
          const strength = 1 - dist / r;
          data[idx + 3] = Math.max(0, data[idx + 3] - 255 * strength * 0.3);
        } else {
          // Restore alpha from original
          if (originalImageData) {
            const strength = 1 - dist / r;
            const origAlpha = originalImageData.data[idx + 3];
            data[idx + 3] = Math.min(
              origAlpha,
              data[idx + 3] + (origAlpha - data[idx + 3]) * strength * 0.3,
            );
          }
        }
      }
    }

    const ctx = canvasRef.current.getContext("2d")!;
    ctx.putImageData(imageData, 0, 0);
  }

  function getCanvasPos(e: React.TouchEvent | React.MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handleStart(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    isDrawing.current = true;
    pushUndo();
    const pos = getCanvasPos(e);
    applyBrush(pos.x, pos.y);
  }

  function handleMove(e: React.TouchEvent | React.MouseEvent) {
    if (!isDrawing.current) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    applyBrush(pos.x, pos.y);
  }

  function handleEnd() {
    isDrawing.current = false;
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "edited.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  function handleUseInCompositor() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sessionStorage.setItem("cutcam_editor_result", canvas.toDataURL("image/png"));
    window.location.href = "/compositor";
  }

  return (
    <ScreenLayout title="Alpha Editor">
      <div ref={containerRef} style={styles.content}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadImage(URL.createObjectURL(file));
          }}
        />

        {!loaded && (
          <div style={styles.dropzone}>
            <button
              className="btn-primary"
              onClick={() => fileRef.current?.click()}
            >
              画像を選択
            </button>
            <p style={styles.hint}>
              透過PNG画像のアルファ値を編集できます
            </p>
          </div>
        )}

        {loaded && (
          <>
            {/* Canvas area */}
            <div style={styles.canvasWrap}>
              <div style={styles.checkerboard}>
                <canvas
                  ref={canvasRef}
                  style={styles.canvas}
                  onTouchStart={handleStart}
                  onTouchMove={handleMove}
                  onTouchEnd={handleEnd}
                  onMouseDown={handleStart}
                  onMouseMove={handleMove}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                />
              </div>
            </div>

            {/* Tool controls */}
            <div style={styles.toolbar}>
              <div style={styles.toolRow}>
                <button
                  className={tool === "erase" ? "btn-primary" : "btn-secondary"}
                  onClick={() => setTool("erase")}
                  style={{ flex: 1 }}
                >
                  消しゴム
                </button>
                <button
                  className={tool === "restore" ? "btn-primary" : "btn-secondary"}
                  onClick={() => setTool("restore")}
                  style={{ flex: 1 }}
                >
                  復元
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                >
                  ↩
                </button>
              </div>

              <div style={styles.sliderRow}>
                <span style={styles.sliderLabel}>ブラシ: {brushSize}px</span>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
              </div>

              <div style={styles.toolRow}>
                <button
                  className="btn-primary"
                  onClick={handleUseInCompositor}
                  style={{ flex: 1 }}
                >
                  Compositor で合成
                </button>
                <button className="btn-secondary" onClick={handleDownload}>
                  保存
                </button>
              </div>
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
    overflow: "hidden",
  },
  dropzone: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  hint: {
    fontSize: 12,
    color: "var(--text-secondary)",
    textAlign: "center",
  },
  canvasWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 8,
  },
  checkerboard: {
    background:
      "repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 50% / 16px 16px",
    borderRadius: 8,
    lineHeight: 0,
  },
  canvas: {
    maxWidth: "100%",
    maxHeight: "100%",
    touchAction: "none",
  },
  toolbar: {
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "var(--bg-secondary)",
    borderTop: "1px solid var(--border)",
    flexShrink: 0,
  },
  toolRow: {
    display: "flex",
    gap: 8,
  },
  sliderRow: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: "var(--text-secondary)",
  },
};
