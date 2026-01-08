<template>
  <UModal v-model:open="isOpen" class="max-w-2xl" description="">
    <template #header>
      <div class="flex justify-between items-center w-full">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary-500/20 rounded-lg flex justify-center items-center">
            <UIcon name="i-lucide-globe" class="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold">Tunnel Manager</h3>
            <p class="text-sm text-gray-400">
              {{ authStore.isAuthenticated ? `${tunnelStore.tunnels.length}/${tunnelStore.tunnelLimit} tunnels` : 'Login required' }}
            </p>
          </div>
        </div>
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="isOpen = false" />
      </div>
    </template>

    <template #body>
      <!-- Not Authenticated -->
      <div v-if="!authStore.isAuthenticated" class="py-8 text-center">
        <div class="p-4 bg-gray-800/60 rounded-full w-fit mx-auto mb-4">
          <UIcon name="i-lucide-lock" class="w-12 h-12 text-gray-400" />
        </div>
        <h4 class="text-lg font-medium mb-2">Sign in to use Tunnels</h4>
        <p class="text-gray-400 mb-6 max-w-sm mx-auto">
          Create an account to expose your Minecraft servers to the internet with custom subdomains.
        </p>
        <UButton color="primary" @click="showAuthModal = true">
          <UIcon name="i-lucide-log-in" class="mr-2" />
          Sign In / Register
        </UButton>
      </div>

      <!-- Authenticated -->
      <div v-else class="space-y-4">
        <!-- User Info Bar -->
        <div class="flex items-center justify-between p-3 bg-gray-800/60 rounded-lg border border-gray-700">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-success-500/20 rounded-lg flex justify-center items-center">
              <UIcon name="i-lucide-user-check" class="w-4 h-4 text-success-400" />
            </div>
            <div>
              <p class="text-sm font-medium">{{ authStore.user?.email }}</p>
              <p class="text-xs text-gray-500">
                2FA: {{ authStore.user?.totp_enabled ? 'Enabled' : 'Disabled' }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton 
              v-if="!authStore.user?.totp_enabled"
              size="xs" 
              color="neutral" 
              variant="outline"
              @click="show2FASetup = true"
            >
              Enable 2FA
            </UButton>
            <UButton 
              v-else
              size="xs" 
              color="error" 
              variant="outline"
              @click="confirmDisable2FA"
            >
              Disable 2FA
            </UButton>
            <UButton 
              size="xs" 
              color="error" 
              variant="ghost"
              @click="authStore.logout()"
            >
              Logout
            </UButton>
          </div>
        </div>

        <!-- Error -->
        <div v-if="tunnelStore.error" class="bg-error-500/20 border border-error-500/50 rounded-lg p-3 text-sm text-error-400">
          {{ tunnelStore.error }}
          <button class="ml-2 underline" @click="tunnelStore.clearError()">Dismiss</button>
        </div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <UButton 
            color="primary" 
            size="sm" 
            :disabled="!tunnelStore.canCreateTunnel"
            @click="showCreateModal = true"
          >
            <UIcon name="i-lucide-plus" class="mr-1" />
            New Tunnel
          </UButton>
          <UButton 
            color="neutral" 
            variant="outline" 
            size="sm" 
            @click="tunnelStore.fetchTunnels()"
            :loading="tunnelStore.loading"
          >
            <UIcon name="i-lucide-refresh-cw" class="mr-1" />
            Refresh
          </UButton>
        </div>

        <!-- Tunnels List -->
        <div v-if="tunnelStore.tunnels.length === 0" class="py-6 text-center text-gray-400">
          <UIcon name="i-lucide-cloud-off" class="w-8 h-8 mx-auto mb-2" />
          <p>No tunnels yet. Create one to get started!</p>
        </div>

        <div v-else class="space-y-3 max-h-80 overflow-y-auto">
          <div 
            v-for="tunnel in tunnelStore.tunnels" 
            :key="tunnel.id"
            class="p-4 bg-gray-800/60 rounded-lg border border-gray-700"
          >
            <!-- Tunnel Header -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div :class="['w-3 h-3 rounded-full', tunnel.is_active ? 'bg-success-500 animate-pulse' : 'bg-gray-500']"></div>
                <div>
                  <h4 class="font-medium">{{ tunnel.name }}</h4>
                  <p class="text-xs text-gray-500">{{ tunnel.subdomain }}</p>
                </div>
              </div>
              <div class="flex gap-2">
                <UButton 
                  :color="tunnel.is_active ? 'error' : 'success'" 
                  size="xs"
                  :loading="tunnelStore.loading"
                  @click="tunnel.is_active ? tunnelStore.stopTunnel(tunnel.id) : tunnelStore.startTunnel(tunnel.id)"
                >
                  {{ tunnel.is_active ? 'Stop' : 'Start' }}
                </UButton>
                <UButton 
                  icon="i-lucide-trash-2" 
                  color="error" 
                  variant="ghost" 
                  size="xs" 
                  @click="handleDelete(tunnel.id)"
                />
              </div>
            </div>

            <!-- Ports -->
            <div class="space-y-2">
              <div 
                v-for="port in tunnel.ports" 
                :key="port.public_port"
                class="flex items-center justify-between p-2 bg-gray-900/50 rounded text-sm"
              >
                <div class="flex items-center gap-2">
                  <span :class="['px-2 py-0.5 rounded text-xs font-medium', port.protocol === 'tcp' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400']">
                    {{ port.protocol.toUpperCase() }}
                  </span>
                  <span class="text-gray-400">{{ port.label }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <code class="text-primary-400 text-xs">{{ port.address }}</code>
                  <UButton 
                    icon="i-lucide-copy" 
                    color="neutral" 
                    variant="ghost" 
                    size="xs"
                    @click="copyToClipboard(port.address)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between items-center text-sm text-gray-400 w-full">
        <span>Powered by VoidLink Tunnels</span>
        <span class="text-xs">Region: EU</span>
      </div>
    </template>
  </UModal>

  <!-- Auth Modal -->
  <AuthModal v-model:open="showAuthModal" @success="onAuthSuccess" />

  <!-- Create Tunnel Modal -->
  <UModal v-model:open="showCreateModal" class="max-w-md">
    <template #header>
      <div class="flex justify-between items-center w-full">
        <h3 class="text-lg font-semibold">Create Tunnel</h3>
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="showCreateModal = false" />
      </div>
    </template>

    <template #body>
      <form @submit.prevent="handleCreate" class="space-y-4">
        <!-- Tunnel Name -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Tunnel Name</label>
          <UInput 
            v-model="newTunnel.name" 
            placeholder="My Survival Server" 
            required
          />
        </div>

        <!-- Ports -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-300">Ports</label>
            <UButton 
              size="xs" 
              color="neutral" 
              variant="outline"
              :disabled="newTunnel.ports.length >= 5"
              @click="addPort"
            >
              <UIcon name="i-lucide-plus" class="mr-1" />
              Add Port
            </UButton>
          </div>

          <div class="space-y-2">
            <div 
              v-for="(port, idx) in newTunnel.ports" 
              :key="idx"
              class="flex items-center gap-2 p-2 bg-gray-800/60 rounded-lg"
            >
              <UInput 
                v-model="port.label" 
                placeholder="Label" 
                class="flex-1"
                required
              />
              <UInput 
                v-model.number="port.local_port" 
                type="number" 
                placeholder="Port" 
                class="w-24"
                :min="1"
                :max="65535"
                required
              />
              <select 
                v-model="port.protocol" 
                class="px-2 py-2 bg-gray-700 rounded text-sm border border-gray-600"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
              <UButton 
                v-if="newTunnel.ports.length > 1"
                icon="i-lucide-x" 
                color="error" 
                variant="ghost" 
                size="xs"
                @click="removePort(idx)"
              />
            </div>
          </div>
        </div>

        <!-- Voice Chat Info -->
        <UAlert icon="i-lucide-info" color="primary" variant="soft" :ui="{ title: 'text-primary-400 font-bold' }" title="Voice Chat">
            <template #description>
                To use Voice Chat, create a UDP port and ensure the tunnel name is <b>exactly "voice"</b>.
                <div class="mt-2 text-xs opacity-90">
                  <p class="font-bold mb-1">Standard Ports (UDP):</p>
                  <ul class="list-disc list-inside space-y-0.5">
                    <li>Simple Voice Chat: <b>24454</b></li>
                    <li>Plasmo Voice: <b>25565</b></li>
                  </ul>
                </div>
            </template>
        </UAlert>

         <!-- Voice Chat Warning -->
        <UAlert v-if="newTunnel.ports.some(p => p.protocol === 'udp') && newTunnel.name.toLowerCase() !== 'voice'" icon="i-lucide-alert-triangle" color="warning" variant="subtle" title="Incorrect Tunnel Name">
            <template #description>
               You have a UDP port selected, which is typically used for Voice Chat. <br>
               For Voice Chat to work, this tunnel <b>must be named "voice"</b>.
            </template>
        </UAlert>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" @click="showCreateModal = false">Cancel</UButton>
        <UButton color="primary" @click="handleCreate" :loading="tunnelStore.loading">Create Tunnel</UButton>
      </div>
    </template>
  </UModal>

  <!-- 2FA Setup Modal -->
  <UModal v-model:open="show2FASetup" class="max-w-sm">
    <template #header>
      <h3 class="text-lg font-semibold">Enable Two-Factor Authentication</h3>
    </template>

    <template #body>
      <div v-if="!totpSetupData" class="text-center py-4">
        <UButton color="primary" @click="start2FASetup" :loading="loading2FA">
          Generate QR Code
        </UButton>
      </div>

      <div v-else class="space-y-4">
        <p class="text-sm text-gray-400">Scan this QR code with your authenticator app (2FAS, Google Authenticator, etc.)</p>
        
        <div class="flex justify-center">
          <img :src="totpSetupData.qr_code" alt="2FA QR Code" class="w-48 h-48 rounded-lg" />
        </div>

        <div class="text-center">
          <p class="text-xs text-gray-500 mb-1">Or enter this code manually:</p>
          <code class="text-sm bg-gray-800 px-3 py-1 rounded">{{ totpSetupData.secret }}</code>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
          <UInput 
            v-model="verifyCode" 
            placeholder="123456" 
            maxlength="6"
          />
        </div>

        <UButton 
          block 
          color="primary" 
          @click="verify2FA" 
          :loading="loading2FA"
          :disabled="verifyCode.length !== 6"
        >
          Verify & Enable
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Disable 2FA Modal -->
  <UModal v-model:open="show2FADisable" class="max-w-sm">
    <template #header>
      <h3 class="text-lg font-semibold text-error-400">Disable Two-Factor Authentication</h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="bg-error-500/10 border border-error-500/20 rounded-lg p-3 flex gap-3 text-sm text-error-400">
           <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 shrink-0" />
           <p>Disabling 2FA will make your account less secure. You will need your password and a final code to proceed.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
          <UInput 
            v-model="disable2FAData.password" 
            type="password"
            placeholder="********" 
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">2FA Code</label>
          <UInput 
            v-model="disable2FAData.code" 
            placeholder="123456" 
            maxlength="6"
          />
        </div>

        <div class="flex gap-2 justify-end">
           <UButton color="neutral" variant="ghost" @click="show2FADisable = false">Cancel</UButton>
           <UButton 
             color="error" 
             @click="handleDisable2FA" 
             :loading="loading2FA"
             :disabled="!disable2FAData.password || disable2FAData.code.length !== 6"
           >
             Disable 2FA
           </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'
import { useTunnelStore } from '~/stores/useTunnelStore'
import type { CreateTunnelPort } from '~/stores/useTunnelStore'

const isOpen = defineModel<boolean>('open', { default: false })

const authStore = useAuthStore()
const tunnelStore = useTunnelStore()

const showAuthModal = ref(false)
const showCreateModal = ref(false)
const show2FASetup = ref(false)
const show2FADisable = ref(false)

// Disable 2FA form
const disable2FAData = reactive({
  password: '',
  code: ''
})

// Create tunnel form
// Create tunnel form
interface TunnelPort {
  label: string
  local_port: number
  protocol: 'tcp' | 'udp'
}

const newTunnel = reactive<{ name: string; ports: TunnelPort[] }>({
  name: '',
  ports: [{ label: 'Game', local_port: 25565, protocol: 'tcp' }]
})

// 2FA setup
const totpSetupData = ref<{ secret: string; qr_code: string; url: string } | null>(null)
const verifyCode = ref('')
const loading2FA = ref(false)

// Load tunnels when modal opens and user is authenticated
watch(isOpen, async (open) => {
  if (open) {
    // Check for pending password reset
    if (authStore.pendingResetCode) {
      showAuthModal.value = true
      return
    }

    if (authStore.isAuthenticated) {
      await tunnelStore.fetchTunnels()
    }
  }
})

function onAuthSuccess() {
  tunnelStore.fetchTunnels()
}

function addPort() {
  if (newTunnel.ports.length < 5) {
    newTunnel.ports.push({ label: '', local_port: 25565, protocol: 'tcp' })
  }
}

function removePort(idx: number) {
  newTunnel.ports.splice(idx, 1)
}

async function handleCreate() {
  if (!newTunnel.name || newTunnel.ports.length === 0) return

  // Warn if UDP is used without "voice" name
  if (newTunnel.ports.some(p => p.protocol === 'udp') && newTunnel.name.toLowerCase() !== 'voice') {
     if (!confirm('You are using UDP ports but the tunnel name is not "voice". Simple Voice Chat will NOT work. Continue?')) {
        return
     }
  }

  const ports: CreateTunnelPort[] = newTunnel.ports.map(p => ({
    label: p.label,
    local_port: p.local_port,
    protocol: p.protocol
  }))

  const result = await tunnelStore.createTunnel(newTunnel.name, ports)
  if (result) {
    showCreateModal.value = false
    // Reset form
    newTunnel.name = ''
    newTunnel.ports = [{ label: 'Game', local_port: 25565, protocol: 'tcp' }]
  }
}

async function handleDelete(tunnelId: string) {
  if (confirm('Are you sure you want to delete this tunnel?')) {
    await tunnelStore.deleteTunnel(tunnelId)
  }
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
  // Could add a toast notification here
}

async function start2FASetup() {
  loading2FA.value = true
  totpSetupData.value = await authStore.setup2FA()
  loading2FA.value = false
}

async function verify2FA() {
  loading2FA.value = true
  const success = await authStore.verify2FA(verifyCode.value.trim())
  loading2FA.value = false
  
  if (success) {
    show2FASetup.value = false
    totpSetupData.value = null
    verifyCode.value = ''
  }
}

function confirmDisable2FA() {
  disable2FAData.password = ''
  disable2FAData.code = ''
  show2FADisable.value = true
}

async function handleDisable2FA() {
  loading2FA.value = true
  const success = await authStore.disable2FA(disable2FAData.code.trim(), disable2FAData.password)
  loading2FA.value = false

  if (success) {
    show2FADisable.value = false
    // Clear data
    disable2FAData.password = ''
    disable2FAData.code = ''
  }
}
</script>
