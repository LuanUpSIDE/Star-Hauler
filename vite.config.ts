import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/<SEU-REPOSITORIO>/', // Substitua <SEU-REPOSITORIO> pelo nome do seu repositório
});