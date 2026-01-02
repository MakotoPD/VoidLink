<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 pb-32">
    <div class="max-w-6xl mx-auto space-y-8">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="lg"
          @click="goBack"
        />
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            {{ step === 1 ? 'Select Server Software' : 'Configure Server' }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400">
            {{ step === 1 ? 'Choose the engine that powers your server' : 'Set up your server details and version' }}
          </p>
        </div>
      </div>

      <!-- Step 1: Server Types Grid -->
      <div v-if="step === 1" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <ServerTypeCard
          v-for="type in serverTypes"
          :key="type.id"
          :name="type.name"
          :icon="type.icon"
          :description="type.description"
          :selected="selectedType === type.id"
          @select="selectType(type.id)"
        />
      </div>

      <!-- Step 2: Configuration -->
      <div v-else class="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        
        <!-- Selected Type Summary -->
        <div class="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div class="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
             <UIcon :name="selectedTypeData?.icon || 'i-lucide-box'" class="w-8 h-8" />
          </div>
          <div>
            <h3 class="font-bold text-lg">{{ selectedTypeData?.name }}</h3>
            <p class="text-sm text-gray-500">Selected Software</p>
          </div>
          <UButton color="neutral" variant="ghost" class="ml-auto" @click="step = 1">Change</UButton>
        </div>

        <div class="space-y-6">
           <!-- Version Selection -->
           <div class="space-y-2">
            <div class="flex justify-between items-center">
               <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Game Version</label>
               
               <!-- Snapshots Toggle -->
               <div v-if="canToggleSnapshots" class="flex items-center gap-2">
                 <span class="text-xs text-gray-500">{{ toggleLabel }}</span>
                 <USwitch  v-model="includeSnapshots" size="sm" />
               </div>
            </div>

            <USelectMenu
              v-model="selectedVersion"
              :items="availableVersions"
              :loading="isLoadingVersions"
              searchable
              placeholder="Select a version..."
              class="w-full"
              size="lg"
            >
              <template #label>
                 <span v-if="!selectedVersion" class="text-gray-400 truncate">Select a version...</span>
                 <span v-else class="truncate">{{ selectedVersion }}</span>
              </template>
            </USelectMenu>
          </div>

          <!-- Server Name -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Server Name</label>
            <UInput
              v-model="serverName"
              placeholder="My Awesome Server"
              size="lg"
              icon="i-lucide-type"
            />
          </div>

          <!-- Path Preview -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Installation Path</label>
            <UInput
              :model-value="serverPath"
              readonly
              icon="i-lucide-folder"
              color="neutral"
              variant="subtle"
              size="lg"
              class="opacity-75 w-72 cursor-not-allowed"
            />
            <p class="text-xs text-gray-500">Servers are stored in your Documents folder.</p>
          </div>
        </div>

      </div>

      <!-- Footer Actions -->
      <div 
        class="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 flex justify-center transform transition-transform duration-300 z-50"
        :class="(step === 1 && selectedType) || (step === 2) ? 'translate-y-0' : 'translate-y-full'"
      >
        <div class="max-w-6xl w-full flex justify-between items-center">
          <div class="hidden md:block">
            <p v-if="step === 1" class="text-sm font-medium">Selected: <span class="text-primary-500">{{ selectedTypeName }}</span></p>
            <p v-else class="text-sm font-medium">Ready to create!</p>
          </div>
          
          <UButton
            v-if="step === 1"
            size="xl"
            color="primary"
            class="w-full md:w-auto min-w-[200px]"
            trailing-icon="i-lucide-arrow-right"
            @click="step = 2"
          >
            Continue
          </UButton>

          <UButton
            v-else
            size="xl"
            color="primary"
            class="w-full md:w-auto min-w-[200px]"
            trailing-icon="i-lucide-check"
            :loading="isCreating"
            :disabled="!isValid"
            @click="createServer"
          >
            {{ isCreating ? 'Creating...' : 'Create Server' }}
          </UButton>
        </div>
        
        <!-- Status Overlay/Message -->
        <div v-if="isCreating || statusMessage" class="absolute -top-16 left-0 right-0 text-center pointer-events-none">
           <span class="inline-block px-4 py-2 rounded-full bg-gray-900/80 text-white text-sm backdrop-blur">
             {{ statusMessage }}
           </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid' 
import { fetch } from '@tauri-apps/plugin-http'
import { mkdir, writeFile, writeTextFile, readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'

const step = ref(1)
const selectedType = ref<string | null>(null)
const selectedVersion = ref<string | undefined>(undefined)
const serverName = ref('')
const isCreating = ref(false)
const isLoadingVersions = ref(false)
const availableVersions = ref<string[]>([])
const includeSnapshots = ref(false)
const statusMessage = ref('')

interface ServerType {
  id: string
  name: string
  icon: string
  description: string
  api: {
    url: string
    type: 'mcjarfiles' | 'papermc'
    snapshotUrl?: string
    previewUrl?: string
  }
}

const serverTypes: ServerType[] = [
  { 
    id: 'vanilla', 
    name: 'Official Java', 
    icon: 'i-lucide-box', 
    description: 'The original Minecraft Server software by Mojang.',
    api: { 
      url: 'https://mcjarfiles.com/api/get-versions/vanilla/release',
      snapshotUrl: 'https://mcjarfiles.com/api/get-versions/vanilla/snapshot',
      type: 'mcjarfiles'
    }
  },
  { 
    id: 'bedrock', 
    name: 'Bedrock', 
    icon: 'i-lucide-smartphone', 
    description: 'Official server software for Minecraft: Bedrock Edition.',
    api: { 
      url: 'https://mcjarfiles.com/api/get-versions/bedrock/latest/windows',
      previewUrl: 'https://mcjarfiles.com/api/get-versions/bedrock/preview/windows',
      type: 'mcjarfiles' 
    }
  },
  { 
    id: 'paper', 
    name: 'Paper', 
    icon: 'i-lucide-scroll', 
    description: 'High performance fork of Spigot. Recommended for most servers.',
    api: { url: 'https://mcjarfiles.com/api/get-versions/servers/paper', type: 'mcjarfiles' }
  },
  { 
    id: 'purpur', 
    name: 'Purpur', 
    icon: 'i-lucide-cat', 
    description: 'Drop-in replacement for Paper with many new features.',
    api: { url: 'https://mcjarfiles.com/api/get-versions/servers/purpur', type: 'mcjarfiles' }
  },
  { 
    id: 'fabric', 
    name: 'Fabric', 
    icon: 'i-lucide-layers', 
    description: 'Lightweight, experimental modding toolchain for Minecraft.',
    api: { url: 'https://mcjarfiles.com/api/get-versions/modded/fabric', type: 'mcjarfiles' }
  },
  { 
    id: 'forge', 
    name: 'Forge', 
    icon: 'i-lucide-anvil', 
    description: 'The original and most popular mod loader for Minecraft.',
    api: { url: 'https://mcjarfiles.com/api/get-versions/modded/forge', type: 'mcjarfiles' }
  },
  { 
    id: 'neoforge', 
    name: 'NeoForge', 
    icon: 'i-lucide-zap', 
    description: 'A community-driven fork of Minecraft Forge.',
    api: { url: 'https://mcjarfiles.com/api/get-versions/modded/neoforge', type: 'mcjarfiles' }
  },
  { 
    id: 'velocity', 
    name: 'Velocity', 
    icon: 'i-lucide-network', 
    description: 'A modern, high-performance proxy server.',
    api: { url: 'https://mcjarfiles.com/api/get-versions/proxies/velocity', type: 'mcjarfiles' }
  },
  { 
    id: 'folia', 
    name: 'Folia', 
    icon: 'i-lucide-wind', 
    description: 'Regionalised multithreading for dedicated servers.',
    api: { url: 'https://fill.papermc.io/v3/projects/folia', type: 'papermc' }
  }
]

const selectedTypeData = computed(() => serverTypes.find(t => t.id === selectedType.value))
const selectedTypeName = computed(() => selectedTypeData.value?.name)

const canToggleSnapshots = computed(() => {
  return selectedTypeData.value?.id === 'vanilla' || selectedTypeData.value?.id === 'bedrock'
})

const toggleLabel = computed(() => {
  if (selectedTypeData.value?.id === 'bedrock') return 'Show Preview Version'
  return 'Show Snapshots'
})

// Generate a unique ID
const serverId = computed(() => {
    // We keep a static ID for preview, but in storage we might want a real UUID if not provided by user
    return 'xyz789' 
})

const serverFolderName = computed(() => {
   const safeName = (serverName.value || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
   return `${safeName}-${serverId.value}`
})

const serverPath = computed(() => {
  return `~/Documents/MineDash/servers/${serverFolderName.value}`
})

const isValid = computed(() => {
  return selectedVersion.value && serverName.value.length > 0
})

function selectType(id: string) {
  selectedType.value = id
}

function goBack() {
  if (step.value === 2) {
    step.value = 1
    selectedVersion.value = undefined
  } else {
    navigateTo('/')
  }
}

async function fetchVersions() {
  if (!selectedTypeData.value) return
  
  isLoadingVersions.value = true
  availableVersions.value = []
  selectedVersion.value = undefined

  try {
    const apiConfig = selectedTypeData.value.api
    let url = apiConfig.url

    // Handle Snapshots/Previews override
    if (includeSnapshots.value) {
      if (apiConfig.snapshotUrl && selectedTypeData.value.id === 'vanilla') {
        url = apiConfig.snapshotUrl
      } else if (apiConfig.previewUrl && selectedTypeData.value.id === 'bedrock') {
        url = apiConfig.previewUrl
      }
    }

    const response = await fetch(url)
    const data = await response.json()

    if (apiConfig.type === 'papermc') {
      const versionsObj = data.versions || {}
      const allVersions: string[] = []
      
      Object.keys(versionsObj).forEach(majorVer => {
        if (Array.isArray(versionsObj[majorVer])) {
          allVersions.push(...versionsObj[majorVer])
        }
      })
      
      availableVersions.value = allVersions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      
    } else {
      if (Array.isArray(data)) {
        availableVersions.value = data
      }
    }
  } catch (error) {
    console.error('Failed to fetch versions:', error)
  } finally {
    isLoadingVersions.value = false
  }
}

watch(step, (newStep) => {
  if (newStep === 2) {
    fetchVersions()
    includeSnapshots.value = false 
  }
})

watch(includeSnapshots, () => {
  if (step.value === 2) {
    fetchVersions()
  }
})

async function resolveDownloadUrl(): Promise<string | null> {
  if (!selectedTypeData.value || !selectedVersion.value) return null
  
  const apiConfig = selectedTypeData.value.api
  const version = selectedVersion.value

  try {
    if (apiConfig.type === 'papermc') {
      // Fetch latest build for Folia
      const url = `${apiConfig.url}/versions/${version}/builds/latest`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data && data.downloads && data.downloads['server:default'] && data.downloads['server:default'].url) {
        return `https://fill-data.papermc.io/v1/objects/${data.downloads['server:default'].checksums.sha256}/${data.downloads['server:default'].name}`
      }
      return null
    } else {
      let baseUrl = apiConfig.url
      
      if (baseUrl.includes('get-versions')) {
        let downloadUrl = baseUrl.replace('get-versions', 'get-jar')
        
        // Handle snapshots/previews if active
        if (includeSnapshots.value) {
             if (apiConfig.snapshotUrl && selectedTypeData.value.id === 'vanilla') {
                downloadUrl = apiConfig.snapshotUrl.replace('get-versions', 'get-jar')
             } else if (apiConfig.previewUrl && selectedTypeData.value.id === 'bedrock') {
                downloadUrl = apiConfig.previewUrl.replace('get-versions', 'get-jar')
             }
        }
        
        return `${downloadUrl}/${version}`
      }
      
      return null
    }
  } catch (e) {
    console.error('Error resolving download URL', e)
    return null
  }
}

async function createServer() {
  if (!isValid.value) return

  isCreating.value = true
  statusMessage.value = 'Resolving download URL...'
  
  try {
    const downloadUrl = await resolveDownloadUrl()
    
    if (!downloadUrl) {
      statusMessage.value = 'Failed to resolve download URL.'
      console.error('Could not resolve download URL!')
      isCreating.value = false
      return
    }

    const uniqueId = uuidv4().slice(0, 8) // Generate real ID
    const safeName = (serverName.value || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const folderName = `${safeName}-${uniqueId}`
    const relativePath = `MineDash/servers/${folderName}`

    statusMessage.value = 'Creating directory...'
    // Create directory: Documents/MineDash/servers/{name}-{id}
    await mkdir(relativePath, { baseDir: BaseDirectory.Document, recursive: true })

    statusMessage.value = 'Downloading server JAR...'
    const response = await fetch(downloadUrl)
    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`)
    
    const buffer = await response.arrayBuffer()
    const jarName = 'server.jar' // Standardize name or use from URL
    
    await writeFile(
      await join(relativePath, jarName),
      new Uint8Array(buffer),
      { baseDir: BaseDirectory.Document }
    )

    statusMessage.value = 'Setting up configuration...'
    // EULA will be handled on first start


    // Read Global Settings for defaults
    let javaSettings = { memory: 4, path: 'java', flags: '' }
    try {
       const settingsContent = await readTextFile('MineDash/settings.json', { baseDir: BaseDirectory.Document })
       const s = JSON.parse(settingsContent)
       if (s) {
          javaSettings = { 
             memory: s.defaultMemory ?? 4,
             path: s.javaPath ?? 'java',
             flags: s.defaultFlags ?? ''
          }
       }
    } catch (e) { /* ignore */ }

    // Create Metadata
    const metadata = {
        id: uniqueId,
        name: serverName.value,
        type: selectedTypeData.value?.id,
        typeName: selectedTypeData.value?.name,
        version: selectedVersion.value,
        icon: selectedTypeData.value?.icon,
        jarFile: jarName,
        createdAt: new Date().toISOString(),
        path: relativePath,
        javaSettings
    }

    await writeTextFile(
      await join(relativePath, 'server.json'),
      JSON.stringify(metadata, null, 2),
      { baseDir: BaseDirectory.Document }
    )

    statusMessage.value = 'Done!'
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Refresh servers list in sidebar
    const serversStore = useServersStore()
    await serversStore.refreshServers()
    
    navigateTo('/')

  } catch (error) {
    console.error('Creation failed', error)
    statusMessage.value = `Error: ${error}`
  } finally {
    isCreating.value = false
  }
}
</script>
