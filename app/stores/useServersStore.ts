import { defineStore } from 'pinia'
import { readDir, readTextFile, writeTextFile, BaseDirectory, exists } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'

export interface ServerMeta {
	id: string
	name: string
	type: string
	typeName: string
	version: string
	icon: string
	jarFile: string
	createdAt: string
	path: string
	port: number
	order: number
	javaSettings?: {
		memory: number
		path: string
		flags: string
	}
}

export const useServersStore = defineStore('servers', () => {
	const servers = ref<ServerMeta[]>([])
	const loading = ref(false)
	const loaded = ref(false)


	async function updateServerOrder(serverId: string, newOrder: number) {
		try {
			// Find and update the server in memory
			const server = servers.value.find(s => s.id === serverId)
			if (!server) {
				console.error('Server not found:', serverId)
				return
			}

			server.order = newOrder

			// Get folder name from server path (e.g., "VoidLink/servers/lobby-aecd4a16" -> "lobby-aecd4a16")
			const folderName = server.path.split('/').pop()
			if (!folderName) {
				console.error('Could not extract folder name from path:', server.path)
				return
			}

			// Persist to server.json
			const jsonPath = await join('VoidLink/servers', folderName, 'server.json')
			const content = await readTextFile(jsonPath, { baseDir: BaseDirectory.Document })
			const meta = JSON.parse(content)
			meta.order = newOrder
			await writeTextFile(jsonPath, JSON.stringify(meta, null, 2), { baseDir: BaseDirectory.Document })
			console.log('Saved order', newOrder, 'for server', folderName)

			// Re-sort the servers array
			servers.value = [...servers.value].sort((a, b) => a.order - b.order)
		} catch (e) {
			console.error('Failed to update server order', e)
		}
	}

	async function loadServers(force = false) {
		// Skip if already loaded and not forcing refresh
		if (loaded.value && !force) return

		// Prevent concurrent loads (race condition fix)
		if (loading.value) return

		loading.value = true
		// Don't clear servers immediately to avoid UI flicker
		const newServers: ServerMeta[] = []

		try {
			const entries = await readDir('VoidLink/servers', { baseDir: BaseDirectory.Document })

			for (const entry of entries) {
				if (entry.isDirectory) {
					try {
						const jsonPath = await join('VoidLink/servers', entry.name, 'server.json')
						const content = await readTextFile(jsonPath, { baseDir: BaseDirectory.Document })
						const meta = JSON.parse(content) as ServerMeta

						// Try to read port from server.properties
						let port = 25565 // default Minecraft port
						try {
							const propsPath = await join('VoidLink/servers', entry.name, 'server.properties')
							const propsContent = await readTextFile(propsPath, { baseDir: BaseDirectory.Document })
							const portMatch = propsContent.match(/^server-port=(.*)$/m)
							if (portMatch && portMatch[1]) {
								port = parseInt(portMatch[1].trim(), 10) || 25565
							}
						} catch {
							// server.properties doesn't exist yet (first run), use default
						}

						meta.port = port

						// Assign default order if not set (1000 * index)
						if (typeof meta.order !== 'number') {
							// Handle string values from JSON
							meta.order = Number(meta.order) || (newServers.length + 1) * 1000
						}

						newServers.push(meta) // Add to temp array
					} catch (e) {
						console.warn(`Skipping invalid server folder ${entry.name}:`, e)
					}
				}
			}

			// Sort by order field
			newServers.sort((a, b) => a.order - b.order)

			servers.value = newServers // Atomic update
			loaded.value = true
		} catch (e) {
			console.error('Failed to load servers:', e)
		} finally {
			loading.value = false
		}
	}

	function refreshServers() {
		return loadServers(true)
	}

	function getServerById(id: string): ServerMeta | undefined {
		return servers.value.find(s => s.path.endsWith(`/${id}`) || s.id === id)
	}

	// Integration with process store for status
	function getServerStatus(serverId: string): string {
		const processStore = useServerProcessStore()
		return processStore.getStatus(serverId)
	}

	function getStatusColor(status: string): 'success' | 'warning' | 'error' | 'neutral' {
		switch (status) {
			case 'online': return 'success'
			case 'starting': return 'warning'
			case 'stopping': return 'warning'
			default: return 'neutral'
		}
	}

	function getServerMemory(serverId: string): number {
		const processStore = useServerProcessStore()
		return processStore.getMemoryBytes(serverId)
	}

	function getServerCpu(serverId: string): number {
		const processStore = useServerProcessStore()
		return processStore.getCpuUsage(serverId)
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
	}

	return {
		servers,
		loading,
		loaded,
		loadServers,
		refreshServers,
		getServerById,
		getServerStatus,
		getStatusColor,
		getServerMemory,
		getServerCpu,
		formatBytes,
		updateServerOrder
	}
})

