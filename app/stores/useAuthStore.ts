import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = 'https://tunnel.makoto.com.pl/api' // Will be configurable

export interface User {
	id: string
	email: string
	totp_enabled: boolean
	created_at: string
}

export interface AuthResponse {
	access_token: string
	refresh_token: string
	expires_in: number
	user: User
}

export const useAuthStore = defineStore('auth', () => {
	// State
	const accessToken = ref<string | null>(null)
	const refreshToken = ref<string | null>(null)
	const user = ref<User | null>(null)
	const frpToken = ref<string | null>(null)
	const loading = ref(false)
	const error = ref<string | null>(null)
	const pendingResetCode = ref<string | null>(null)

	// Getters
	const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
	const requires2FA = ref(false)

	// Token refresh timer
	let refreshTimer: ReturnType<typeof setTimeout> | null = null

	// Actions
	async function register(email: string, password: string): Promise<boolean> {
		loading.value = true
		error.value = null

		try {
			const response = await fetch(`${API_BASE}/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			})

			const data = await response.json()

			if (!response.ok) {
				error.value = data.error || 'Registration failed'
				return false
			}

			return true
		} catch (e) {
			error.value = 'Network error'
			return false
		} finally {
			loading.value = false
		}
	}

	async function login(email: string, password: string, totpCode?: string): Promise<boolean> {
		loading.value = true
		error.value = null
		requires2FA.value = false

		try {
			const response = await fetch(`${API_BASE}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					password,
					totp_code: totpCode || undefined
				})
			})

			const data = await response.json()

			if (!response.ok) {
				if (data.requires_2fa) {
					requires2FA.value = true
					error.value = '2FA code required'
					return false
				}
				error.value = data.error || 'Login failed'
				return false
			}

			// Store tokens and user
			const authData = data as any // Use any to access new fields
			accessToken.value = authData.access_token
			refreshToken.value = authData.refresh_token
			user.value = authData.user
			if (authData.frp_token) {
				frpToken.value = authData.frp_token
			}

			// Persist
			if (process.client) {
				localStorage.setItem('refresh_token', authData.refresh_token)
			}

			// Setup auto-refresh
			scheduleRefresh(authData.expires_in)

			return true
		} catch (e) {
			error.value = 'Network error'
			return false
		} finally {
			loading.value = false
		}
	}

	async function refresh(): Promise<boolean> {
		if (!refreshToken.value) return false

		try {
			const response = await fetch(`${API_BASE}/auth/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh_token: refreshToken.value })
			})

			if (!response.ok) {
				logout()
				return false
			}

			const data = await response.json() as any
			accessToken.value = data.access_token
			refreshToken.value = data.refresh_token
			user.value = data.user
			if (data.frp_token) {
				frpToken.value = data.frp_token
			}

			if (process.client && data.refresh_token) {
				localStorage.setItem('refresh_token', data.refresh_token)
			}

			scheduleRefresh(data.expires_in)
			return true
		} catch {
			logout()
			return false
		}
	}

	function scheduleRefresh(expiresInSeconds: number) {
		if (refreshTimer) clearTimeout(refreshTimer)

		// Refresh 5 minutes before expiry
		const refreshIn = (expiresInSeconds - 300) * 1000
		if (refreshIn > 0) {
			refreshTimer = setTimeout(() => refresh(), refreshIn)
		}
	}

	function logout() {
		if (refreshTimer) clearTimeout(refreshTimer)

		// Call logout endpoint (fire and forget)
		if (refreshToken.value) {
			fetch(`${API_BASE}/auth/logout`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh_token: refreshToken.value })
			}).catch(() => { })
		}

		accessToken.value = null
		refreshToken.value = null
		user.value = null
		frpToken.value = null
		requires2FA.value = false

		if (process.client) {
			localStorage.removeItem('refresh_token')
		}
	}

	async function init() {
		if (!process.client) return

		const storedToken = localStorage.getItem('refresh_token')
		if (storedToken) {
			refreshToken.value = storedToken
			loading.value = true
			await refresh()
			loading.value = false
		}
	}

	async function fetchMe(): Promise<boolean> {
		if (!accessToken.value) return false

		try {
			const response = await fetch(`${API_BASE}/auth/me`, {
				headers: { 'Authorization': `Bearer ${accessToken.value}` }
			})

			if (!response.ok) return false

			user.value = await response.json()
			return true
		} catch {
			return false
		}
	}

	// 2FA Methods
	async function setup2FA(): Promise<{ secret: string; qr_code: string; url: string } | null> {
		if (!accessToken.value) return null

		try {
			const response = await fetch(`${API_BASE}/auth/2fa/setup`, {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${accessToken.value}` }
			})

			if (!response.ok) {
				const data = await response.json()
				error.value = data.error
				return null
			}

			return await response.json()
		} catch {
			error.value = 'Failed to setup 2FA'
			return null
		}
	}

	async function verify2FA(code: string): Promise<boolean> {
		if (!accessToken.value) return false

		try {
			const response = await fetch(`${API_BASE}/auth/2fa/verify`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken.value}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code })
			})

			if (!response.ok) {
				const data = await response.json()
				error.value = data.error
				return false
			}

			// Update user state
			if (user.value) {
				user.value.totp_enabled = true
			}
			return true
		} catch {
			error.value = 'Failed to verify 2FA'
			return false
		}
	}

	async function disable2FA(code: string, password: string): Promise<boolean> {
		if (!accessToken.value) return false

		try {
			const response = await fetch(`${API_BASE}/auth/2fa/disable`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken.value}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code, password })
			})

			if (!response.ok) {
				const data = await response.json()
				error.value = data.error
				return false
			}

			if (user.value) {
				user.value.totp_enabled = false
			}
			return true
		} catch {
			error.value = 'Failed to disable 2FA'
			return false
		}
	}

	// Auth header helper for other stores
	function getAuthHeaders(): Record<string, string> {
		if (!accessToken.value) return {}
		return { 'Authorization': `Bearer ${accessToken.value}` }
	}

	// Password Reset Methods
	async function forgotPassword(email: string): Promise<boolean> {
		loading.value = true
		error.value = null

		try {
			const response = await fetch(`${API_BASE}/auth/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			})

			const data = await response.json()

			if (!response.ok) {
				error.value = data.error || 'Failed to send reset email'
				return false
			}

			return true
		} catch (e) {
			error.value = 'Network error'
			return false
		} finally {
			loading.value = false
		}
	}

	async function resetPassword(token: string, newPassword: string): Promise<boolean> {
		loading.value = true
		error.value = null

		try {
			const response = await fetch(`${API_BASE}/auth/reset-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, new_password: newPassword })
			})

			const data = await response.json()

			if (!response.ok) {
				error.value = data.error || 'Failed to reset password'
				return false
			}

			return true
		} catch (e) {
			error.value = 'Network error'
			return false
		} finally {
			loading.value = false
		}
	}

	return {
		// State
		accessToken,
		refreshToken,
		user,
		frpToken,
		loading,
		error,
		requires2FA,
		pendingResetCode,

		// Getters
		isAuthenticated,

		// Actions
		register,
		login,
		logout,
		refresh,
		fetchMe,
		setup2FA,
		verify2FA,
		disable2FA,
		getAuthHeaders,
		forgotPassword,
		resetPassword,
		init
	}
})
