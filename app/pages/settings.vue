<template>
  <div>
    <!-- Page header -->
    <div class="page-head" data-tauri-drag-region>
      <div class="page-head-left">
        <span class="eyebrow">Global Configuration</span>
        <h1 class="page-title">Settings</h1>
        <p class="page-sub">Configure global defaults for your servers and application preferences.</p>
      </div>
      <div class="page-head-right">
        <button class="btn" :disabled="saving" @click="handleManualSave">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
          {{ saving ? 'Saving…' : 'Save Settings' }}
        </button>
      </div>
    </div>

    <div class="col gap-16 mx-auto" style="max-width: 820px">

      <!-- Java Configuration -->
      <div class="card">
        <div class="card-head">
          <h4>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent)"><path d="M2 16.1A5 5 0 0 1 5.5 8h.5a5 5 0 0 1 10 0h.5a5 5 0 0 1 1.9 8.1" /><circle cx="12" cy="16" r="2" /><path d="M12 18v4" /></svg>
            Java Configuration
          </h4>
          <span class="text-faint" style="font-size: 12px">Manage Java versions and startup parameters</span>
        </div>

        <div class="card-pad col gap-20">
          <!-- Java Status -->
          <div class="card" style="background: var(--bg-2)">
            <div class="card-pad">
              <div class="between mb-12">
                <div class="row gap-8">
                  <span style="font-size: 13px; font-weight: 500; color: var(--ink-0)">System Java Status</span>
                  <span class="pill" :class="javaStatus.installed ? 'ok' : 'warn'">
                    <span class="dot" />
                    {{ javaStatus.installed ? 'Detected' : 'Not Found' }}
                  </span>
                </div>
                <button class="btn ghost sm" :disabled="checkingJava" @click="checkJava">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                  Refresh
                </button>
              </div>
              <div v-if="javaStatus.installed" class="input mono" style="cursor: default; background: var(--bg-3); color: var(--ok)">
                {{ javaStatus.version }}
              </div>
              <div v-else class="pill bad" style="padding: 8px 12px; border-radius: 8px; width: 100%; display: block">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 6px"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                Java not detected — install below or add to system PATH
              </div>
            </div>
          </div>

          <!-- Default RAM -->
          <div class="field">
            <div class="between mb-8">
              <label style="font-size: 13px; color: var(--ink-0); font-weight: 500">Default Memory (RAM)</label>
              <span class="text-mono" style="font-size: 20px; color: var(--accent); font-family: 'Instrument Serif', serif">{{ settings.defaultMemory }} <span style="font-size: 12px; color: var(--ink-3); font-family: 'Geist', sans-serif">GB</span></span>
            </div>
            <USlider v-model="settings.defaultMemory" :min="1" :max="systemRamGB" :step="0.5" color="primary" size="lg" />
            <div class="between mt-8">
              <span class="text-faint text-mono" style="font-size: 11px">1 GB</span>
              <span class="text-faint text-mono" style="font-size: 11px">{{ systemRamGB }} GB system</span>
            </div>
          </div>

          <!-- Default Flags -->
          <div class="field">
            <label>Global Startup Flags</label>
            <textarea
              v-model="settings.defaultFlags"
              class="textarea"
              rows="3"
              placeholder="-XX:+UseG1GC -XX:+ParallelRefProcEnabled ..."
            />
            <span class="hint">Arguments added to every server launch command</span>
          </div>

          <!-- Install Java -->
          <div class="card" style="background: var(--accent-soft); border-color: var(--accent-line)">
            <div class="card-pad">
              <div class="between mb-8">
                <div>
                  <div class="section-title mb-4">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Install Java
                  </div>
                  <span class="text-faint" style="font-size: 12px">Download official Eclipse Temurin runtimes</span>
                </div>
                <div class="row gap-6">
                  <button
                    v-for="ver in [8, 11, 17, 21, 25]"
                    :key="ver"
                    class="btn sm"
                    :disabled="downloadingVersion !== null && downloadingVersion !== ver"
                    @click="handleJavaDownload(ver)"
                  >
                    {{ downloadingVersion === ver ? '…' : `Java ${ver}` }}
                  </button>
                </div>
              </div>
              <div v-if="downloadingVersion !== null" class="col gap-6">
                <div class="between">
                  <span class="text-dim" style="font-size: 12px">Downloading Java {{ downloadingVersion }}…</span>
                </div>
                <div v-if="currentInstallPath" class="input mono" style="cursor: default; font-size: 10px; background: var(--bg-2)">{{ currentInstallPath }}</div>
                <UProgress animation="carousel" color="primary" size="sm" />
              </div>
            </div>
          </div>

          <!-- Java Installations -->
          <div>
            <div class="between mb-16">
              <div>
                <div class="section-title mb-4">Java Installations</div>
                <span class="text-faint" style="font-size: 12px">Configure paths for specific Java versions</span>
              </div>
              <button class="btn ghost sm" :disabled="detectingJava" @click="detectAllJavaVersions">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" /></svg>
                Auto-Detect
              </button>
            </div>
            <div class="grid-2 gap-12">
              <div v-for="(jver) in javaVersions" :key="jver.key" class="card" style="background: var(--bg-2)">
                <div class="card-pad col gap-8">
                  <div class="between">
                    <div class="row gap-8">
                      <span style="font-size: 13px; font-weight: 500; color: var(--ink-0)">Java {{ jver.label }}</span>
                      <span class="pill" style="font-size: 10px; padding: 1px 6px">{{ jver.mc }}</span>
                    </div>
                    <span v-if="settings.javaInstallations[jver.key]" class="dot" style="color: var(--ok)" />
                  </div>
                  <div class="row gap-6">
                    <input
                      v-model="settings.javaInstallations[jver.key]"
                      class="input mono"
                      :placeholder="`Path to java${jver.key === 'java8' || jver.key === 'java11' ? '.exe' : ''}`"
                      style="flex: 1"
                    />
                    <button class="btn ghost sm icon-only" @click="browseJavaPath(jver.key)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Application Settings -->
      <div class="card">
        <div class="card-head">
          <h4>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent)"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
            Application
          </h4>
        </div>
        <div class="card-pad col gap-12">
          <div class="between" style="padding: 12px 16px; background: var(--bg-2); border-radius: 10px; border: 1px solid var(--line-1)">
            <div class="row gap-12">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ink-2)"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="10" y1="14" x2="21" y2="3" /><line x1="3" y1="21" x2="14" y2="10" /></svg>
              <div>
                <div style="font-size: 13px; font-weight: 500; color: var(--ink-0)">Minimize to Tray</div>
                <div class="text-faint" style="font-size: 11px; margin-top: 2px">Keep running in background when closed</div>
              </div>
            </div>
            <div
              class="toggle"
              :class="{ on: settings.minimizeOnClose }"
              @click="settings.minimizeOnClose = !settings.minimizeOnClose"
            />
          </div>
        </div>
      </div>

      <!-- Tunnel Servers -->
      <div class="card">
        <div class="card-head">
          <h4>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent)"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
            Tunnel Servers
          </h4>
          <span class="text-faint" style="font-size: 12px">Configure custom or self-hosted tunnel servers</span>
        </div>
        <div class="card-pad col gap-8">
          <!-- Server list -->
          <div
            v-for="server in serverStore.serverConfigs"
            :key="server.id"
            class="between"
            style="padding: 10px 14px; border-radius: 10px; border: 1px solid var(--line-1); background: var(--bg-2)"
            :style="server.id === serverStore.selectedServerId ? 'border-color: var(--accent-line); background: var(--accent-soft)' : ''"
          >
            <div class="col gap-4" style="min-width: 0; flex: 1">
              <div class="row gap-8">
                <span style="font-size: 13px; font-weight: 500; color: var(--ink-0)">{{ server.name }}</span>
                <span v-if="server.isDefault" class="pill" style="font-size: 10px; padding: 1px 6px">Official</span>
                <span v-if="server.id === serverStore.selectedServerId" class="pill accent" style="font-size: 10px; padding: 1px 6px">Active</span>
              </div>
              <span class="text-mono text-faint" style="font-size: 11px">{{ server.controlHost }}:{{ server.controlPort }}</span>
            </div>
            <div class="row gap-6">
              <button
                v-if="server.id !== serverStore.selectedServerId"
                class="btn sm"
                @click="serverStore.setSelectedServer(server.id)"
              >
                Set Active
              </button>
              <button
                v-if="!server.isDefault"
                class="btn ghost sm icon-only"
                style="color: var(--bad)"
                @click="serverStore.removeServerConfig(server.id)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
              </button>
            </div>
          </div>

          <!-- Add Server Form -->
          <div class="card" style="background: var(--bg-2); border-style: dashed">
            <div class="card-pad col gap-12">
              <span class="section-title" style="font-size: 12px">Add Custom Server</span>
              <div class="grid-2 gap-8">
                <div class="field">
                  <label>Display Name</label>
                  <input v-model="newServer.name" class="input" placeholder="My Tunnel Server" />
                </div>
                <div class="field">
                  <label>API Base URL</label>
                  <input v-model="newServer.apiBaseUrl" class="input" placeholder="https://tunnel.example.com" />
                </div>
                <div class="field">
                  <label>Control Host</label>
                  <input v-model="newServer.controlHost" class="input" placeholder="tunnel.example.com" />
                </div>
                <div class="field">
                  <label>Control Port</label>
                  <input v-model="newServer.controlPort" class="input" placeholder="7001" type="number" />
                </div>
              </div>
              <div style="display: flex; justify-content: flex-end">
                <button
                  class="btn sm"
                  :disabled="!newServer.name || !newServer.apiBaseUrl || !newServer.controlHost"
                  @click="handleAddServer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Add Server
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="card">
        <div class="card-head">
          <h4>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent)"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            About VoidLink
          </h4>
          <span class="text-mono text-faint" style="font-size: 12px">v{{ currentAppVersion }}</span>
        </div>
        <div class="card-pad col gap-16">
          <div class="between">
            <div class="col gap-6">
              <div class="row gap-8">
                <span style="font-size: 13px; color: var(--ink-1)">Version</span>
                <span class="tag-mono">{{ currentAppVersion }}</span>
              </div>
              <span class="text-faint" style="font-size: 12px">
                Developed by
                <a href="http://makoto.com.pl" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: none">MakotoPD</a>
              </span>
            </div>
            <button class="btn ghost sm" :disabled="checkingUpdate" @click="checkUpdate">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
              Check for Updates
            </button>
          </div>

          <!-- Update available -->
          <div v-if="updateAvailable" class="card" style="background: var(--accent-soft); border-color: var(--accent-line)">
            <div class="card-pad row gap-16">
              <div>
                <div class="section-title mb-8" style="color: var(--accent)">New version available — {{ updateAvailable.version }}</div>
                <span class="text-faint" style="font-size: 12px">A new version of VoidLink is ready to install.</span>
              </div>
              <button class="btn" :disabled="isDownloadingUpdate" @click="handleUpdateDownload" style="flex-shrink: 0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                {{ isDownloadingUpdate ? 'Installing…' : 'Update & Restart' }}
              </button>
            </div>
          </div>

          <!-- Up to date -->
          <div v-else-if="!checkingUpdate" class="row gap-8" style="padding: 10px 14px; background: var(--ok-soft); border: 1px solid rgba(52,211,153,0.3); border-radius: 8px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ok); flex-shrink: 0"><polyline points="20 6 9 17 4 12" /></svg>
            <span style="font-size: 13px; color: var(--ok)">You're on the latest version of VoidLink.</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { open } from '@tauri-apps/plugin-shell'
