import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: Defina a base para o nome do seu repositório
  base: "/https://github.com/LuanUpSIDE/Star-Hauler", 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
