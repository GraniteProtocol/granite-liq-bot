import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 5137,
  },
  preview: {
    host: true,
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 5137,
  }
})