import { useJava } from '~/composables/useJava'
import { GITHUB_RELEASES_URL } from '~/utils/version'
import { useSettingsStore } from '~/stores/useSettingsStore'
import { useServerConfigStore } from '~/stores/useServerConfigStore'
import { storeToRefs } from 'pinia'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { getVersion } from '@tauri-apps/api/app'
import { join, appDataDir } from '@tauri-apps/api/path'

definePageMeta({ layout: 'default' })

const loading = ref(true)
const saving = ref(false)
const checkingJava = ref(false)
const javaStatus = ref({ installed: false, version: '', details: '' })

const { installations, scanJava, downloadJava } = useJava()

const downloadingVersion = ref<number | null>(null)
const currentInstallPath = ref<string>('')

const checkingUpdate = ref(false)
const updateAvailable = ref<Update | null>(null)
const currentAppVersion = ref('')
const isDownloadingUpdate = ref(false)
const updateDownloadProgress = ref(0)

const settingsStore = useSettingsStore()
const { settings, systemRamGB } = storeToRefs(settingsStore)
const { loadSettings, saveSettings } = settingsStore

const serverStore = useServerConfigStore()

const newServer = reactive({
  name: '',
  apiBaseUrl: '',
  controlHost: '',
  controlPort: 7001 as number | string
})

