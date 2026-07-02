// Keep the Lovable wrapper for local dev defaults, but disable its Cloudflare build plugin.
// Nitro is the canonical deployment adapter for Vercel-backed TanStack Start builds.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";
import type { PluginOption } from "vite";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  ensureQaBuildOutputNodeModulesLink,
  resolveQaRuntimePaths,
} from "./scripts/lib/qa-runtime-paths.mjs";

const rootDir = process.cwd();
const qaRuntimePaths = resolveQaRuntimePaths({ rootDir });
const isVercelBuild = process.env.VERCEL === "1" || process.env.NOW_BUILDER === "1";
const useLocalGeneratedBuildRoot = !isVercelBuild;

if (useLocalGeneratedBuildRoot) {
  ensureQaBuildOutputNodeModulesLink({ rootDir });
}

const isDevServerCommand =
  process.env.npm_lifecycle_event === "dev" ||
  process.argv.some((argument) => argument === "dev" || argument === "serve");

const nitroPublicOutputDir = useLocalGeneratedBuildRoot
  ? qaRuntimePaths.nitroPublicDir
  : resolve(rootDir, ".output/public");
const clientPublicSnapshotDir = qaRuntimePaths.publicSnapshotDir;
const sourcePublicDir = resolve(rootDir, "public");
const localNitroConfig = useLocalGeneratedBuildRoot
  ? {
      buildDir: qaRuntimePaths.nitroBuildDir,
      output: isDevServerCommand
        ? {
            dir: qaRuntimePaths.nitroDevOutputDir,
            publicDir: qaRuntimePaths.nitroDevPublicDir,
            serverDir: qaRuntimePaths.nitroDevServerDir,
          }
        : {
            dir: qaRuntimePaths.nitroOutputDir,
            publicDir: qaRuntimePaths.nitroPublicDir,
            serverDir: qaRuntimePaths.nitroServerDir,
          },
    }
  : undefined;

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
    writeBundle() {
      if (this.environment.name !== "client") {
        return;
      }

      snapshotClientPublicOutput();
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

function hitoNitroServiceOutputLifecycle(): PluginOption {
  return {
    name: "hito:nitro-service-output-lifecycle",
    enforce: "post",
    configEnvironment(name, config) {
      if (
        name !== "ssr" ||
        resolve(config.build?.outDir ?? "") !== qaRuntimePaths.nitroSsrServiceDir
      ) {
        return;
      }

      config.build.emptyOutDir = false;
    },
  };
}

function restoreNitroPublicAssets(): void {
  mkdirSync(nitroPublicOutputDir, { recursive: true });

  if (existsSync(clientPublicSnapshotDir)) {
    cpSync(clientPublicSnapshotDir, nitroPublicOutputDir, { recursive: true });
  }

  if (existsSync(sourcePublicDir)) {
    cpSync(sourcePublicDir, nitroPublicOutputDir, { recursive: true });
  }
}

function snapshotClientPublicOutput(): void {
  if (!existsSync(nitroPublicOutputDir)) {
    return;
  }

  mkdirSync(clientPublicSnapshotDir, { recursive: true });
  cpSync(nitroPublicOutputDir, clientPublicSnapshotDir, { recursive: true });
}

export default defineConfig({
  cloudflare: false,
  plugins: [
    hitoNitroPublicAssetsVirtualRestore(),
    ...nitro(),
    hitoNitroServiceOutputLifecycle(),
    hitoNitroPublicAssetsRestore(),
  ],
  vite: {
    cacheDir: useLocalGeneratedBuildRoot ? qaRuntimePaths.viteCacheDir : undefined,
    nitro: localNitroConfig,
    build: {
      emptyOutDir: false,
    },
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  },
});
