import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  nodePolyfills({
      // To ensure XRPL.js works in the browser
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    tailwindcss(),
  ],
  resolve: {
  alias: {
    stream: 'stream-browserify',
  },
}, 
})
