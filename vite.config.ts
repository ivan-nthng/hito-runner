// Nitro is the canonical deployment adapter for Vercel-backed TanStack Start builds.
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
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
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    react(),
    hitoNitroPublicAssetsVirtualRestore(),
    ...nitro(),
    hitoNitroServiceOutputLifecycle(),
    hitoNitroPublicAssetsRestore(),
  ],
  cacheDir: useLocalGeneratedBuildRoot ? qaRuntimePaths.viteCacheDir : undefined,
  nitro: localNitroConfig,
  build: {
    emptyOutDir: false,
  },
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  server: {
    host: "::",
    port: 8080,
    watch: {
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
    },
  },
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
});