const javaVersions = [
  { key: 'java8' as const, label: '8', mc: 'MC 1.12.x-' },
  { key: 'java11' as const, label: '11', mc: 'MC 1.13-1.16' },
  { key: 'java17' as const, label: '17', mc: 'MC 1.17-1.20.4' },
  { key: 'java21' as const, label: '21', mc: 'MC 1.20.5+' },
  { key: 'java25' as const, label: '25', mc: 'MC 26.1+' }
]

function handleAddServer() {
  const port = Number(newServer.controlPort)
  if (!newServer.name || !newServer.apiBaseUrl || !newServer.controlHost || !port) return
  serverStore.addServerConfig({
    name: newServer.name,
    apiBaseUrl: newServer.apiBaseUrl,
    controlHost: newServer.controlHost,
    controlPort: port
  })
  newServer.name = ''
  newServer.apiBaseUrl = ''
  newServer.controlHost = ''
  newServer.controlPort = 7001
}

const detectingJava = ref(false)
const toast = useToast()

onMounted(async () => {
  loading.value = true
  currentAppVersion.value = await getVersion()
  await loadSettings()
  await serverStore.loadConfigs()
  loading.value = false
  checkJava()
  checkUpdate()
})

async function checkUpdate() {
  checkingUpdate.value = true
  try {
    const update = await check()
    updateAvailable.value = update || null
  } catch (err) {
    console.error('Failed to check for updates', err)
  } finally {
    checkingUpdate.value = false
  }
}

