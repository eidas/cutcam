import { useCallback, useEffect, useRef, useState } from "react";
import { ScreenLayout } from "../components/ScreenLayout";

export function CompositorScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayImg = useRef<HTMLImageElement | null>(null);
  const animRef = useRef<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [hasOverlay, setHasOverlay] = useState(false);
  const [overlayPos, setOverlayPos] = useState({ x: 50, y: 50 });
  const [overlayScale, setOverlayScale] = useState(0.5);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("environment");

  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Start camera
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasCamera(true);
      }
    } catch (err) {
      console.error("Camera access failed:", err);
    }
  }, []);

  useEffect(() => {
    startCamera(cameraFacing);
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, [cameraFacing, startCamera]);

  // Load overlay from editor result
  useEffect(() => {
    const editorResult = sessionStorage.getItem("cutcam_editor_result");
    if (editorResult) {
      sessionStorage.removeItem("cutcam_editor_result");
      loadOverlay(editorResult);
    }
  }, []);

  function loadOverlay(src: string) {
    const img = new Image();
    img.onload = () => {
      overlayImg.current = img;
      setHasOverlay(true);
    };
    img.src = src;
  }

  // Render loop: camera + overlay composite
  useEffect(() => {
    if (!hasCamera) return;

    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, w, h);

      // Draw overlay
      if (overlayImg.current && hasOverlay) {
        const img = overlayImg.current;
        const ow = img.width * overlayScale;
        const oh = img.height * overlayScale;
        const ox = (overlayPos.x / 100) * w - ow / 2;
        const oy = (overlayPos.y / 100) * h - oh / 2;
        ctx.drawImage(img, ox, oy, ow, oh);
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [hasCamera, hasOverlay, overlayPos, overlayScale]);

  // Drag overlay position
  function handleTouchStart(e: React.TouchEvent) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    dragStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      ox: overlayPos.x,
      oy: overlayPos.y,
    };
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!dragStart.current || !canvasRef.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const dx = ((touch.clientX - dragStart.current.x) / rect.width) * 100;
    const dy = ((touch.clientY - dragStart.current.y) / rect.height) * 100;
    setOverlayPos({
      x: Math.max(0, Math.min(100, dragStart.current.ox + dx)),
      y: Math.max(0, Math.min(100, dragStart.current.oy + dy)),
    });
  }

  function handleTouchEnd() {
    dragStart.current = null;
  }

  function handleCapture() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `composite_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <ScreenLayout title="Compositor">
      <div ref={containerRef} style={styles.content}>
        <input
          ref={fileRef}
          type="file"
          accept="image/png"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadOverlay(URL.createObjectURL(file));
          }}
        />

        {/* Hidden video element for camera stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ display: "none" }}
        />

        {/* Composite canvas */}
        <div style={styles.canvasWrap}>
          <canvas
            ref={canvasRef}
            style={styles.canvas}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          {!hasCamera && (
            <div style={styles.overlay}>
              <p>カメラへのアクセスを許可してください</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={styles.toolbar}>
          {hasOverlay && (
            <div style={styles.sliderRow}>
              <span style={styles.sliderLabel}>
                オーバーレイサイズ: {Math.round(overlayScale * 100)}%
              </span>
              <input
                type="range"
                min={10}
                max={200}
                value={overlayScale * 100}
                onChange={(e) => setOverlayScale(Number(e.target.value) / 100)}
              />
            </div>
          )}

          <div style={styles.btnRow}>
            <button
              className="btn-secondary"
              onClick={() => fileRef.current?.click()}
              style={{ flex: 1 }}
            >
              {hasOverlay ? "別の画像" : "オーバーレイ画像を選択"}
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                setCameraFacing((f) => (f === "user" ? "environment" : "user"))
              }
            >
              🔄
            </button>
          </div>

          <button
            className="btn-primary"
            onClick={handleCapture}
            disabled={!hasCamera}
            style={{ width: "100%" }}
          >
            📸 キャプチャ
          </button>

          {!hasOverlay && (
            <p style={styles.hint}>
              Clipper → Alpha Editor → ここ の順に使うと、
              切り抜き画像がカメラ映像に自動で合成されます
            </p>
          )}
        </div>
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
  canvasWrap: {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
    overflow: "hidden",
  },
  canvas: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    touchAction: "none",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.7)",
    color: "var(--text-secondary)",
    fontSize: 14,
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
  btnRow: {
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
  hint: {
    fontSize: 11,
    color: "var(--text-secondary)",
    textAlign: "center",
    lineHeight: 1.5,
  },
};
