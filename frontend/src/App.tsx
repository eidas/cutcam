import { Routes, Route, Navigate } from "react-router-dom";
import { HomeScreen } from "./screens/HomeScreen";
import { ClipperScreen } from "./screens/ClipperScreen";
import { AlphaEditorScreen } from "./screens/AlphaEditorScreen";
import { CompositorScreen } from "./screens/CompositorScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/clipper" element={<ClipperScreen />} />
      <Route path="/alpha-editor" element={<AlphaEditorScreen />} />
      <Route path="/compositor" element={<CompositorScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
