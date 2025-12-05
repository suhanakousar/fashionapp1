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
      output: {
        manualChunks: undefined, // Let Vite handle chunking automatically
      },
      onwarn(warning, warn) {
        // Only suppress externalization warnings, show others
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
            warning.message.includes('externalize') ||
            warning.message.includes('external module')) {
          return;
        }
        warn(warning);
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Ensure proper chunking
    chunkSizeWarningLimit: 1000,
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
