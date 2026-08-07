import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this app from /<repo-name>/, so all asset URLs must
  // be prefixed accordingly. Update REPO_NAME if the GitHub repo is renamed.
  base: '/FinTech/',
  plugins: [react(), tailwindcss()],
})
