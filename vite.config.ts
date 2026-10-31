import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Accept Vite-style names and Next.js-style names, since Supabase's dashboard
  // shows the NEXT_PUBLIC_ variants while this app is built with Vite.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
