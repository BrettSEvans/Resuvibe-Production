import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource-variable/dm-sans";
import "@fontsource/dm-serif-display";

// Validate required environment variables at startup
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing required environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_PUBLISHABLE_KEY. " +
    "Please check your .env file and ensure both are set."
  );
}

createRoot(document.getElementById("root")!).render(<App />);
