import { defineConfig, loadEnv } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import viteTsConfigPaths from "vite-tsconfig-paths"
import tailwindcss from "@tailwindcss/vite"
import { nitro } from "nitro/vite"

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget = env["services__api__http__0"] || env.VITE_API_TARGET || "http://localhost:5000"
  const isVitest = process.env.VITEST === "true"

  return {
    plugins: isVitest
      ? [
          viteTsConfigPaths({
            projects: ["./tsconfig.json"],
          }),
          tailwindcss(),
          viteReact(),
        ]
      : [
          devtools(),
          nitro(),
          // this is the plugin that enables path aliases
          viteTsConfigPaths({
            projects: ["./tsconfig.json"],
          }),
          tailwindcss(),
          tanstackStart(),
          viteReact(),
        ],
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.tsx",
      clearMocks: true,
    },
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    server: {
      port: parseInt(env.VITE_PORT) || 3000,
      proxy: {
        "/hubs": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  }
})

export default config
