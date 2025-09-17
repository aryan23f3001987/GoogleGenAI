// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react() , tailwindcss()], 
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/static/',   // in production, assets are served from Flask /static/
  build: {
    outDir: 'dist',   // build output directory
    emptyOutDir: true // clean dist before build
  },
  server: {
    proxy: {
      // Proxy API requests during development
      '/get': 'http://localhost:8080',
    },
  },
})
