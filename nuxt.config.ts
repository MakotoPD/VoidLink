// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  devtools: { enabled: true },

  devServer: {
    port: 3000,
    host: '0.0.0.0'
  },
  modules: ['@nuxt/eslint', '@nuxt/ui', '@pinia/nuxt'],


  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  app: {
    head: {
      // Zapobiega błędnemu skalowaniu na urządzeniach mobilnych/tabletach
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
    }
  },

  vite: {
    clearScreen: false,
    server: {
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host: '0.0.0.0',
        port: 3001,
      },
    },
    envPrefix: ['VITE_', 'TAURI_'],
  },
})