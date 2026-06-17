import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://ataurshaikh7.github.io/halalfolio/ — assets must resolve
// under the repo sub-path. Override with VITE_BASE for other hosts (e.g. "/").
const base = process.env.VITE_BASE ?? '/halalfolio/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
