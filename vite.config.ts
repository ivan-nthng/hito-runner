// Keep the Lovable wrapper for local dev defaults, but disable its Cloudflare build plugin.
// Nitro is the canonical deployment adapter for Vercel-backed TanStack Start builds.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";
import type { PluginOption } from "vite";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const isDevServerCommand =
  process.env.npm_lifecycle_event === "dev" ||
  process.argv.some((argument) => argument === "dev" || argument === "serve");

const nitroPublicOutputDir = resolve(process.cwd(), ".output/public");
const nitroServerOutputDir = resolve(process.cwd(), ".output/server");
const nitroStagedClientPublicDir = resolve(process.cwd(), "node_modules/.nitro/vite/public");
const nitroStagedServerOutputDir = resolve(process.cwd(), "node_modules/.nitro/vite/server-output");
const sourcePublicDir = resolve(process.cwd(), "public");

function nitroPluginsWithoutMidBuildPrepare(): PluginOption[] {
  return (nitro() as PluginOption[]).filter((plugin) => !isNitroPreparePlugin(plugin));
}

function isNitroPreparePlugin(plugin: PluginOption): boolean {
  return Boolean(
    plugin &&
    typeof plugin === "object" &&
    !Array.isArray(plugin) &&
    "name" in plugin &&
    plugin.name === "nitro:prepare",
  );
}

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

function hitoNitroPublicAssetsStabilizer(): PluginOption {
  return {
    name: "hito:nitro-public-assets-stabilizer",
    apply: "build",
    configEnvironment(_name, config) {
      if (config.consumer !== "client") {
        return;
      }

      // Keep generated client chunks out of Nitro's final output while Nitro is still preparing it.
      config.build.outDir = nitroStagedClientPublicDir;
      config.build.emptyOutDir = true;
      config.build.copyPublicDir = false;
    },
    buildStart: {
      order: "post",
      handler() {
        if (this.environment.name !== "nitro") {
          return;
        }

        restoreNitroPublicAssets();
      },
    },
    closeBundle: {
      order: "post",
      handler() {
        if (this.environment.name !== "nitro") {
          return;
        }

        stageNitroServerOutput();
        restoreNitroPublicAssets();
      },
    },
    buildApp: {
      order: "post",
      handler() {
        restoreNitroBuildOutput();
      },
    },
  };
}

function stageNitroServerOutput(): void {
  if (!existsSync(nitroServerOutputDir)) {
    return;
  }

  rmSync(nitroStagedServerOutputDir, { recursive: true, force: true });
  mkdirSync(nitroStagedServerOutputDir, { recursive: true });
  cpSync(nitroServerOutputDir, nitroStagedServerOutputDir, { recursive: true });
}

function restoreNitroBuildOutput(): void {
  restoreNitroPublicAssets();

  if (existsSync(nitroStagedServerOutputDir)) {
    mkdirSync(nitroServerOutputDir, { recursive: true });
    cpSync(nitroStagedServerOutputDir, nitroServerOutputDir, { recursive: true });
  }
}

function restoreNitroPublicAssets(): void {
  mkdirSync(nitroPublicOutputDir, { recursive: true });

  for (const sourceDir of [nitroStagedClientPublicDir, sourcePublicDir]) {
    if (existsSync(sourceDir)) {
      cpSync(sourceDir, nitroPublicOutputDir, { recursive: true });
    }
  }
}

export default defineConfig({
  cloudflare: false,
  plugins: [
    hitoNitroPublicAssetsVirtualRestore(),
    ...nitroPluginsWithoutMidBuildPrepare(),
    hitoNitroPublicAssetsStabilizer(),
  ],
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
