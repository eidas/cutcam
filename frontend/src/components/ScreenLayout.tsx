import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  title: string;
  children: ReactNode;
}

export function ScreenLayout({ title, children }: Props) {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.back} onClick={() => navigate("/")}>
          ← 戻る
        </button>
        <h1 style={styles.title}>{title}</h1>
        <div style={{ width: 60 }} />
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--bg-primary)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  back: {
    background: "none",
    color: "var(--accent)",
    padding: "4px 8px",
    fontSize: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
  },
  main: {
    flex: 1,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
  },
};
