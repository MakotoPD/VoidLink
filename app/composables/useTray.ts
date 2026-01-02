import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

interface TrayServer {
	id: string
	name: string
	status: string
}

let unlisten: UnlistenFn | null = null

export async function initTrayListener() {
	// Listen for tray-open-server event from Rust
	unlisten = await listen<string>('tray-open-server', (event) => {
		const serverId = event.payload
		navigateTo(`/server/${serverId}`)
	})
}

export function cleanupTrayListener() {
	if (unlisten) {
		unlisten()
		unlisten = null
	}
}

export async function updateTrayMenu(servers: { path: string; name: string }[], getStatus: (id: string) => string) {
	const trayServers: TrayServer[] = servers.map(server => {
		const id = server.path.split('/').pop() || ''
		return {
			id,
			name: server.name,
			status: getStatus(id)
		}
	})

	try {
		await invoke('update_tray_servers', { servers: trayServers })
	} catch (e) {
		console.error('Failed to update tray menu:', e)
	}
}
