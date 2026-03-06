import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const publishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZXZuY2Rna2JnY2prZW9kdGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjY3MjgsImV4cCI6MjA4MzEwMjcyOH0.rCGwy2kc7TcKLkhVnnmK5MHM3MHDatZ1f8Zn52RZBGo";

  const decodeJwtPayload = (jwt: string): Record<string, string> | null => {
    try {
      const base64 = jwt.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
      if (!base64) return null;
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
    } catch {
      return null;
    }
  };

  const keyPayload = decodeJwtPayload(publishableKey);
  const refFromKey = keyPayload?.ref;
  const inferredSupabaseUrl = refFromKey ? `https://${refFromKey}.supabase.co` : undefined;
  const supabaseUrl = inferredSupabaseUrl || env.VITE_SUPABASE_URL || "https://gbevncdgkbgcjkeodter.supabase.co";

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
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(publishableKey),
    },
  };
});
