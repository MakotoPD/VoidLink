import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useAuthStore } from './useAuthStore'

const API_BASE = 'https://tunnel.makoto.com.pl/api'

// FRP Config for Rust backend
const FRP_SERVER = 'eu.makoto.com.pl'
const FRP_PORT = 7000

export interface TunnelPort {
	label: string
	local_port: number
	public_port: number
	protocol: 'tcp' | 'udp'
	address: string
}

export interface Tunnel {
	id: string
	name: string
	subdomain: string
	full_address: string
	region: string
	is_active: boolean
	is_connected: boolean // Local FRP client connected
	ports: TunnelPort[]
	created_at: string
}

export interface TunnelListResponse {
	tunnels: Tunnel[]
	count: number
	limit: number
}

export interface CreateTunnelPort {
	label: string
	local_port: number
	protocol: 'tcp' | 'udp'
}

interface FRPConfig {
	server_addr: string
	server_port: number
	token: string
	proxies: Array<{
		name: string
		proxy_type: string
		local_port: number
		remote_port: number
	}>
}

interface FRPStartResult {
	success: boolean
	tunnel_id: string
	message: string
}

export const useTunnelStore = defineStore('tunnels', () => {
	const authStore = useAuthStore()

	// State
	const tunnels = ref<Tunnel[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)
	const isManagerOpen = ref(false)
	const tunnelLimit = ref(3)
	const frpOutput = ref<string[]>([])

	// Event listeners
	let unlisteners: (() => void)[] = []

	// Getters
	const activeTunnels = computed(() => tunnels.value.filter(t => t.is_active))
	const connectedTunnels = computed(() => tunnels.value.filter(t => t.is_connected))
	const canCreateTunnel = computed(() => tunnels.value.length < tunnelLimit.value)

	// Setup FRP event listeners
	async function setupListeners() {
		// Clean up previous
		for (const unlisten of unlisteners) {
			unlisten()
		}
		unlisteners = []

		unlisteners.push(await listen<{ tunnel_id: string; type: string; message: string }>('frp-output', (event) => {
			frpOutput.value.push(`[${event.payload.tunnel_id}] ${event.payload.message}`)
			if (frpOutput.value.length > 100) {
				frpOutput.value = frpOutput.value.slice(-100)
			}
		}))

		unlisteners.push(await listen<{ tunnel_id: string }>('frp-connected', (event) => {
			const tunnel = tunnels.value.find(t => t.id === event.payload.tunnel_id)
			if (tunnel) {
				tunnel.is_connected = true
			}
		}))

		unlisteners.push(await listen<{ tunnel_id: string; code: number | null }>('frp-stopped', (event) => {
			const tunnel = tunnels.value.find(t => t.id === event.payload.tunnel_id)
			if (tunnel) {
				tunnel.is_connected = false
			}
		}))
	}

	// API Actions
	async function fetchTunnels(): Promise<boolean> {
		if (!authStore.isAuthenticated) return false

		loading.value = true
		error.value = null

		try {
			const response = await fetch(`${API_BASE}/tunnels`, {
				headers: authStore.getAuthHeaders()
			})

			if (!response.ok) {
				if (response.status === 401) {
					await authStore.refresh()
					return fetchTunnels()
				}
				const data = await response.json()
				error.value = data.error || 'Failed to fetch tunnels'
				return false
			}

			const data = await response.json() as TunnelListResponse
			// Preserve local connection state
			const connectedIds = tunnels.value.filter(t => t.is_connected).map(t => t.id)
			tunnels.value = (data.tunnels || []).map(t => ({
				...t,
				is_connected: connectedIds.includes(t.id)
			}))
			tunnelLimit.value = data.limit
			return true
		} catch (e) {
			error.value = 'Network error'
			return false
		} finally {
			loading.value = false
		}
	}

	async function createTunnel(name: string, ports: CreateTunnelPort[]): Promise<Tunnel | null> {
		if (!authStore.isAuthenticated) return null

		loading.value = true
		error.value = null

		try {
			const response = await fetch(`${API_BASE}/tunnels`, {
				method: 'POST',
				headers: {
					...authStore.getAuthHeaders(),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, ports })
			})

			if (!response.ok) {
				const data = await response.json()
				error.value = data.error || 'Failed to create tunnel'
				return null
			}

			const tunnel = await response.json() as Tunnel
			tunnel.is_connected = false
			tunnels.value.push(tunnel)
			return tunnel
		} catch (e) {
			error.value = 'Network error'
			return null
		} finally {
			loading.value = false
		}
	}

	async function deleteTunnel(tunnelId: string): Promise<boolean> {
		if (!authStore.isAuthenticated) return false

		// Stop FRP client first if running
		await stopFRPClient(tunnelId)

		loading.value = true
		error.value = null

		try {
			const response = await fetch(`${API_BASE}/tunnels/${tunnelId}`, {
				method: 'DELETE',
				headers: authStore.getAuthHeaders()
			})

			if (!response.ok) {
				const data = await response.json()
				error.value = data.error || 'Failed to delete tunnel'
				return false
			}

			tunnels.value = tunnels.value.filter(t => t.id !== tunnelId)
			return true
		} catch (e) {
			error.value = 'Network error'
			return false
		} finally {
			loading.value = false
		}
	}

	// Combined API + FRP Client operations
	async function startTunnel(tunnelId: string): Promise<boolean> {
		if (!authStore.isAuthenticated) return false

		loading.value = true
		error.value = null

		try {
			// 1. Notify API that tunnel is starting
			const response = await fetch(`${API_BASE}/tunnels/${tunnelId}/start`, {
				method: 'POST',
				headers: authStore.getAuthHeaders()
			})

			if (!response.ok) {
				const data = await response.json()
				error.value = data.error || 'Failed to start tunnel'
				return false
			}

			// Update local state
			const tunnel = tunnels.value.find(t => t.id === tunnelId)
			if (tunnel) {
				tunnel.is_active = true

				// 2. Start local FRP client
				const frpSuccess = await startFRPClient(tunnel)
				if (!frpSuccess) {
					error.value = 'Failed to start local FRP client'
					return false
				}
			}

			return true
		} catch (e) {
			error.value = 'Network error'
			return false
		} finally {
			loading.value = false
		}
	}

	async function stopTunnel(tunnelId: string): Promise<boolean> {
		if (!authStore.isAuthenticated) return false

		loading.value = true
		error.value = null

		try {
			// 1. Stop local FRP client
			await stopFRPClient(tunnelId)

			// 2. Notify API
			const response = await fetch(`${API_BASE}/tunnels/${tunnelId}/stop`, {
				method: 'POST',
				headers: authStore.getAuthHeaders()
			})

			if (!response.ok) {
				const data = await response.json()
				error.value = data.error || 'Failed to stop tunnel'
				return false
			}

			const tunnel = tunnels.value.find(t => t.id === tunnelId)
			if (tunnel) {
				tunnel.is_active = false
				tunnel.is_connected = false
			}

			return true
		} catch (e) {
			error.value = 'Network error'
			return false
		} finally {
			loading.value = false
		}
	}

	// FRP Client operations (via Tauri)
	async function startFRPClient(tunnel: Tunnel): Promise<boolean> {
		if (!authStore.frpToken) {
			// Try to refresh to get the token if missing
			const refreshed = await authStore.refresh()
			if (!refreshed || !authStore.frpToken) {
				error.value = 'Failed to retrieve FRP token'
				return false
			}
		}

		try {
			const config: FRPConfig = {
				server_addr: FRP_SERVER,
				server_port: FRP_PORT,
				token: authStore.frpToken,
				proxies: tunnel.ports.map(p => {
					const isVoice = p.label.toLowerCase().includes('voice')
					return {
						name: `${tunnel.subdomain}-${p.label.toLowerCase().replace(/\s+/g, '-')}-${p.protocol}-${p.public_port}`,
						proxy_type: p.protocol,
						local_port: isVoice ? p.public_port : p.local_port,
						remote_port: p.public_port
					}
				})
			}

			const result = await invoke<FRPStartResult>('frp_start_tunnel', {
				tunnelId: tunnel.id,
				config
			})

			return result.success
		} catch (e) {
			console.error('Failed to start FRP client:', e)
			return false
		}
	}

	async function stopFRPClient(tunnelId: string): Promise<boolean> {
		try {
			return await invoke<boolean>('frp_stop_tunnel', { tunnelId })
		} catch (e) {
			console.error('Failed to stop FRP client:', e)
			return false
		}
	}

	async function getFRPStatus(tunnelId: string): Promise<{ is_running: boolean; pid: number | null } | null> {
		try {
			return await invoke('frp_get_status', { tunnelId })
		} catch {
			return null
		}
	}

	function getTunnelById(id: string): Tunnel | undefined {
		return tunnels.value.find(t => t.id === id)
	}

	function clearError() {
		error.value = null
	}

	function clearOutput() {
		frpOutput.value = []
	}

	return {
		// State
		tunnels,
		loading,
		error,
		tunnelLimit,
		frpOutput,
		isManagerOpen,

		// Getters
		activeTunnels,
		connectedTunnels,
		canCreateTunnel,

		// Actions
		setupListeners,
		fetchTunnels,
		createTunnel,
		deleteTunnel,
		startTunnel,
		stopTunnel,
		startFRPClient,
		stopFRPClient,
		getFRPStatus,
		getTunnelById,
		clearError,
		clearOutput
	}
})
