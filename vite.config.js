import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// `base: './'` keeps the built assets relative so the app works from any
// static host (GitHub Pages project sites, Vercel, a plain file server).
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
