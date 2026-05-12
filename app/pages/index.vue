<template>
  <div>
    <!-- Page header -->
    <div class="page-head" >
      <div class="page-head-left">
        <span class="eyebrow">Dashboard</span>
        <h1 class="page-title">Overview</h1>
        <p class="page-sub">
          <span class="dot" :style="activeServersCount > 0 ? 'color: var(--ok)' : 'color: var(--ink-3)'" />
          {{ activeServersCount > 0 ? `${activeServersCount} server${activeServersCount !== 1 ? 's' : ''} running` : 'No servers running' }}
        </p>
      </div>
      <div class="page-head-right">
        <NuxtLink to="/create" class="btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Server
        </NuxtLink>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid-3 mb-24">
      <!-- Active Servers -->
      <div class="stat">
        <div class="stat-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
          Active Servers
        </div>
        <div class="stat-value">
          {{ activeServersCount }}<span class="unit">/ {{ servers.length }}</span>
        </div>
        <div class="stat-trend">
          <span class="delta" :class="activeServersCount > 0 ? 'up' : ''">
            {{ activeServersCount > 0 ? `${servers.length - activeServersCount} offline` : 'all offline' }}
          </span>
        </div>
      </div>

      <!-- CPU -->
      <div class="stat">
        <div class="stat-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="2" x2="9" y2="4" /><line x1="15" y1="2" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="22" /><line x1="15" y1="20" x2="15" y2="22" /><line x1="20" y1="9" x2="22" y2="9" /><line x1="20" y1="14" x2="22" y2="14" /><line x1="2" y1="9" x2="4" y2="9" /><line x1="2" y1="14" x2="4" y2="14" /></svg>
          Total CPU Usage
        </div>
        <div class="stat-value">
          {{ totalCpuUsage.toFixed(1) }}<span class="unit">%</span>
        </div>
        <div class="stat-trend">
          <span class="delta" :class="totalCpuUsage > 80 ? 'down' : totalCpuUsage > 0 ? 'up' : ''">
            {{ totalCpuUsage > 80 ? 'high load' : totalCpuUsage > 0 ? 'normal' : 'idle' }}
          </span>
        </div>
      </div>

      <!-- RAM -->
      <div class="stat">
        <div class="stat-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 19v-3" /><path d="M10 19v-3" /><path d="M14 19v-3" /><path d="M18 19v-3" /><rect x="2" y="12" width="20" height="4" rx="1" /><path d="M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /></svg>
          Total RAM Usage
        </div>
        <div class="stat-value">
          {{ formatBytes(totalRamUsage) }}
        </div>
        <div class="stat-trend">
          <span class="delta">/ {{ formatBytes(systemInfo.total_memory_bytes) }} system</span>
        </div>
      </div>
    </div>

    <!-- Servers section -->
    <div class="between mb-16">
      <h2 class="section-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ink-3)"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
        Your Servers
      </h2>
      <span class="text-faint text-mono" style="font-size: 12px">{{ servers.length }} server{{ servers.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Server grid -->
    <template v-if="servers.length > 0">
      <ClientOnly>
        <draggable
          v-model="serversList"
          item-key="id"
          group="servers"
          class="grid-3"
          :animation="200"
          @change="onServerDragChange"
          handle=".drag-handle"
        >
          <template #item="{ element: server }">
            <div
              class="server-card"
              @click="navigateTo(`/server/${server.path.split('/').pop()}`)"
            >
              <!-- Card head -->
              <div class="sc-head">
                <div class="sc-icon" :style="getStatusIconBg(getServerStatus(server.path.split('/').pop() || ''))">
                  <img
                    v-if="serverIcons[server.path]"
                    :src="serverIcons[server.path]"
                    alt=""
                  />
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ink-3)"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                </div>
                <div style="min-width: 0; flex: 1">
                  <p class="sc-name">{{ server.name }}</p>
                  <div class="sc-meta">
                    <span class="pill" style="font-size: 10px; padding: 1px 6px">{{ server.type }}</span>
                    <span>{{ server.version }}</span>
                    <span
                      class="pill"
                      :class="getServerStatus(server.path.split('/').pop() || '') === 'online' ? 'ok' : ''"
                      style="font-size: 10px; padding: 1px 6px; margin-left: auto"
                    >
                      <span class="dot" />
                      {{ getServerStatus(server.path.split('/').pop() || '') }}
                    </span>
                  </div>
                </div>
                <!-- Drag handle -->
                <div class="drag-handle btn ghost icon-only sm" style="cursor: grab; opacity: 0" @click.stop>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                </div>
              </div>

              <!-- Stats row (when online) -->
              <div v-if="getServerStatus(server.path.split('/').pop() || '') === 'online'" class="sc-stats">
                <div class="sc-stat">
                  <div class="l">CPU</div>
                  <div class="v">{{ getServerCpu(server.path.split('/').pop() || '').toFixed(1) }}%</div>
                </div>
                <div class="sc-stat">
                  <div class="l">RAM</div>
                  <div class="v">{{ formatBytes(getServerMemory(server.path.split('/').pop() || '')) }}</div>
                </div>
                <div class="sc-stat">
                  <div class="l">Port</div>
                  <div class="v">{{ server.port }}</div>
                </div>
              </div>

              <!-- Offline placeholder stats -->
              <div v-else class="sc-stats" style="opacity: 0.4">
                <div class="sc-stat">
                  <div class="l">CPU</div>
                  <div class="v">—</div>
                </div>
                <div class="sc-stat">
                  <div class="l">RAM</div>
                  <div class="v">—</div>
                </div>
                <div class="sc-stat">
                  <div class="l">Port</div>
                  <div class="v">{{ server.port }}</div>
                </div>
              </div>

              <!-- Address -->
              <div class="sc-addr">
                <span class="l">Local</span>
                <span class="v">{{ localIp }}:{{ server.port }}</span>
              </div>

              <!-- Tunnel address (if active) -->
              <div v-if="getServerTunnelAddress(server.port)" class="sc-addr" style="background: var(--accent-soft); border-color: var(--accent-line)">
                <span class="l" style="color: var(--accent)">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                  Public
                </span>
                <span class="v">{{ getServerTunnelAddress(server.port) }}</span>
              </div>
            </div>
          </template>
        </draggable>
      </ClientOnly>
    </template>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 14px; display: block; color: var(--ink-3)"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
      <h5>No servers yet</h5>
      <p>Create your first Minecraft server to get started.</p>
      <div style="margin-top: 20px">
        <NuxtLink to="/create" class="btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
          Create Server
        </NuxtLink>
      </div>
    </div>

    <!-- Tunnel Manager Modal -->
    <TunnelManagerModal v-model:open="showTunnelModal" />
  </div>
</template>

<script setup lang="ts">
import { useServersStore } from '~/stores/useServersStore'
import { storeToRefs } from 'pinia'
import { invoke } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'
import { readFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import draggable from 'vuedraggable'

definePageMeta({
  layout: 'default'
})

const serversStore = useServersStore()
const { servers, loading } = storeToRefs(serversStore)
const { loadServers, getServerStatus, getServerMemory, getServerCpu, formatBytes, updateServerOrder } = serversStore

const serversList = ref<typeof servers.value>([])
const isDragging = ref(false)

watch(servers, (newVal) => {
  if (!isDragging.value) {
    serversList.value = [...newVal]
  }
}, { immediate: true, deep: true })

function onServerDragChange(event: any) {
  if (event.moved) {
    const { element, newIndex } = event.moved
    const list = serversList.value

    let newOrder = 0
    const prevServer = list[newIndex - 1]
    const nextServer = list[newIndex + 1]

    if (!prevServer && nextServer) {
      newOrder = nextServer.order / 2
    } else if (prevServer && !nextServer) {
      newOrder = prevServer.order + 1000
    } else if (prevServer && nextServer) {
      newOrder = (prevServer.order + nextServer.order) / 2
    } else {
      newOrder = 1000
    }

    isDragging.value = true
    updateServerOrder(element.id, newOrder)
    setTimeout(() => { isDragging.value = false }, 100)
  }
}

const tunnelStore = useTunnelStore()
const { isManagerOpen } = storeToRefs(tunnelStore)

const showTunnelModal = computed({
  get: () => tunnelStore.isManagerOpen,
  set: (val: boolean) => { tunnelStore.isManagerOpen = val }
})

const processStore = useServerProcessStore()

interface SystemInfo {
  total_memory_bytes: number
  used_memory_bytes: number
  cpu_count: number
}
const systemInfo = ref<SystemInfo>({ total_memory_bytes: 0, used_memory_bytes: 0, cpu_count: 0 })
const localIp = ref('127.0.0.1')
const serverIcons = ref<Record<string, string>>({})

let pollInterval: ReturnType<typeof setInterval> | null = null

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
  await loadServers()
  await loadAllIcons()

  watch(servers, async () => { await loadAllIcons() }, { deep: true })

  try {
    systemInfo.value = await invoke<SystemInfo>('get_system_info')
    localIp.value = await invoke<string>('get_local_ip')
  } catch (_e) {
    console.error('Failed to get system info')
  }

  pollInterval = setInterval(() => {
    for (const server of servers.value) {
      const serverId = server.path.split('/').pop() || ''
      if (getServerStatus(serverId) === 'online') {
        processStore.refreshProcessInfo(serverId)
      }
    }
  }, 2000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  Object.values(serverIcons.value).forEach(url => URL.revokeObjectURL(url))
})

const activeServersCount = computed(() =>
  servers.value.filter(s => getServerStatus(s.path.split('/').pop() || '') === 'online').length
)

const totalCpuUsage = computed(() =>
  servers.value.reduce((total, server) => {
    const serverId = server.path.split('/').pop() || ''
    return getServerStatus(serverId) === 'online' ? total + getServerCpu(serverId) : total
  }, 0)
)

const totalRamUsage = computed(() =>
  servers.value.reduce((total, server) => {
    const serverId = server.path.split('/').pop() || ''
    return getServerStatus(serverId) === 'online' ? total + getServerMemory(serverId) : total
  }, 0)
)


function getStatusIconBg(status: string): string {
  if (status === 'online') return 'background: var(--ok-soft); border: 1px solid rgba(52,211,153,0.2)'
  return 'background: var(--bg-3); border: 1px solid var(--line-1)'
}

function getServerTunnelAddress(serverPort: number): string | null {
  for (const tunnel of tunnelStore.tunnels) {
    if (!tunnel.is_active) continue
    const port = tunnel.ports.find(p => p.local_port === serverPort && p.protocol === 'tcp')
    if (port) return port.address
  }
  return null
}
</script>

<style scoped>
.server-card:hover .drag-handle {
  opacity: 1 !important;
}
</style>
