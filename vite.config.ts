import { fileURLToPath, URL } from "node:url";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";

const dir = fileURLToPath(new URL(".", import.meta.url));

function trackerMinifyPlugin(): import("vite").Plugin {
  return {
    name: "tracker-minify",
    async buildStart() {
      const src = resolve(dir, "src/tracker/tracker.js");
      const dest = resolve(dir, "public/tracker.min.js");
      const result = await build({
        entryPoints: [src],
        bundle: true,
        minify: true,
        format: "iife",
        target: "es2015",
        write: false,
        logLevel: "silent"
      });
      writeFileSync(dest, result.outputFiles[0].text, "utf-8");
      console.log(`✓ regenerated tracker.min.js (${result.outputFiles[0].text.length} bytes)`);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  css: { postcss: { plugins: [tailwind(), autoprefixer()] } },
  plugins: [vue(), trackerMinifyPlugin()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { host: "0.0.0.0", port: 52101 }
});
