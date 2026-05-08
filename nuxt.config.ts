// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ignore: ['**/src-tauri/**'],
  ssr: false,

  devtools: { enabled: false },

  devServer: {
    port: 3000,
    host: '0.0.0.0'
  },
  modules: ['@nuxt/eslint', '@nuxt/ui', '@pinia/nuxt'],

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

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
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap'
        }
      ]
    }
  },

  vite: {
    clearScreen: false,
    server: {
      strictPort: true,
      watch: {
        ignored: ['**/src-tauri/**']
      },
      hmr: {
        protocol: 'ws',
        host: '0.0.0.0',
        port: 3001,
      },
    },
    envPrefix: ['VITE_', 'TAURI_'],
  },

  nitro: {
    ignore: ['src-tauri/**']
  },
})