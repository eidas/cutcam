import { useNavigate } from "react-router-dom";

const tools = [
  {
    id: "clipper",
    path: "/clipper",
    name: "Clipper",
    description: "写真の背景を除去",
    icon: "✂️",
  },
  {
    id: "alpha-editor",
    path: "/alpha-editor",
    name: "Alpha Editor",
    description: "アルファ値を手動編集",
    icon: "🖌️",
  },
  {
    id: "compositor",
    path: "/compositor",
    name: "Compositor",
    description: "カメラ映像と合成",
    icon: "📷",
  },
] as const;

export function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>CutCam</h1>
        <p style={styles.subtitle}>画像ワークフローツール</p>
      </header>

      <div style={styles.grid}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            style={styles.card}
            onClick={() => navigate(tool.path)}
          >
            <span style={styles.icon}>{tool.icon}</span>
            <span style={styles.cardName}>{tool.name}</span>
            <span style={styles.cardDesc}>{tool.description}</span>
          </button>
        ))}
      </div>

      <button
        style={styles.settingsBtn}
        onClick={() => navigate("/settings")}
      >
        ⚙️ サーバー設定
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: 24,
    gap: 32,
  },
  header: {
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: "var(--accent)",
  },
  subtitle: {
    fontSize: 14,
    color: "var(--text-secondary)",
    marginTop: 4,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    width: "100%",
    maxWidth: 360,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: 20,
    background: "var(--bg-card)",
    borderRadius: 12,
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  },
  icon: {
    fontSize: 32,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 700,
  },
  cardDesc: {
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  settingsBtn: {
    background: "none",
    color: "var(--text-secondary)",
    fontSize: 13,
    padding: "8px 16px",
  },
};
