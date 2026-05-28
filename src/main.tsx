import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource-variable/dm-sans";
import "@fontsource/dm-serif-display";

createRoot(document.getElementById("root")!).render(<App />);
