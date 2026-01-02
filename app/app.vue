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
import { storeToRefs } from 'pinia'

const serversStore = useServersStore()
const { servers } = storeToRefs(serversStore)
const { loadServers, getServerStatus } = serversStore

let trayUpdateInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  // Initialize tray event listener
  await initTrayListener()
  
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
  if (trayUpdateInterval) clearInterval(trayUpdateInterval)
})
</script>
