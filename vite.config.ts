// Keep the Lovable wrapper for local dev defaults, but disable its Cloudflare build plugin.
// Nitro is the canonical deployment adapter for Vercel-backed TanStack Start builds.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";
import type { PluginOption } from "vite";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const isDevServerCommand =
  process.env.npm_lifecycle_event === "dev" ||
  process.argv.some((argument) => argument === "dev" || argument === "serve");

const nitroPublicOutputDir = resolve(process.cwd(), ".output/public");
const sourcePublicDir = resolve(process.cwd(), "public");

function hitoNitroPublicAssetsVirtualRestore(): PluginOption {
  return {
    name: "hito:nitro-public-assets-virtual-restore",
    apply: "build",
    enforce: "pre",
    resolveId: {
      order: "pre",
      handler(id) {
        if (id === "#nitro/virtual/public-assets-data") {
          restoreNitroPublicAssets();
        }

        return null;
      },
    },
    load: {
      order: "pre",
      handler(id) {
        if (id === "#nitro/virtual/public-assets-data") {
          restoreNitroPublicAssets();
        }

        return null;
      },
    },
  };
}

function hitoNitroPublicAssetsRestore(): PluginOption {
  return {
    name: "hito:nitro-public-assets-restore",
    apply: "build",
    buildStart: {
      order: "post",
      handler() {
        if (this.environment.name !== "nitro") {
          return;
        }

        restoreNitroPublicAssets();
      },
    },
  };
}

function restoreNitroPublicAssets(): void {
  mkdirSync(nitroPublicOutputDir, { recursive: true });

  if (existsSync(sourcePublicDir)) {
    cpSync(sourcePublicDir, nitroPublicOutputDir, { recursive: true });
  }
}

export default defineConfig({
  cloudflare: false,
  plugins: [hitoNitroPublicAssetsVirtualRestore(), ...nitro(), hitoNitroPublicAssetsRestore()],
  vite: {
    nitro: isDevServerCommand
      ? {
          output: {
            dir: "node_modules/.nitro/dev-output",
            publicDir: "node_modules/.nitro/dev-output/public",
            serverDir: "node_modules/.nitro/dev-output/server",
          },
        }
      : undefined,
    build: {
      emptyOutDir: false,
    },
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  },
});
