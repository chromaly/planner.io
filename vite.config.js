import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/planner.io/",
  server: {
    proxy: {
      "/planner.io/api": {
        target: "http://127.0.0.1:8787",
        rewrite: (path) => path.replace(/^\/planner\.io\/api/, ""),
      },
    },
  },
  build: {
  rolldownOptions: {
    input: {
      website: fileURLToPath(new URL("./index.html", import.meta.url)),
      mobile: fileURLToPath(new URL("./mobile/index.html", import.meta.url)),
    },
  },
},
});