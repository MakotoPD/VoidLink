import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs'

export interface ServerConfig {
	id: string
	name: string
	apiBaseUrl: string
	controlHost: string
	controlPort: number
	isDefault: boolean
}

const DEFAULT_SERVER: ServerConfig = {
	id: 'default',
	name: 'Official (eu.makoto.com.pl)',
	apiBaseUrl: 'https://tunnel.makoto.com.pl/api',
	controlHost: 'eu.makoto.com.pl',
	controlPort: 7001,
	isDefault: true,
}

export const useServerConfigStore = defineStore('serverConfig', () => {
	const serverConfigs = ref<ServerConfig[]>([{ ...DEFAULT_SERVER }])
	const selectedServerId = ref<string>('default')
	const loaded = ref(false)

	const selectedServer = computed<ServerConfig>(() => {
		return serverConfigs.value.find(s => s.id === selectedServerId.value) ?? DEFAULT_SERVER
	})

	async function loadConfigs() {
		if (loaded.value) return
		try {
			const content = await readTextFile('VoidLink/server-configs.json', {
				baseDir: BaseDirectory.Document,
			})
			const data = JSON.parse(content)
			if (Array.isArray(data.configs) && data.configs.length > 0) {
				// Always keep the default server first, then append custom ones
				const custom = data.configs.filter((c: ServerConfig) => !c.isDefault)
				serverConfigs.value = [{ ...DEFAULT_SERVER }, ...custom]
			}
			if (data.selectedId) {
				selectedServerId.value = data.selectedId
			}
		} catch {
			// No file yet — use defaults
		} finally {
			loaded.value = true
		}
	}

	async function saveConfigs() {
		try {
			const data = {
				selectedId: selectedServerId.value,
				configs: serverConfigs.value.filter(c => !c.isDefault), // Don't persist the built-in default
			}
			await writeTextFile('VoidLink/server-configs.json', JSON.stringify(data, null, 2), {
				baseDir: BaseDirectory.Document,
			})
		} catch (e) {
			console.error('Failed to save server configs:', e)
		}
	}

	function addServerConfig(config: Omit<ServerConfig, 'id' | 'isDefault'>) {
		const newConfig: ServerConfig = {
			...config,
			id: crypto.randomUUID(),
			isDefault: false,
		}
		serverConfigs.value.push(newConfig)
		saveConfigs()
		return newConfig
	}

	function removeServerConfig(id: string) {
		if (id === 'default') return // Cannot remove the official server
		serverConfigs.value = serverConfigs.value.filter(c => c.id !== id)
		if (selectedServerId.value === id) {
			selectedServerId.value = 'default'
		}
		saveConfigs()
	}

	function setSelectedServer(id: string) {
		const exists = serverConfigs.value.some(c => c.id === id)
		if (exists) {
			selectedServerId.value = id
			saveConfigs()
		}
	}

	return {
		serverConfigs,
		selectedServerId,
		selectedServer,
		loaded,
		loadConfigs,
		addServerConfig,
		removeServerConfig,
		setSelectedServer,
	}
})
