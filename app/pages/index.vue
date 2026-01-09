<template>
  <div class="min-h-full flex flex-col">
    <!-- Header Section -->
    <div data-tauri-drag-region class="relative bg-gray-900/70 border-b border-gray-800 pb-8 pt-8 px-8 overflow-hidden">
      <!-- Background Gradients -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-900/20 via-gray-900/0 to-transparent pointer-events-none"></div>
      <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent"></div>
      
      <div class="relative z-10">
        <div class="flex justify-between items-start mb-8">
          <div>
            <h2 class="text-4xl font-bold text-white tracking-tight">Overview</h2>
            <div class="flex items-center gap-2 mt-2 text-gray-400">
              <div class="w-2 h-2 rounded-full bg-success-500 animate-pulse"></div>
              <p class="font-medium">System Online</p>
            </div>
          </div>
          <div class="flex gap-3 items-center">
            <UButton 
              color="neutral" 
              variant="soft" 
              icon="i-lucide-globe" 
              class="font-medium"
              size="md"
              @click="showTunnelModal = true"
            >
              Manage Tunnels
            </UButton>
            <UButton 
              color="neutral" 
              variant="soft" 
              icon="i-lucide-settings" 
              to="/settings" 
              class="font-medium"
              size="md"
            >
              Settings
            </UButton>
            <UButton 
              color="primary" 
              icon="i-lucide-plus" 
              to="/create" 
              class="font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all"
              size="md"
            >
              Create Server
            </UButton>
          </div>
        </div>

        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Active Servers Card -->
          <div class="relative group overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-5 hover:border-primary-500/30 transition-all duration-300">
             <div class="absolute right-0 top-0 w-full h-full rounded-lg bg-radial-[at_75%_25%] from-blue-500/10 to-transparent to-75%"></div>

            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <UIcon name="i-lucide-server" class="w-24 h-24 text-primary-500" />
             </div>
             <div class="relative z-10">
                <div class="flex items-center gap-3 mb-3">
                   <div class="p-2 bg-primary-500/10 rounded-lg ring-1 ring-primary-500/20">
                      <UIcon name="i-lucide-server" class="w-5 h-5 text-primary-400" />
                   </div>
                   <span class="text-gray-400 font-medium text-sm">Active Servers</span>
                </div>
                <div class="flex items-baseline gap-2">
                   <span class="text-3xl font-bold text-white">{{ activeServersCount }}</span>
                   <span class="text-gray-500 text-sm">/ {{ servers.length }} total</span>
                </div>
             </div>
          </div>

          <!-- CPU Usage Card -->
          <div class="relative group overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-5 hover:border-error-500/30 transition-all duration-300">
            <div class="absolute right-0 top-0 w-full h-full rounded-lg bg-radial-[at_75%_25%] from-red-500/10 to-transparent to-75%"></div>

            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <UIcon name="i-lucide-cpu" class="w-24 h-24 text-error-500" />
             </div>
             <div class="relative z-10">
                <div class="flex items-center gap-3 mb-3">
                   <div class="p-2 bg-error-500/10 rounded-lg ring-1 ring-error-500/20">
                      <UIcon name="i-lucide-cpu" class="w-5 h-5 text-error-400" />
                   </div>
                   <span class="text-gray-400 font-medium text-sm">Total Server CPU</span>
                </div>
                <div class="flex items-baseline gap-2">
                   <span class="text-3xl font-bold text-white">{{ totalCpuUsage.toFixed(1) }}%</span>
                </div>
             </div>
          </div>

          <!-- RAM Usage Card -->
          <div class="relative group overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-5 hover:border-success-500/30 transition-all duration-300">
            <div class="absolute right-0 top-0 w-full h-full rounded-lg bg-radial-[at_75%_25%] from-green-500/10 to-transparent to-75%"></div>

            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <UIcon name="i-lucide-memory-stick" class="w-24 h-24 text-success-500" />
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-3">
                  <div class="p-2 bg-success-500/10 rounded-lg ring-1 ring-success-500/20">
                    <UIcon name="i-lucide-memory-stick" class="w-5 h-5 text-success-400" />
                  </div>
                  <span class="text-gray-400 font-medium text-sm">Total Server RAM</span>
              </div>
              <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-white">{{ formatBytes(totalRamUsage) }}</span>
                  <span class="text-gray-500 text-sm">/ {{ formatBytes(systemInfo.total_memory_bytes) }} system</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
           <UIcon name="i-lucide-layout-grid" class="w-5 h-5 text-gray-500" />
           Your Servers
        </h2>
        <div class="text-sm text-gray-500">
           Showing {{ servers.length }} server{{ servers.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Server Grid -->
      <template v-if="servers.length > 0">
      <ClientOnly>
         <draggable 
         v-model="serversList" 
         item-key="id"
         group="servers"
         class="flex flex-wrap gap-6"
         :animation="200"
         @change="onServerDragChange"
         handle=".drag-handle"
         >
            <template #item="{ element: server }">
               <div class="w-full md:w-[calc(50%-12px)] xl:w-[calc(33.333%-16px)] 3xl:w-[calc(25%-16px)]">
                  <div 
                     class="group relative flex flex-col bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full"
                     @click="navigateTo(`/server/${server.path.split('/').pop()}`)"
                  >
                     <!-- Status Line -->
                     <div :class="'h-1 w-full ' + 'bg-' + getStatusColor(getServerStatus(server.path.split('/').pop() || '')) + '-500'"></div>
                     
                     <div class="p-5 flex-1 flex flex-col">
                        <!-- Header -->
                        <div class="flex items-start gap-4 mb-4">
                           <!-- Drag Handle -->
                           <div class="hidden group-hover:flex absolute top-2 right-2 cursor-grab justify-center items-center active:cursor-grabbing drag-handle p-2 z-20 hover:bg-gray-800 rounded-lg transition-colors" @click.stop>
                              <UIcon name="i-lucide-grip-vertical" class="w-5 h-5 text-gray-400 group-hover:text-white pointer-events-none" />
                           </div>

                           <div class="relative shrink-0">
                              <!-- Server Icon -->
                              <img 
                                 v-if="serverIcons[server.path]" 
                                 :src="serverIcons[server.path]" 
                                 class="w-14 h-14 rounded-xl bg-gray-800 object-cover shadow-sm ring-1 ring-gray-800 group-hover:ring-gray-700 transition-all" 
                              />
                              <div v-else class="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center ring-1 ring-gray-800 group-hover:ring-gray-700 transition-all">
                                 <UIcon :name="server.icon || 'i-lucide-box'" class="w-7 h-7 text-gray-500 group-hover:text-primary-400 transition-colors" />
                              </div>
                              
                              <!-- Status Indicator Dot -->
                              <div 
                                 :class="'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 flex items-center justify-center ' + 'bg-' + getStatusColor(getServerStatus(server.path.split('/').pop() || '')) + '-500'"
                              >
                                 <div v-if="getServerStatus(server.path.split('/').pop() || '') === 'online'" class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                              </div>
                           </div>
                           
                           <div class="min-w-0 flex-1">
                              <h3 class="font-bold text-lg text-white truncate group-hover:text-primary-400 transition-colors">{{ server.name }}</h3>
                              <div class="flex items-center gap-2 mt-1">
                                 <UBadge color="neutral" variant="subtle" size="sm">{{ server.type }}</UBadge>
                                 <span class="text-xs text-gray-500">{{ server.version }}</span>
                              </div>
                           </div>
                        </div>

                        <!-- Quick Stats or Info -->
                        <div class="mt-auto space-y-3">
                           <!-- IP Address -->
                           <div class="space-y-2">
                              <div class="flex items-center justify-between py-2 px-3 bg-gray-950/30 rounded-lg border border-gray-800/50">
                                 <span class="text-xs text-gray-500 font-medium uppercase tracking-wider">Local Address</span>
                                 <div class="flex items-center gap-1.5 text-xs text-gray-300 font-mono select-all">
                                    <UIcon name="i-lucide-network" class="w-3 h-3 text-gray-500" /> 
                                    {{ localIp }}:{{ server.port }}
                                 </div>
                              </div>

                              <!-- Tunnel Address -->
                              <div v-if="getServerTunnelAddress(server.port)" class="flex items-center justify-between py-2 px-3 bg-primary-900/10 rounded-lg border border-primary-500/20 group-hover:border-primary-500/40 transition-colors">
                                 <span class="text-xs text-primary-400 font-medium uppercase tracking-wider flex items-center gap-1">
                                    <UIcon name="i-lucide-globe" class="w-3 h-3" />
                                    Public
                                 </span>
                                 <div class="flex items-center gap-1.5 text-xs text-primary-200 font-mono select-all font-bold">
                                    {{ getServerTunnelAddress(server.port) }}
                                 </div>
                              </div>
                           </div>

                           <!-- Online Stats (Only when online) -->
                           <div v-if="getServerStatus(server.path.split('/').pop() || '') === 'online'" class="space-y-3 pt-2">
                              <!-- CPU -->
                              <div class="space-y-1">
                                 <div class="flex justify-between text-xs">
                                    <span class="text-gray-500">CPU</span>
                                    <span class="text-gray-300">{{ getServerCpu(server.path.split('/').pop() || '').toFixed(1) }}%</span>
                                 </div>
                                 <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-error-500 rounded-full transition-all duration-500" :style="{ width: Math.min(getServerCpu(server.path.split('/').pop() || ''), 100) + '%' }"></div>
                                 </div>
                              </div>
                              
                              <!-- RAM -->
                              <div class="space-y-1">
                                 <div class="flex justify-between text-xs">
                                    <span class="text-gray-500">RAM</span>
                                    <span class="text-gray-300">{{ formatBytes(getServerMemory(server.path.split('/').pop() || '')) }}</span>
                                 </div>
                                 <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-yellow-500 rounded-full transition-all duration-500" :style="{ width: Math.min(getRamPercent(server), 100) + '%' }"></div>
                                 </div>
                              </div>
                           </div>
                           
                           <!-- Offline Placeholder -->
                           <div v-else class="py-4 flex items-center justify-center text-gray-600 gap-2">
                              <UIcon name="i-lucide-power-off" class="w-4 h-4" />
                              <span class="text-xs font-medium">Server is offline</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </template>
         </draggable>
      </ClientOnly>
      </template>

     

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-20 bg-gray-900/20 border border-dashed border-gray-800 rounded-3xl">
         <div class="p-6 bg-gray-900 rounded-full mb-6 relative group">
            <div class="absolute inset-0 bg-primary-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <UIcon name="i-lucide-box" class="w-16 h-16 text-gray-600 group-hover:text-primary-500 transition-colors duration-500 relative z-10" />
         </div>
         <h3 class="text-2xl font-bold text-white mb-2">No Servers Found</h3>
         <p class="text-gray-500 max-w-sm text-center mb-8">It looks quiet here. Start your journey by creating your first Minecraft server.</p>
         <UButton 
            size="xl" 
            color="primary" 
            icon="i-lucide-rocket" 
            to="/create"
            class="font-bold px-8 shadow-xl shadow-primary-900/20"
         >
            Create Your First Server
         </UButton>
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

// Page meta for transitions later if needed
definePageMeta({
  layout: 'default'
})


// Use centralized servers store
const serversStore = useServersStore()
const { servers, loading } = storeToRefs(serversStore)
const { loadServers, getServerStatus, getStatusColor, getServerMemory, getServerCpu, formatBytes, updateServerOrder } = serversStore

// Local list for vuedraggable (synced with store)
const serversList = ref<typeof servers.value>([])
const isDragging = ref(false)

// Sync from store to local list (skip during drag to prevent interruption)
watch(servers, (newVal) => {
    if (!isDragging.value) {
        serversList.value = [...newVal]
    }
}, { immediate: true, deep: true })

// Called when drag changes - use fractional ordering
function onServerDragChange(event: any) {
   console.log(event)
    if (event.moved) {
         
        const { element, newIndex } = event.moved
        const list = serversList.value
        
        let newOrder = 0
        const prevServer = list[newIndex - 1]
        const nextServer = list[newIndex + 1]

        if (!prevServer && nextServer) {
            // Moved to first position
            newOrder = nextServer.order / 2
        } else if (prevServer && !nextServer) {
            // Moved to last position
            newOrder = prevServer.order + 1000 
        } else if (prevServer && nextServer) {
            // Moved between two items
            newOrder = (prevServer.order + nextServer.order) / 2
        } else {
            // Only item
            newOrder = 1000
        }
        
        // Temporarily prevent watch from overwriting
        isDragging.value = true
        updateServerOrder(element.id, newOrder)
        // Re-enable sync after a short delay
        setTimeout(() => {
            isDragging.value = false
        }, 100)
    }
}

const tunnelStore = useTunnelStore()
const { isManagerOpen } = storeToRefs(tunnelStore)

// Helper to open modal (replacing local ref)
const showTunnelModal = computed({
  get: () => tunnelStore.isManagerOpen,
  set: (val: boolean) => tunnelStore.isManagerOpen = val
})

// Process store for refreshing memory info
const processStore = useServerProcessStore()

// System info
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

   // Check if we already have it (though we should support updates, maybe clearing cache is better)
   // But for now prevent double loading if already valid
   
   try {
      const iconPath = await join('VoidLink/servers', serverId, 'server-logo.png')
      // Try to read file to check existence/load it
      const fileBytes = await readFile(iconPath, { baseDir: BaseDirectory.Document })
      const blob = new Blob([fileBytes], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      
      // Revoke old URL if exists to save memory
      if (serverIcons.value[serverPath]) {
         URL.revokeObjectURL(serverIcons.value[serverPath])
      }
      
      serverIcons.value[serverPath] = url
   } catch (e) {
      // No icon found or error reading, ignore (will fallback to default UI icon)
   }
}

// Load all icons
async function loadAllIcons() {
   for (const server of servers.value) {
      // Only load if not already loaded or if we want to refresh
      await loadServerIcon(server.path)
   }
}

onMounted(async () => {
  await loadServers()
  await loadAllIcons()
  
  // Watch for new servers to load icons
  watch(servers, async () => {
     await loadAllIcons()
  }, { deep: true })
  
  // Fetch system info and local IP
  try {
    systemInfo.value = await invoke<SystemInfo>('get_system_info')
    localIp.value = await invoke<string>('get_local_ip')
  } catch (e) {
    console.error('Failed to get system info:', e)
  }
  
  // Poll process info every 2 seconds for running servers
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
  
  // Revoke all object URLs
  Object.values(serverIcons.value).forEach(url => {
     URL.revokeObjectURL(url)
  })
})

// Computed stats for overview cards
const activeServersCount = computed(() => {
  return servers.value.filter(s => getServerStatus(s.path.split('/').pop() || '') === 'online').length
})

const totalCpuUsage = computed(() => {
  return servers.value.reduce((total, server) => {
    const serverId = server.path.split('/').pop() || ''
    if (getServerStatus(serverId) === 'online') {
      return total + getServerCpu(serverId)
    }
    return total
  }, 0)
})

const totalRamUsage = computed(() => {
  return servers.value.reduce((total, server) => {
    const serverId = server.path.split('/').pop() || ''
    if (getServerStatus(serverId) === 'online') {
      return total + getServerMemory(serverId)
    }
    return total
  }, 0)
})

// Calculate RAM usage percentage based on server memory limit
function getRamPercent(server: { path: string; javaSettings?: { memory: number } }): number {
  const serverId = server.path.split('/').pop() || ''
  const memoryBytes = getServerMemory(serverId)
  const limitGB = server.javaSettings?.memory || 4
  const limitBytes = limitGB * 1024 * 1024 * 1024
  return (memoryBytes / limitBytes) * 100
}

function getServerTunnelAddress(serverPort: number): string | null {
   for (const tunnel of tunnelStore.tunnels) {
      if (!tunnel.is_active) continue
      
      const port = tunnel.ports.find(p => p.local_port === serverPort && p.protocol === 'tcp')
      if (port) {
         return port.address
      }
   }
   return null
}
</script>
