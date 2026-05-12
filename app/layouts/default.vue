<template>
  <div class="app">
    <!-- Titlebar -->
    <div data-tauri-drag-region class="titlebar">
      <div class="titlebar-left">
      </div>
      <div class="titlebar-center gap-1">
        <div class="w-4 h-4 bg-linear-to-br from-sky-700 to-blue-700 rounded-sm p-0.5 flex items-center justify-center">
            <img src="/tray-icon.svg" alt="VoidLink">
          </div>
        <span class="titlebar-title">VoidLink</span>
      </div>
      <div class="titlebar-right">
        <WindowControls />
      </div>
    </div>

    <!-- Frame -->
    <div class="frame">
      <!-- Rail navigation -->
      <nav class="rail">
        <!-- Logo icon -->
        <!-- <div class="w-10 h-10 bg-linear-to-br from-sky-700 to-blue-700 rounded-xl p-0.5 flex items-center justify-center">
          <img src="/tray-icon.svg" alt="VoidLink">
        </div>

        <div class="rail-divider" /> -->

        <!-- Dashboard -->
        <NuxtLink
          to="/"
          class="rail-item"
          :class="{ active: isRoute('/') }"
          title="Dashboard"
        >
          <div class="pill-indicator" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </NuxtLink>

        <div class="rail-divider" />

        <ClientOnly>

          <NuxtLink
            :to="`/server/${server.path.split('/').pop()}`"
            :class="['rail-item', { active: isRoute(`/server/${server.path.split('/').pop()}`) }]"
            :title="server.path.split('/').pop()"
            v-for="server in servers"
          >
            <div class="pill-indicator" />
            <div class="sc-icon" :style="getStatusIconBg(getServerStatus(server.path.split('/').pop() || ''))">
              <img
                v-if="serverIcons[server.path]"
                :src="serverIcons[server.path]"
                alt=""
              />
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ink-3)"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
            </div>

          </NuxtLink>

        </ClientOnly>

        <!-- Create Server -->
        <NuxtLink
          to="/create"
          class="rail-item"
          :class="{ active: isRoute('/create') }"
          title="Create Server"
        >
          <div class="pill-indicator" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </NuxtLink>

        <div class="rail-spacer" />

        <!-- Settings -->
        <NuxtLink
          to="/settings"
          class="rail-item"
          :class="{ active: isRoute('/settings') }"
          title="Settings"
        >
          <div class="pill-indicator" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </NuxtLink>
      </nav>

      <!-- Main content -->
      <main class="main custom-scrollbar">
        <div class="main-inner">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { join } from '@tauri-apps/api/path'
import { readFile, BaseDirectory } from '@tauri-apps/plugin-fs'

const route = useRoute()

const serversStore = useServersStore()
const { loadServers, getServerStatus, getServerMemory, getServerCpu, formatBytes, updateServerOrder } = serversStore
const { servers, loading } = storeToRefs(serversStore)

const serverIcons = ref<Record<string, string>>({})

function isRoute(path: string): boolean {
  if (path === '/') {
    return route.path === '/' || route.path.startsWith('/server/')
  }
  return route.path === path
}

function getStatusIconBg(status: string): string {
  if (status === 'online') return 'background: var(--ok-soft); border: 1px solid rgba(52,211,153,0.2)'
  return 'background: var(--bg-3); border: 1px solid var(--line-1)'
}

async function loadServerIcon(serverPath: string) {
  const serverId = serverPath.split('/').pop() || ''
  if (!serverId) return
  try {
    const iconPath = await join('VoidLink/servers', serverId, 'server-logo.png')
    const fileBytes = await readFile(iconPath, { baseDir: BaseDirectory.Document })
    const blob = new Blob([fileBytes], { type: 'image/png' })
    const url = URL.createObjectURL(blob)
    if (serverIcons.value[serverPath]) {
      URL.revokeObjectURL(serverIcons.value[serverPath])
    }
    serverIcons.value[serverPath] = url
  } catch (_e) {
    // no icon
  }
}

async function loadAllIcons() {
  for (const server of servers.value) {
    await loadServerIcon(server.path)
  }
}


onMounted(async () => {
  await loadAllIcons()

  watch(servers, async () => { await loadAllIcons() }, { deep: true })

})

</script>

<style scoped>
/* Override WindowControls for the new titlebar */
:deep(.win-controls-wrapper) {
  -webkit-app-region: no-drag;
}
</style>
