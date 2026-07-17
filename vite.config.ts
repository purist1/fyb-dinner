import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [tsConfigPaths(), tanstackStart({
    server: { entry: "server" },
  }), tailwindcss(), cloudflare({
    viteEnvironment: {
      name: "ssr"
    }
  })],
});