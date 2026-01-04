import type { Child } from '@tauri-apps/plugin-shell'
import { invoke } from '@tauri-apps/api/core'

export interface ProcessInfo {
	memory_bytes: number
	cpu_usage: number
}

export interface ServerProcess {
	status: 'offline' | 'starting' | 'online' | 'stopping'
	process: Child | null
	consoleLines: string[]
	memoryBytes: number
	cpuUsage: number
	history: { timestamp: number; cpu: number; memory: number }[]
}

// Global state for server processes using Nuxt's useState
export function useServerProcessStore() {
	const servers = useState<Record<string, ServerProcess>>('serverProcesses', () => ({}))

	function getServer(serverId: string): ServerProcess {
		if (!servers.value[serverId]) {
			servers.value[serverId] = {
				status: 'offline',
				process: null,
				consoleLines: [],
				memoryBytes: 0,
				cpuUsage: 0,
				history: []
			}
		}
		return servers.value[serverId]
	}

	function setStatus(serverId: string, status: ServerProcess['status']) {
		getServer(serverId).status = status
	}

	function setProcess(serverId: string, process: Child | null) {
		getServer(serverId).process = process
	}

	function addConsoleLine(serverId: string, line: string) {
		const server = getServer(serverId)
		server.consoleLines.push(line)
		// Limit console history to prevent memory issues
		if (server.consoleLines.length > 1000) {
			server.consoleLines.shift()
		}
	}

	function clearConsole(serverId: string) {
		getServer(serverId).consoleLines = []
	}

	function getStatus(serverId: string): ServerProcess['status'] {
		return getServer(serverId).status
	}

	function getProcess(serverId: string): Child | null {
		return getServer(serverId).process
	}

	function getConsoleLines(serverId: string): string[] {
		return getServer(serverId).consoleLines
	}

	function getMemoryBytes(serverId: string): number {
		return getServer(serverId).memoryBytes
	}

	function getCpuUsage(serverId: string): number {
		return getServer(serverId).cpuUsage
	}

	async function refreshProcessInfo(serverId: string) {
		const server = getServer(serverId)
		if (!server.process) {
			server.memoryBytes = 0
			server.cpuUsage = 0
			return
		}

		try {
			const pid = server.process.pid
			const info = await invoke<ProcessInfo | null>('get_process_info', { pid })
			if (info) {
				server.memoryBytes = info.memory_bytes
				server.cpuUsage = info.cpu_usage

				server.history.push({
					timestamp: Date.now(),
					cpu: info.cpu_usage,
					memory: info.memory_bytes
				})

				// Keep last 60 points (approx 2 minutes at 2s interval)
				if (server.history.length > 60) {
					server.history.shift()
				}
			}
		} catch (e) {
			console.error('Failed to get process info:', e)
		}
	}

	return {
		servers,
		getServer,
		setStatus,
		setProcess,
		addConsoleLine,
		clearConsole,
		getStatus,
		getProcess,
		getConsoleLines,
		getMemoryBytes,
		getCpuUsage,
		refreshProcessInfo
	}
}
