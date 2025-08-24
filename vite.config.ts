import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  // Esta linha DEVE corresponder ao nome do seu repositório no GitHub
  base: "/Star-Hauler/", 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})