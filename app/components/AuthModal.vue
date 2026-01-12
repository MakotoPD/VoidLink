<template>
  <UModal v-model:open="isOpen" class="max-w-md dark">
    <template #header>
      <div class="flex justify-between items-center w-full">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary-500/20 rounded-lg">
            <UIcon :name="headerIcon" class="w-5 h-5 text-primary-400" />
          </div>
          <h3 class="text-lg font-semibold">{{ headerTitle }}</h3>
        </div>
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="isOpen = false" />
      </div>
    </template>

    <template #body>
      <!-- Success Message -->
      <div v-if="successMessage" class="bg-success-500/20 border border-success-500/50 rounded-lg p-4 text-center">
        <UIcon name="i-lucide-check-circle" class="w-8 h-8 text-success-400 mx-auto mb-2" />
        <p class="text-success-400">{{ successMessage }}</p>
        <UButton v-if="mode === 'resetSuccess'" class="mt-4" @click="mode = 'login'">
          Back to Login
        </UButton>
      </div>

      <!-- Forms -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Error Message -->
        <div v-if="authStore.error" class="bg-error-500/20 border border-error-500/50 rounded-lg p-3 text-sm text-error-400">
          {{ authStore.error }}
        </div>

        <!-- Login / Register Form -->
        <template v-if="mode === 'login' || mode === 'register'">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <UInput 
              v-model="email" 
              type="email" 
              placeholder="you@example.com" 
              icon="i-lucide-mail"
              required
              :disabled="authStore.loading"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <UInput 
              v-model="password" 
              type="password" 
              placeholder="••••••••" 
              icon="i-lucide-lock"
              required
              :disabled="authStore.loading"
            />
          </div>

          <!-- Confirm Password (Register only) -->
          <div v-if="mode === 'register'">
            <label class="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
            <UInput 
              v-model="confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              icon="i-lucide-lock"
              required
              :disabled="authStore.loading"
            />
          </div>

          <!-- 2FA Code (Login only, when required) -->
          <div v-if="mode === 'login' && authStore.requires2FA">
            <label class="block text-sm font-medium text-gray-300 mb-2">2FA Code</label>
            <UInput 
              v-model="totpCode" 
              type="text" 
              placeholder="123456" 
              icon="i-lucide-shield"
              maxlength="6"
              required
              :disabled="authStore.loading"
            />
            <p class="text-xs text-gray-500 mt-1">Enter the code from your authenticator app</p>
          </div>

          <!-- Forgot Password Link (Login only) -->
          <div v-if="mode === 'login'" class="text-right">
            <button 
              type="button" 
              class="text-sm text-primary-400 hover:underline"
              @click="mode = 'forgotPassword'"
            >
              Forgot password?
            </button>
          </div>

          <!-- Submit Button -->
          <UButton 
            type="submit" 
            block 
            color="primary" 
            :loading="authStore.loading"
          >
            {{ mode === 'login' ? 'Sign In' : 'Create Account' }}
          </UButton>

          <!-- Toggle -->
          <div class="text-center text-sm text-gray-400">
            {{ mode === 'login' ? "Don't have an account?" : "Already have an account?" }}
            <button 
              type="button" 
              class="text-primary-400 hover:underline ml-1"
              @click="toggleLoginRegister"
            >
              {{ mode === 'login' ? 'Sign Up' : 'Sign In' }}
            </button>
          </div>
        </template>

        <!-- Forgot Password Form -->
        <template v-if="mode === 'forgotPassword'">
          <p class="text-sm text-gray-400 mb-4">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <UInput 
              v-model="email" 
              type="email" 
              placeholder="you@example.com" 
              icon="i-lucide-mail"
              required
              :disabled="authStore.loading"
            />
          </div>

          <UButton 
            type="submit" 
            block 
            color="primary" 
            :loading="authStore.loading"
          >
            Send Reset Link
          </UButton>

          <div class="text-center">
            <button 
              type="button" 
              class="text-sm text-primary-400 hover:underline"
              @click="mode = 'login'"
            >
              Back to Login
            </button>
          </div>
        </template>

        <!-- Reset Password Form -->
        <template v-if="mode === 'resetPassword'">
          <p class="text-sm text-gray-400 mb-4">
            Enter your new password below.
          </p>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
            <UInput 
              v-model="resetToken" 
              type="text" 
              placeholder="Enter code from email" 
              icon="i-lucide-key"
              required
              :disabled="authStore.loading"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">New Password</label>
            <UInput 
              v-model="password" 
              type="password" 
              placeholder="••••••••" 
              icon="i-lucide-lock"
              required
              :disabled="authStore.loading"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
            <UInput 
              v-model="confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              icon="i-lucide-lock"
              required
              :disabled="authStore.loading"
            />
          </div>

          <UButton 
            type="submit" 
            block 
            color="primary" 
            :loading="authStore.loading"
          >
            Reset Password
          </UButton>

          <div class="text-center">
            <button 
              type="button" 
              class="text-sm text-primary-400 hover:underline"
              @click="mode = 'login'"
            >
              Back to Login
            </button>
          </div>
        </template>
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  success: []
}>()

