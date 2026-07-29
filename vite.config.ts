import { fileURLToPath, URL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { transformSync } from "esbuild";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";

const dir = fileURLToPath(new URL(".", import.meta.url));

function trackerMinifyPlugin(): import("vite").Plugin {
  return {
    name: "tracker-minify",
    buildStart() {
      const src = resolve(dir, "public/tracker.js");
      const dest = resolve(dir, "public/tracker.min.js");
      const code = readFileSync(src, "utf-8");
      const result = transformSync(code, {
        minify: true,
        sourcemap: false,
        target: "es2015"
      });
      writeFileSync(dest, result.code, "utf-8");
      console.log(`✓ regenerated tracker.min.js (${result.code.length} bytes)`);
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
