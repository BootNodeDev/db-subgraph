import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  treeshake: true,
  sourcemap: true,
  minify: true,
  clean: true,
  target: "esnext",
  outDir: "dist",
});
