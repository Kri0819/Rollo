import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  plugins: [react(), VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.js',
    registerType:'autoUpdate',
    injectManifest:{ globPatterns:['**/*.{js,css,html,ico,png,svg}'] },
    includeAssets:['favicon-32.png','favicon-16.png','favicon-32-dark.png','favicon-16-dark.png','apple-touch-icon.png'],
    manifest:{
      name:'ReCon｜再聯絡',short_name:'再聯絡',
      description:'個案聯絡與訪視提醒工具',
      theme_color:'#2F4E6E',background_color:'#F8F7F4',
      display:'standalone',orientation:'portrait',start_url:'/',
      icons:[
        {src:'pwa-192.png',sizes:'192x192',type:'image/png'},
        {src:'pwa-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}
      ]
    }
  })]
})
