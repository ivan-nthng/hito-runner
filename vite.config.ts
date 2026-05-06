// Keep the Lovable wrapper for local dev defaults, but disable its Cloudflare build plugin.
// Nitro is the canonical deployment adapter for Vercel-backed TanStack Start builds.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  cloudflare: false,
  plugins: [nitro()],
  vite: {
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  },
});