const authStore = useAuthStore()

type AuthMode = 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'resetSuccess'
const mode = ref<AuthMode>('login')

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const totpCode = ref('')
const resetToken = ref('')
const successMessage = ref('')

const headerTitle = computed(() => {
  switch (mode.value) {
    case 'login': return 'Sign In'
    case 'register': return 'Create Account'
    case 'forgotPassword': return 'Forgot Password'
    case 'resetPassword': return 'Reset Password'
    case 'resetSuccess': return 'Success'
    default: return 'Authentication'
  }
})

const headerIcon = computed(() => {
  switch (mode.value) {
    case 'forgotPassword':
    case 'resetPassword': return 'i-lucide-key'
    case 'resetSuccess': return 'i-lucide-check-circle'
    default: return 'i-lucide-user'
  }
})

function toggleLoginRegister() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  resetForm()
}

async function handleSubmit() {
  if (mode.value === 'login') {
    const success = await authStore.login(email.value, password.value, totpCode.value || undefined)
    if (success) {
      isOpen.value = false
      emit('success')
      resetForm()
    }
  } else if (mode.value === 'register') {
    if (password.value !== confirmPassword.value) {
      authStore.error = 'Passwords do not match'
      return
    }
    if (password.value.length < 8) {
      authStore.error = 'Password must be at least 8 characters'
      return
    }
    
    const success = await authStore.register(email.value, password.value)
    if (success) {
      const loginSuccess = await authStore.login(email.value, password.value)
      if (loginSuccess) {
        isOpen.value = false
        emit('success')
        resetForm()
      } else {
        mode.value = 'login'
        password.value = ''
        authStore.error = null
      }
    }
	} else if (mode.value === 'forgotPassword') {
		const success = await authStore.forgotPassword(email.value)
		if (success) {
			mode.value = 'resetPassword'
			// Prompt user to enter code
			successMessage.value = 'We sent a verification code to your email.'
			// Clear message after 5 seconds so user isn't confused on next step
			setTimeout(() => { successMessage.value = '' }, 5000)
		}
	} else if (mode.value === 'resetPassword') {
    if (password.value !== confirmPassword.value) {
      authStore.error = 'Passwords do not match'
      return
    }
    if (password.value.length < 8) {
      authStore.error = 'Password must be at least 8 characters'
      return
    }

    const success = await authStore.resetPassword(resetToken.value, password.value)
    if (success) {
      mode.value = 'resetSuccess'
      successMessage.value = 'Your password has been reset successfully!'
      resetForm()
    }
  }
}

function resetForm() {
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  totpCode.value = ''
  resetToken.value = ''
  authStore.error = null
}

// Reset or setup when modal checks visibility
watch(isOpen, (open) => {
  if (open) {
     if (authStore.pendingResetCode) {
        mode.value = 'resetPassword'
        resetToken.value = authStore.pendingResetCode
        // Optional: clear pending code to avoid re-triggering? 
        // We keep it until success or explicit cancel
     } else {
        mode.value = 'login'
     }
  } else {
    // Only reset if we are fully closing
    setTimeout(() => {
        if (!isOpen.value) {
            mode.value = 'login'
            successMessage.value = ''
            resetForm()
            authStore.pendingResetCode = null
        }
    }, 300)
  }
})
</script>
