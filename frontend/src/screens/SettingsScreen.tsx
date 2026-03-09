import { useState } from "react";
import { ScreenLayout } from "../components/ScreenLayout";
import { getServerUrl, setServerUrl } from "../hooks/useServerUrl";

export function SettingsScreen() {
  const [url, setUrl] = useState(getServerUrl());
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");

  async function handleCheck() {
    setStatus("checking");
    try {
      const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        setServerUrl(url);
        setStatus("ok");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  function handleSave() {
    setServerUrl(url);
    setStatus("idle");
  }

  return (
    <ScreenLayout title="サーバー設定">
      <div style={styles.content}>
        <label style={styles.label}>
          バックエンドサーバーURL
          <span style={styles.hint}>
            同一LAN内のPCで起動中のFastAPIサーバーのURLを入力
          </span>
        </label>
        <input
          style={styles.input}
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setStatus("idle");
          }}
          placeholder="http://192.168.1.100:8000"
        />
        <div style={styles.buttons}>
          <button className="btn-secondary" onClick={handleCheck}>
            {status === "checking" ? "確認中..." : "接続テスト"}
          </button>
          <button className="btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
        {status === "ok" && (
          <p style={{ color: "#4caf50", marginTop: 8 }}>接続成功 ✓</p>
        )}
        {status === "error" && (
          <p style={{ color: "#f44336", marginTop: 8 }}>
            接続失敗 — URLを確認してください
          </p>
        )}
        <div style={styles.helpBox}>
          <p style={styles.helpTitle}>セットアップ手順:</p>
          <ol style={styles.helpList}>
            <li>PC で <code>cd backend && pip install -r requirements.txt</code></li>
            <li><code>uvicorn main:app --host 0.0.0.0 --port 8000</code></li>
            <li>PC のローカルIPアドレスを確認 (例: 192.168.1.100)</li>
            <li>上のフィールドに <code>http://&lt;PC_IP&gt;:8000</code> を入力</li>
          </ol>
        </div>
      </div>
    </ScreenLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  content: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  hint: {
    fontSize: 12,
    color: "var(--text-secondary)",
    fontWeight: 400,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    width: "100%",
  },
  buttons: {
    display: "flex",
    gap: 12,
  },
  helpBox: {
    marginTop: 20,
    padding: 16,
    background: "var(--bg-secondary)",
    borderRadius: 8,
    border: "1px solid var(--border)",
  },
  helpTitle: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 13,
  },
  helpList: {
    paddingLeft: 20,
    fontSize: 12,
    lineHeight: 1.8,
    color: "var(--text-secondary)",
  },
};
