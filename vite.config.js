import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/mediapipe_facemesh_demo/',
  plugins: [react()],
})
