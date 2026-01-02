<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
     <div class="max-w-2xl mx-auto space-y-8">
       <!-- Header -->
       <div class="flex items-center gap-4">
         <UButton
           icon="i-lucide-arrow-left"
           color="neutral"
           variant="ghost"
           @click="navigateTo('/')"
         />
         <div>
           <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
           <p class="text-gray-500 dark:text-gray-400">Configure global defaults for your servers.</p>
         </div>
       </div>

       <div class="space-y-6">
          <UCard>
             <template #header>
                <div class="flex items-center gap-2">
                   <UIcon name="i-lucide-coffee" class="text-primary-500" />
                   <h3 class="font-semibold">Java Defaults</h3>
                </div>
             </template>

             <div class="space-y-6">
                <!-- Java Status --> 
                <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
                    <div class="flex items-center justify-between mb-2">
                       <h4 class="font-medium text-sm">System Java Status</h4>
                       <UBadge :color="javaStatus.installed ? 'success' : 'warning'" variant="subtle">
                          {{ javaStatus.installed ? 'Detected' : 'Not Found' }}
                       </UBadge>
                    </div>
                    <div v-if="javaStatus.installed" class="text-xs text-gray-600 dark:text-gray-400">
                       {{ javaStatus.version }}
                    </div>
                    <div v-else class="text-xs text-red-500">
                       Java could not be found via 'java -version'. Please ensure it's installed and in your PATH, or set a custom path below.
                    </div>
                    <div class="mt-2">
                       <UButton size="xs" color="neutral" variant="ghost" :loading="checkingJava" @click="checkJava" icon="i-lucide-refresh-cw">
                          Check Again
                       </UButton>
                    </div>
                </div>

                <!-- Default RAM -->
                <div class="space-y-4">
                   <div class="flex justify-between">
                     <label class="text-sm font-medium">Default Memory (RAM)</label>
                     <span class="text-sm font-bold text-primary-500">{{ settings.defaultMemory }} GB</span>
                   </div>
                   <USlider v-model="settings.defaultMemory" :min="1" :max="32" :step="0.5" />
                   <div class="flex justify-between text-xs text-gray-500">
                      <span>1 GB</span>
                      <span>32 GB</span>
                   </div>
                </div>

                <!-- Default Flags -->
                <div class="space-y-2">
                   <label class="text-sm font-medium">Global Startup Flags</label>
                   <UTextarea v-model="settings.defaultFlags" :rows="3" placeholder="-XX:+UseG1GC ..." />
                   <p class="text-xs text-gray-500">These flags are applied to all new servers by default.</p>
                </div>
             </div>

             <template #footer>
                <div class="flex justify-end">
                   <UButton color="primary" :loading="saving" @click="saveSettings">Save Settings</UButton>
                </div>
             </template>
          </UCard>

          <UCard>
             <template #header>
                <div class="flex items-center gap-2">
                   <UIcon name="i-lucide-info" class="text-gray-500" />
                   <h3 class="font-semibold">About MineDash</h3>
                </div>
             </template>
             <div class="text-sm text-gray-500 space-y-2">
                <p>Version: 0.1.0-alpha</p>
                <p>Created by <a href="http://makoto.com.pl" target="_blank" rel="noopener noreferrer">MakotoPD</a></p>
             </div>
          </UCard>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { detectJava, type JavaStatus } from '~/utils/javaDetection'

const loading = ref(true)
const saving = ref(false)
const checkingJava = ref(false)
const javaStatus = ref<JavaStatus>({ installed: false, version: '', details: '' })

const settings = reactive({
   javaPath: 'java',
   defaultMemory: 4,
   defaultFlags: ''
})

onMounted(() => {
   loadSettings()
   checkJava()
})

async function checkJava() {
   checkingJava.value = true
   javaStatus.value = await detectJava()
   checkingJava.value = false
}

async function loadSettings() {
   loading.value = true
   try {
     const content = await readTextFile('MineDash/settings.json', { baseDir: BaseDirectory.Document })
     const data = JSON.parse(content)
     if (data) {
        settings.javaPath = data.javaPath ?? 'java'
        settings.defaultMemory = data.defaultMemory ?? 4
        settings.defaultFlags = data.defaultFlags ?? ''
     }
   } catch (e) {
      console.log('No settings file found, using defaults.')
   } finally {
      loading.value = false
   }
}

async function saveSettings() {
   saving.value = true
   try {
      await writeTextFile(
         'MineDash/settings.json', 
         JSON.stringify(settings, null, 2), 
         { baseDir: BaseDirectory.Document }
      )
      // Toast would go here
      console.log('Settings global saved')
   } catch (e) {
      console.error('Failed to save settings:', e)
   } finally {
      saving.value = false
   }
}
</script>
