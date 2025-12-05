import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
      external: [], // Don't externalize anything - bundle everything
      onwarn(warning, warn) {
        // Suppress specific warnings that can cause false errors
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.message?.includes('lucide-react')) return;
        if (warning.message?.includes('externalize')) return;
        if (warning.message?.includes('external')) return;
        // Only show actual errors, suppress warnings
        if (warning.code?.startsWith('PLUGIN_')) return;
        warn(warning);
      },
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: (id) => {
          // Don't tree-shake lucide-react
          if (id.includes('lucide-react')) return true;
          return false;
        },
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "framer-motion", "lucide-react"],
    esbuildOptions: {
      target: "es2020",
    },
  },
  ssr: {
    noExternal: ["lucide-react"],
  },
  // Ensure all dependencies are bundled
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});
