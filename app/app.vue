<template>
  <UApp>
    <NuxtLoadingIndicator color="aqua" errorColor="red"  />
    <div class="bg-gray-950">
      <NuxtLayout>
          <NuxtPage />
      </NuxtLayout>
    </div>
  </UApp>
</template>

<script setup lang="ts">
import { initTrayListener, cleanupTrayListener, updateTrayMenu } from '~/composables/useTray'
import { useServersStore } from '~/stores/useServersStore'
import { useSettingsStore } from '~/stores/useSettingsStore'
import { useAuthStore } from '~/stores/useAuthStore'
import { useTunnelStore } from '~/stores/useTunnelStore'
import { useServerProcessStore } from '~/composables/useServerProcessStore'
import { storeToRefs } from 'pinia'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'

const serversStore = useServersStore()
const { servers } = storeToRefs(serversStore)
const { loadServers, getServerStatus } = serversStore

const authStore = useAuthStore()
const tunnelStore = useTunnelStore()
const settingsStore = useSettingsStore()
// Ensure we have access to loaded settings
const { loadSettings } = settingsStore
const { settings } = storeToRefs(settingsStore)

let trayUpdateInterval: ReturnType<typeof setInterval> | null = null
let unlistenClose: (() => void) | null = null

onMounted(async () => {
  // Initialize Auth
  await authStore.init()

  // Recover running servers from previous session/reload
  const processStore = useServerProcessStore()
  await processStore.recoverRunningServers()

  // Listen for deep links
  try {
    await onOpenUrl((urls) => {
      console.log('Deep link received:', urls)
      for (const url of urls) {
        if (url.startsWith('voidlink://reset-password')) {
          const code = new URL(url).searchParams.get('code')
          if (code) {
             console.log('Reset code found:', code)
             authStore.pendingResetCode = code
             tunnelStore.isManagerOpen = true
             
             // Focus window
             const win = getCurrentWindow()
             win.setFocus()
             win.unminimize()
          }
        }
      }
    })

    // Listen for single-instance deep link event (when app is already running)
    const { listen } = await import('@tauri-apps/api/event')
    await listen<string[]>('deep-link://new-url', (event) => {
       console.log('Single instance deep link:', event.payload)
       for (const url of event.payload) {
        if (url.startsWith('voidlink://reset-password')) {
          const code = new URL(url).searchParams.get('code')
          if (code) {
             console.log('Reset code found (single instance):', code)
             authStore.pendingResetCode = code
             tunnelStore.isManagerOpen = true
             
             // Focus window
             const win = getCurrentWindow()
             win.setFocus()
             win.unminimize()
          }
        }
       }
    })
    
  } catch (e) {
    console.error('Failed to register deep link listener:', e)
  }

  // Initialize tray event listener
  await initTrayListener()

  // Load Global Settings
  await loadSettings()
  
  // Setup Window Close Behavior
  const appWindow = getCurrentWindow()
  unlistenClose = await appWindow.onCloseRequested(async (event) => {
      try {
         // Check settings state directly from store
         const minimize = settings.value.minimizeOnClose
         
         if (minimize) {
            event.preventDefault()
            await appWindow.hide()
         } else {
            // Kill all running servers before exiting
            const processStore = useServerProcessStore()
            await processStore.killAllServers()
            
            // Explicitly handle close to avoid ambiguity
            // We must unlisten to avoid infinite loop when we call close()
            if (unlistenClose) {
                unlistenClose()
                unlistenClose = null
            }
            // Use backend quit for reliable exit on all platforms (inc. MacOS)
            // This also stops all FRP tunnels
            await invoke('quit_app')
         }
      } catch (e) {
         console.error('Error handling close request', e)
         // Fallback close on error
         if (unlistenClose) {
            unlistenClose()
            unlistenClose = null
         }
         await appWindow.close()
      }
  })
  
  // Load servers for tray menu
  await loadServers()
  
  // Initial tray menu update
  await updateTrayMenu(servers.value, getServerStatus)
  
  // Periodically update tray menu with server status
  trayUpdateInterval = setInterval(async () => {
    await updateTrayMenu(servers.value, getServerStatus)
  }, 3000)
})

onUnmounted(() => {
  cleanupTrayListener()
  if (unlistenClose) unlistenClose()
  if (trayUpdateInterval) clearInterval(trayUpdateInterval)
})
</script>