async function handleUpdateDownload() {
  if (!updateAvailable.value) return
  isDownloadingUpdate.value = true
  try {
    await updateAvailable.value.downloadAndInstall((event) => {
      if (event.event === 'Progress') {
        updateDownloadProgress.value += event.data.chunkLength
      }
    })
    await relaunch()
  } catch (err) {
    console.error('Failed to install update', err)
    isDownloadingUpdate.value = false
    const errorMessage = String(err)
    if (errorMessage.includes('permission') || errorMessage.includes('sudo') || errorMessage.includes('root')) {
      toast.add({ title: 'Update requires elevated permissions', description: 'Please download and install the update manually.', icon: 'i-lucide-alert-triangle', color: 'warning', duration: 10000 })
    } else {
      toast.add({ title: 'Update failed', description: 'Auto-update failed. Opening releases page...', icon: 'i-lucide-alert-circle', color: 'error', duration: 5000 })
    }
    await open(GITHUB_RELEASES_URL)
  }
}

async function checkJava() {
  checkingJava.value = true
  await scanJava()
  const latest = installations.value[0]
  if (latest && latest.is_valid) {
    javaStatus.value = { installed: true, version: `Java ${latest.major} (${latest.version})`, details: latest.path }
  } else {
    javaStatus.value = { installed: false, version: '', details: 'No Java detected' }
  }
  checkingJava.value = false
}

async function browseJavaPath(key: 'java8' | 'java11' | 'java17' | 'java21' | 'java25') {
  try {
    const selected = await openDialog({ multiple: false, filters: [{ name: 'Java', extensions: ['exe', ''] }] })
    if (selected && typeof selected === 'string') {
      settings.value.javaInstallations[key] = selected
    }
  } catch (_e) {
    console.error('Failed to open file dialog')
  }
}

async function detectAllJavaVersions() {
  detectingJava.value = true
  try {
    await scanJava()
    for (const java of installations.value) {
      if (!java.is_valid || !java.major) continue
      if (java.major === 8 && !settings.value.javaInstallations.java8) settings.value.javaInstallations.java8 = java.path
      else if (java.major === 11 && !settings.value.javaInstallations.java11) settings.value.javaInstallations.java11 = java.path
      else if (java.major === 17 && !settings.value.javaInstallations.java17) settings.value.javaInstallations.java17 = java.path
      else if (java.major === 25 && !settings.value.javaInstallations.java25) settings.value.javaInstallations.java25 = java.path
      else if (java.major >= 21 && !settings.value.javaInstallations.java21) settings.value.javaInstallations.java21 = java.path
    }
  } catch (_e) {
    console.error('Failed to detect Java versions')
  } finally {
    detectingJava.value = false
  }
}

async function handleJavaDownload(major: number) {
  if (downloadingVersion.value !== null) return
  downloadingVersion.value = major
  try {
    const appData = await appDataDir()
    const installDir = await join(appData, 'java', major.toString())
    currentInstallPath.value = installDir
    toast.add({ title: `Downloading Java ${major}`, description: `Target: ${installDir}`, icon: 'i-lucide-download', color: 'primary', duration: 5000 })
    const javaPath = await downloadJava(major, installDir)
    if (major === 8) settings.value.javaInstallations.java8 = javaPath
    if (major === 11) settings.value.javaInstallations.java11 = javaPath
    if (major === 17) settings.value.javaInstallations.java17 = javaPath
    if (major === 21) settings.value.javaInstallations.java21 = javaPath
    if (major === 25) settings.value.javaInstallations.java25 = javaPath
    await scanJava()
    checkJava()
    toast.add({ title: 'Java Installed', description: `Java ${major} is ready to use.`, icon: 'i-lucide-check-circle', color: 'success', duration: 6000 })
  } catch (_e) {
    toast.add({ title: 'Download Failed', description: String(_e), icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    downloadingVersion.value = null
    currentInstallPath.value = ''
  }
}

async function handleManualSave() {
  saving.value = true
  await saveSettings()
  saving.value = false
}
</script>
