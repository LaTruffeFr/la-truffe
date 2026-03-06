import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const projectId = env.VITE_SUPABASE_PROJECT_ID || "gbevncdgkbgcjkeodter";
  const publishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZXZuY2Rna2JnY2prZW9kdGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjY3MjgsImV4cCI6MjA4MzEwMjcyOH0.rCGwy2kc7TcKLkhVnnmK5MHM3MHDatZ1f8Zn52RZBGo";

  return {
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(`https://${projectId}.supabase.co`),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(publishableKey),
    },
  };
});
