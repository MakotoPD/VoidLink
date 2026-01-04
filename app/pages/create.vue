<template>
  <div class="min-h-screen bg-gray-950 p-8 pb-32">
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Header with Progress -->
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="lg"
            @click="goBack"
          />
          <div class="flex-1">
            <h1 class="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {{ stepTitles[step - 1] }}
            </h1>
            <p class="text-gray-400 text-sm">
              {{ stepDescriptions[step - 1] }}
            </p>
          </div>
        </div>

        <!-- Step Progress Bar -->
        <div class="flex items-center gap-2">
          <template v-for="(title, i) in stepTitles" :key="i">
            <div 
              class="flex items-center gap-2 cursor-pointer"
              @click="i < step - 1 && (step = i + 1)"
            >
              <div 
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                :class="step > i + 1 
                  ? 'bg-success-500 text-white' 
                  : step === i + 1 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-800 text-gray-500'"
              >
                <UIcon v-if="step > i + 1" name="i-lucide-check" class="w-4 h-4" />
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span 
                class="text-sm hidden md:block"
                :class="step === i + 1 ? 'text-primary-500 font-medium' : 'text-gray-400'"
              >
                {{ title }}
              </span>
            </div>
            <div 
              v-if="i < stepTitles.length - 1" 
              class="flex-1 h-0.5 rounded"
              :class="step > i + 1 ? 'bg-success-500' : 'bg-gray-800'"
            />
          </template>
        </div>
      </div>

      <!-- Step 1: Engine Selection -->
      <div v-if="step === 1" class="max-w-5xl mx-auto animate-in fade-in duration-300">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="type in serverTypes" 
            :key="type.id"
            class="relative p-5 rounded-xl border-2 cursor-pointer transition-all group"
            :class="selectedType === type.id 
              ? 'border-primary-500 bg-primary-900/20' 
              : 'border-gray-800 bg-gray-900 hover:border-gray-700'"
            @click="selectType(type.id)"
          >
            <!-- Badge -->
            <div 
              v-if="type.badge" 
              class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
              :class="type.badge === 'recommended' 
                ? 'bg-blue-950 text-blue-400 border border-blue-500/50' 
                : 'bg-amber-950 text-amber-400 border border-amber-500/50'"
            >
              {{ type.badge === 'recommended' ? 'Recommended for Beginners' : 'Most Popular' }}
            </div>

            <!-- Icon & Name -->
            <div class="flex flex-col items-center text-center mb-4">
              <div class="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center mb-3">
                <UIcon :name="type.icon" class="w-7 h-7 text-gray-400" />
              </div>
              <h3 class="font-bold text-lg">{{ type.name }}</h3>
            </div>

            <!-- Description -->
            <p class="text-sm text-gray-400 text-center mb-4 leading-relaxed min-h-[60px]">
              {{ type.description }}
            </p>

            <!-- Performance Bar -->
            <div v-if="type.id !== 'custom'" class="mb-4">
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>Performance</span>
                <span 
                  :class="{
                    'text-green-400': type.performance === 'excellent',
                    'text-blue-400': type.performance === 'good',
                    'text-amber-400': type.performance === 'moderate'
                  }"
                >
                  {{ type.performance === 'excellent' ? 'Excellent' : type.performance === 'good' ? 'Good' : 'Moderate' }}
                </span>
              </div>
              <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all"
                  :class="{
                    'bg-green-500 w-full': type.performance === 'excellent',
                    'bg-blue-500 w-1/2': type.performance === 'good',
                    'bg-amber-500 w-1/3': type.performance === 'moderate'
                  }"
                />
              </div>
            </div>

            <!-- Features -->
            <div v-if="type.id !== 'custom'" class="flex justify-between text-xs">
              <div class="flex items-center gap-1" :class="type.supportsPlugins ? 'text-green-400' : 'text-gray-600'">
                <UIcon :name="type.supportsPlugins ? 'i-lucide-check' : 'i-lucide-x'" class="w-3.5 h-3.5" />
                <span>{{ type.supportsPlugins ? 'Plugins' : 'No Plugins' }}</span>
              </div>
              <div class="flex items-center gap-1" :class="type.supportsMods ? 'text-green-400' : 'text-gray-600'">
                <UIcon :name="type.supportsMods ? 'i-lucide-check' : 'i-lucide-x'" class="w-3.5 h-3.5" />
                <span>{{ type.supportsMods ? 'Mods' : 'No Mods' }}</span>
              </div>
            </div>

            <!-- Select Button -->
            <div class="mt-4">
              <button 
                class="w-full py-2 rounded-lg font-medium text-sm transition-colors"
                :class="selectedType === type.id 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'"
              >
                {{ selectedType === type.id ? 'Selected' : `Select ${type.name}` }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Version Selection -->
      <div v-else-if="step === 2" class="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
        <!-- Selected Engine Summary -->
        <div class="flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-gray-800">
          <div class="p-3 rounded-lg bg-primary-900/30 text-primary-400">
            <UIcon :name="selectedTypeData?.icon || 'i-lucide-box'" class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-bold">{{ selectedTypeData?.name }}</h3>
            <p class="text-xs text-gray-500">Selected Engine</p>
          </div>
        </div>

        <!-- Custom JAR Picker -->
        <div v-if="selectedType === 'custom'" class="space-y-2">
          <label class="text-sm font-medium text-gray-200">Server JAR File</label>
          <div 
            class="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-900/20 transition-colors"
            @click="selectJarFile"
          >
            <div v-if="!customJarPath" class="space-y-2">
              <UIcon name="i-lucide-upload" class="w-12 h-12 mx-auto text-gray-400" />
              <p class="text-gray-500">Click to select a .jar file</p>
            </div>
            <div v-else class="space-y-2">
              <UIcon name="i-lucide-file-check" class="w-12 h-12 mx-auto text-success-500" />
              <p class="font-medium text-white">{{ customJarName }}</p>
              <p class="text-xs text-gray-400 truncate">{{ customJarPath }}</p>
            </div>
          </div>
        </div>

        <!-- Version Selection -->
        <div v-else class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="text-sm font-medium text-gray-200">Game Version</label>
            <div v-if="canToggleSnapshots" class="flex items-center gap-2">
              <span class="text-xs text-gray-500">{{ toggleLabel }}</span>
              <USwitch v-model="includeSnapshots" size="sm" />
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
          />
        </div>
      </div>

      <!-- Step 3: World Settings -->
      <div v-else-if="step === 3" class="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        <!-- World Type Cards -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-gray-200">World Type</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div 
              v-for="wt in worldTypes" 
              :key="wt.value"
              class="relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary-400"
              :class="worldType === wt.value 
                ? 'border-primary-500 bg-primary-900/20' 
                : 'border-gray-800 bg-gray-900'"
              @click="worldType = wt.value"
            >
              <!-- Selection indicator -->
              <div 
                class="absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                :class="worldType === wt.value 
                  ? 'border-primary-500 bg-primary-500' 
                  : 'border-gray-600'"
              >
                <UIcon v-if="worldType === wt.value" name="i-lucide-check" class="w-3 h-3 text-white" />
              </div>
              
              <div class="p-2 w-10 h-10 rounded-lg bg-gray-800 mb-3 flex items-center justify-center">
                <UIcon :name="wt.icon" class="w-5 h-5 text-gray-400" />
              </div>
              <h4 class="font-semibold text-sm mb-1">{{ wt.label }}</h4>
              <p class="text-xs text-gray-500 leading-relaxed">{{ wt.description }}</p>
            </div>
          </div>
        </div>

        <!-- Two Column Layout -->
        <div class="grid md:grid-cols-2 gap-6">
          <!-- World Settings -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-200">World Settings</h3>
            
            <!-- World Seed -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <label class="text-xs text-gray-500">World Seed (Optional)</label>
                <UButton 
                  size="xs" 
                  color="primary" 
                  variant="ghost"
                  icon="i-lucide-shuffle"
                  @click="worldSeed = Math.floor(Math.random() * 9999999999).toString()"
                >
                  Randomize
                </UButton>
              </div>
              <UInput
                v-model="worldSeed"
                placeholder="Leave blank for random seed"
                size="lg"
                class="w-full"
              />
            </div>
          </div>

          <!-- Features -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-200">Features</h3>
            
            <!-- Generate Structures -->
            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div class="flex items-start gap-3">
                <div class="p-2 rounded-lg bg-blue-900/30">
                  <UIcon name="i-lucide-landmark" class="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p class="font-medium text-sm">Generate Structures</p>
                  <p class="text-xs text-gray-500">Include villages, dungeons, and strongholds in the world generation.</p>
                </div>
              </div>
              <USwitch v-model="generateStructures" />
            </div>

            <!-- Hardcore Mode -->
            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div class="flex items-start gap-3">
                <div class="p-2 rounded-lg bg-red-900/30">
                  <UIcon name="i-lucide-skull" class="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p class="font-medium text-sm">Hardcore Mode</p>
                  <p class="text-xs text-gray-500">World is deleted upon death. For experienced players only.</p>
                </div>
              </div>
              <USwitch v-model="hardcoreMode" />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Server Settings -->
      <div v-else-if="step === 4" class="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
        <!-- Java Version Info -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-coffee" class="w-5 h-5 text-amber-500" />
              <span class="font-medium">Java Runtime</span>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">Detected Version</p>
                <p class="font-mono font-medium">{{ detectedJavaVersion || 'Checking...' }}</p>
              </div>
              <UButton 
                icon="i-lucide-refresh-cw" 
                size="sm" 
                color="neutral" 
                variant="ghost"
                :loading="checkingJava"
                @click="detectJavaVersion"
              />
            </div>
            
            <div class="p-3 rounded-lg" :class="javaCompatibility.class">
              <div class="flex items-center gap-2">
                <UIcon :name="javaCompatibility.icon" class="w-5 h-5" />
                <div>
                  <p class="font-medium text-sm">{{ javaCompatibility.title }}</p>
                  <p class="text-xs opacity-80">{{ javaCompatibility.message }}</p>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Server Name & RAM -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-settings" class="w-5 h-5 text-primary-500" />
              <span class="font-medium">Server Settings</span>
            </div>
          </template>

          <div class="space-y-5">
            <!-- Server Name -->
            <div class="space-y-2 flex flex-col">
              <label class="text-sm font-medium text-gray-200">Server Name</label>
              <UInput
                v-model="serverName"
                placeholder="My Awesome Server"
                size="lg"
                icon="i-lucide-type"
              />
            </div>

            <!-- RAM Limit -->
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label class="text-sm font-medium text-gray-200">RAM Allocation</label>
                <span class="text-lg font-bold text-primary-500">{{ ramLimit }} GB</span>
              </div>
              <input 
                type="range" 
                v-model.number="ramLimit" 
                min="1" 
                max="16" 
                step="1"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div class="flex justify-between text-xs text-gray-400">
                <span>1 GB</span>
                <span class="text-success-500 font-medium">Recommended: 6-8 GB</span>
                <span>16 GB</span>
              </div>
            </div>

            <!-- Path Preview -->
            <div class="space-y-2 flex flex-col">
              <label class="text-sm font-medium text-gray-200">Installation Path</label>
              <UInput
                :model-value="serverPath"
                readonly
                icon="i-lucide-folder"
                color="neutral"
                variant="subtle"
                size="lg"
                class="opacity-75 cursor-not-allowed"
              />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Step 5: Summary -->
      <div v-else-if="step === 5" class="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-clipboard-check" class="w-5 h-5 text-success-500" />
              <span class="font-medium">Server Summary</span>
            </div>
          </template>

          <div class="divide-y divide-gray-800">
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Engine</span>
              <span class="font-medium">{{ selectedTypeData?.name }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Version</span>
              <span class="font-medium">{{ selectedType === 'custom' ? customJarName : selectedVersion }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">World Type</span>
              <span class="font-medium">{{ worldTypes.find(t => t.value === worldType)?.label }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Seed</span>
              <span class="font-medium font-mono">{{ worldSeed || 'Random' }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Level Name</span>
              <span class="font-medium">{{ levelName }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Structures</span>
              <span class="font-medium">{{ generateStructures ? 'Enabled' : 'Disabled' }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Hardcore</span>
              <span class="font-medium" :class="hardcoreMode ? 'text-red-500' : ''">{{ hardcoreMode ? 'Enabled' : 'Disabled' }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Server Name</span>
              <span class="font-medium">{{ serverName }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">RAM</span>
              <span class="font-medium">{{ ramLimit }} GB</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Java</span>
              <span class="font-medium font-mono">{{ detectedJavaVersion || 'System default' }}</span>
            </div>
          </div>
        </UCard>

        <!-- Status Message -->
        <div v-if="statusMessage" class="text-center">
          <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 text-white text-sm backdrop-blur">
            <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
            {{ statusMessage }}
          </span>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 z-50">
        <div class="max-w-4xl mx-auto flex justify-between items-center">
          <UButton
            v-if="step > 1"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="step--"
          >
            Back
          </UButton>
          <div v-else />

          <UButton
            v-if="step < 5"
            color="primary"
            trailing-icon="i-lucide-arrow-right"
            :disabled="!canContinue"
            @click="step++"
          >
            Continue
          </UButton>

          <UButton
            v-else
            color="success"
            trailing-icon="i-lucide-rocket"
            :loading="isCreating"
            :disabled="!isValid"
            @click="createServer"
          >
            {{ isCreating ? 'Creating...' : 'Launch Server' }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid' 
import { fetch } from '@tauri-apps/plugin-http'
import { mkdir, writeFile, writeTextFile, readTextFile, copyFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { join, documentDir } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/plugin-dialog'
import { Command } from '@tauri-apps/plugin-shell'

// Step state
const step = ref(1)

const stepTitles = ['Engine', 'Version', 'World', 'Settings', 'Launch']
const stepDescriptions = [
  'Choose the server software that powers your world',
  'Select the game version to run',
  'Configure your world generation settings',
  'Set up server name, memory, and Java',
  'Review and launch your new server'
]

// Engine state
const selectedType = ref<string | null>(null)
const customJarPath = ref<string | null>(null)
const customJarName = ref<string>('')

// Version state
const selectedVersion = ref<string | undefined>(undefined)
const isLoadingVersions = ref(false)
const availableVersions = ref<string[]>([])
const includeSnapshots = ref(false)

// World state
const worldSeed = ref('')
const worldType = ref('default')
const levelName = ref('world')
const generateStructures = ref(true)
const hardcoreMode = ref(false)

const worldTypes = [
  { label: 'Default', value: 'default', icon: 'i-lucide-mountain', description: 'Standard Minecraft terrain generation suitable for most gameplay.' },
  { label: 'Superflat', value: 'flat', icon: 'i-lucide-minus', description: 'Completely flat terrain, ideal for creative building projects.' },
  { label: 'Large Biomes', value: 'largeBiomes', icon: 'i-lucide-globe', description: 'Standard terrain but with biomes expanded to 16x larger size.' },
  { label: 'Amplified', value: 'amplified', icon: 'i-lucide-trending-up', description: 'Exaggerated terrain height and cliffs (requires strong CPU).' }
]

// Server settings state
const serverName = ref('')
const ramLimit = ref(6)

// Java detection
const detectedJavaVersion = ref<string | null>(null)
const checkingJava = ref(false)

// Creation state
const isCreating = ref(false)
const statusMessage = ref('')

interface ServerType {
  id: string
  name: string
  icon: string
  description: string
  performance: 'excellent' | 'good' | 'moderate'
  supportsPlugins: boolean
  supportsMods: boolean
  badge?: 'recommended' | 'popular'
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
    name: 'Vanilla', 
    icon: 'i-lucide-box', 
    description: 'The unmodified, official Minecraft experience as provided by Mojang.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: false,
    badge: 'recommended',
    api: { 
      url: 'https://mcjarfiles.com/api/get-versions/vanilla/release',
      snapshotUrl: 'https://mcjarfiles.com/api/get-versions/vanilla/snapshot',
      type: 'mcjarfiles'
    }
  },
  { 
    id: 'paper', 
    name: 'Paper', 
    icon: 'i-lucide-scroll', 
    description: 'An optimized fork of Spigot, offering better performance and configuration. Best for plugin servers.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    badge: 'popular',
    api: { url: 'https://mcjarfiles.com/api/get-versions/servers/paper', type: 'mcjarfiles' }
  },
  { 
    id: 'purpur', 
    name: 'Purpur', 
    icon: 'i-lucide-cat', 
    description: 'Drop-in replacement for Paper with many additional gameplay features and tweaks.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    api: { url: 'https://mcjarfiles.com/api/get-versions/servers/purpur', type: 'mcjarfiles' }
  },
  { 
    id: 'fabric', 
    name: 'Fabric', 
    icon: 'i-lucide-layers', 
    description: 'Lightweight, modern modding toolchain. Fast updates and performance-focused mods.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: true,
    api: { url: 'https://mcjarfiles.com/api/get-versions/modded/fabric', type: 'mcjarfiles' }
  },
  { 
    id: 'forge', 
    name: 'Forge', 
    icon: 'i-lucide-anvil', 
    description: 'The original and most popular mod loader. Largest mod library available.',
    performance: 'moderate',
    supportsPlugins: false,
    supportsMods: true,
    api: { url: 'https://mcjarfiles.com/api/get-versions/modded/forge', type: 'mcjarfiles' }
  },
  { 
    id: 'neoforge', 
    name: 'NeoForge', 
    icon: 'i-lucide-zap', 
    description: 'Community-driven fork of Forge with improved performance and modern features.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: true,
    api: { url: 'https://mcjarfiles.com/api/get-versions/modded/neoforge', type: 'mcjarfiles' }
  },
  { 
    id: 'velocity', 
    name: 'Velocity', 
    icon: 'i-lucide-network', 
    description: 'A modern, high-performance proxy for connecting multiple servers together.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    api: { url: 'https://mcjarfiles.com/api/get-versions/proxies/velocity', type: 'mcjarfiles' }
  },
  { 
    id: 'custom', 
    name: 'Custom JAR', 
    icon: 'i-lucide-upload', 
    description: 'Use your own server JAR file from local disk.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: false,
    api: { url: '', type: 'custom' as any }
  }
]

const selectedTypeData = computed(() => serverTypes.find(t => t.id === selectedType.value))

const canToggleSnapshots = computed(() => {
  return selectedTypeData.value?.id === 'vanilla'
})

const toggleLabel = computed(() => 'Show Snapshots')

// Java compatibility check
const javaCompatibility = computed(() => {
  if (!detectedJavaVersion.value) {
    return {
      class: 'bg-gray-800 text-gray-400',
      icon: 'i-lucide-info',
      title: 'Detecting Java...',
      message: 'Checking your system for Java installation'
    }
  }

  const javaMatch = detectedJavaVersion.value.match(/(\d+)/)
  const javaVer = javaMatch ? parseInt(javaMatch[1]) : 0
  const mcVersion = selectedVersion.value || ''
  
  // Determine required Java version
  let requiredJava = 17
  if (mcVersion >= '1.20.5') requiredJava = 21
  else if (mcVersion >= '1.17') requiredJava = 17
  else requiredJava = 8

  if (javaVer >= requiredJava) {
    return {
      class: 'bg-success-900/30 text-success-400',
      icon: 'i-lucide-check-circle',
      title: 'Java Compatible',
      message: `Java ${javaVer} meets the requirement of Java ${requiredJava}+ for Minecraft ${mcVersion || 'this version'}`
    }
  } else {
    return {
      class: 'bg-warning-900/30 text-warning-400',
      icon: 'i-lucide-alert-triangle',
      title: 'Java Update Recommended',
      message: `Minecraft ${mcVersion} requires Java ${requiredJava}+. You have Java ${javaVer}.`
    }
  }
})

const serverId = computed(() => uuidv4().slice(0, 8))

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

const canContinue = computed(() => {
  switch (step.value) {
    case 1: return !!selectedType.value
    case 2: 
      if (selectedType.value === 'custom') return !!customJarPath.value
      return !!selectedVersion.value
    case 3: return true // World settings are optional
    case 4: return serverName.value.length > 0
    default: return true
  }
})

const isValid = computed(() => {
  if (selectedType.value === 'custom') {
    return customJarPath.value && serverName.value.length > 0
  }
  return selectedVersion.value && serverName.value.length > 0
})

function selectType(id: string) {
  selectedType.value = id
}

async function selectJarFile() {
  const selected = await open({
    multiple: false,
    filters: [{ name: 'JAR Files', extensions: ['jar'] }]
  })
  
  if (selected && typeof selected === 'string') {
    customJarPath.value = selected
    const parts = selected.replace(/\\/g, '/').split('/')
    customJarName.value = parts[parts.length - 1] || 'server.jar'
  }
}

function goBack() {
  if (step.value > 1) {
    step.value--
  } else {
    navigateTo('/')
  }
}

async function detectJavaVersion() {
  checkingJava.value = true
  try {
    const command = Command.create('run-bat', ['/C', 'java -version'])
    const output = await command.execute()
    
    // Java outputs version to stderr
    const versionOutput = output.stderr || output.stdout
    const match = versionOutput.match(/version "([^"]+)"/)
    
    if (match) {
      detectedJavaVersion.value = match[1]
    } else {
      detectedJavaVersion.value = 'Not found'
    }
  } catch (e) {
    console.error('Failed to detect Java', e)
    detectedJavaVersion.value = 'Not found'
  } finally {
    checkingJava.value = false
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

    if (includeSnapshots.value && apiConfig.snapshotUrl) {
      url = apiConfig.snapshotUrl
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

// Watchers
watch(step, (newStep) => {
  if (newStep === 2 && selectedType.value !== 'custom') {
    fetchVersions()
    includeSnapshots.value = false 
  }
  if (newStep === 4) {
    detectJavaVersion()
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
      const url = `${apiConfig.url}/versions/${version}/builds/latest`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data?.downloads?.['server:default']?.url) {
        return `https://fill-data.papermc.io/v1/objects/${data.downloads['server:default'].checksums.sha256}/${data.downloads['server:default'].name}`
      }
      return null
    } else {
      let baseUrl = apiConfig.url
      
      if (baseUrl.includes('get-versions')) {
        let downloadUrl = baseUrl.replace('get-versions', 'get-jar')
        
        if (includeSnapshots.value && apiConfig.snapshotUrl) {
          downloadUrl = apiConfig.snapshotUrl.replace('get-versions', 'get-jar')
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
  
  try {
    const uniqueId = uuidv4().slice(0, 8)
    const safeName = (serverName.value || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const folderName = `${safeName}-${uniqueId}`
    const relativePath = `MineDash/servers/${folderName}`

    statusMessage.value = 'Creating directory...'
    await mkdir(relativePath, { baseDir: BaseDirectory.Document, recursive: true })

    const jarName = 'server.jar'
    
    if (selectedType.value === 'custom' && customJarPath.value) {
      statusMessage.value = 'Copying JAR file...'
      const docDir = await documentDir()
      const destPath = await join(docDir, relativePath, jarName)
      await copyFile(customJarPath.value, destPath)
    } else {
      statusMessage.value = 'Resolving download URL...'
      const downloadUrl = await resolveDownloadUrl()
      
      if (!downloadUrl) {
        statusMessage.value = 'Failed to resolve download URL.'
        isCreating.value = false
        return
      }

      statusMessage.value = 'Downloading server JAR...'
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`)
      
      const buffer = await response.arrayBuffer()
      await writeFile(
        await join(relativePath, jarName),
        new Uint8Array(buffer),
        { baseDir: BaseDirectory.Document }
      )
    }

    statusMessage.value = 'Writing server.properties...'
    
    // Create server.properties with world settings
    const serverProperties = [
      `level-seed=${worldSeed.value}`,
      `level-name=${levelName.value || 'world'}`,
      `level-type=minecraft\\:${worldType.value}`,
      `generate-structures=${generateStructures.value}`,
      `hardcore=${hardcoreMode.value}`,
      `motd=${serverName.value}`,
      `max-players=20`
    ].join('\n')

    await writeTextFile(
      await join(relativePath, 'server.properties'),
      serverProperties,
      { baseDir: BaseDirectory.Document }
    )

    statusMessage.value = 'Creating server configuration...'

    // Create Metadata
    const metadata = {
      id: uniqueId,
      name: serverName.value,
      type: selectedTypeData.value?.id,
      typeName: selectedTypeData.value?.name,
      version: selectedType.value === 'custom' ? 'Custom' : selectedVersion.value,
      icon: selectedTypeData.value?.icon,
      jarFile: jarName,
      createdAt: new Date().toISOString(),
      path: relativePath,
      javaSettings: {
        memory: ramLimit.value,
        path: 'java',
        flags: ''
      }
    }

    await writeTextFile(
      await join(relativePath, 'server.json'),
      JSON.stringify(metadata, null, 2),
      { baseDir: BaseDirectory.Document }
    )

    statusMessage.value = 'Done! Launching server...'
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Refresh servers list in sidebar
    const serversStore = useServersStore()
    await serversStore.refreshServers()
    
    // Navigate to the new server
    navigateTo(`/server/${folderName}`)

  } catch (error) {
    console.error('Creation failed', error)
    statusMessage.value = `Error: ${error}`
  } finally {
    isCreating.value = false
  }
}
</script>
