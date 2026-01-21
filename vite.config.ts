import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      'seal-app-pvqi4.ondigitalocean.app',
      '.ondigitalocean.app' // Allow all Digital Ocean app subdomains
    ]
  }
})
