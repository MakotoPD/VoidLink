import type { Child } from '@tauri-apps/plugin-shell'
import { invoke } from '@tauri-apps/api/core'
import { writeTextFile, readTextFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs'

export interface ProcessInfo {
	memory_bytes: number
	cpu_usage: number
}

export interface ServerProcess {
	status: 'offline' | 'starting' | 'online' | 'stopping'
	process: Child | null
	pid: number | null  // Store PID separately for recovery
	consoleLines: string[]
	memoryBytes: number
	cpuUsage: number
	tps: number
	history: { timestamp: number; cpu: number; memory: number }[]
}

interface PersistedPIDs {
	[serverId: string]: number
}

const PIDS_FILE = 'VoidLink/running-servers.json'

// Global state for server processes using Nuxt's useState
export function useServerProcessStore() {
	const servers = useState<Record<string, ServerProcess>>('serverProcesses', () => ({}))

	function getServer(serverId: string): ServerProcess {
		if (!servers.value[serverId]) {
			servers.value[serverId] = {
				status: 'offline',
				process: null,
				pid: null,
				consoleLines: [],
				memoryBytes: 0,
				cpuUsage: 0,
				tps: 0,
				history: []
			}
		}
		return servers.value[serverId]
	}

	// Save running PIDs to file
	async function persistPIDs() {
		const pids: PersistedPIDs = {}
		for (const [serverId, server] of Object.entries(servers.value)) {
			const pid = server.process?.pid || server.pid
			if (pid && server.status !== 'offline') {
				pids[serverId] = pid
			}
		}
		console.log('Persisting PIDs:', pids)
		try {
			await writeTextFile(PIDS_FILE, JSON.stringify(pids), { baseDir: BaseDirectory.Document })
			console.log('PIDs persisted successfully')
		} catch (e) {
			console.error('Failed to persist PIDs:', e)
		}
	}

	// Recover running servers after reload
	async function recoverRunningServers() {
		try {
			if (!await exists(PIDS_FILE, { baseDir: BaseDirectory.Document })) {
				return
			}

			const content = await readTextFile(PIDS_FILE, { baseDir: BaseDirectory.Document })
			const pids: PersistedPIDs = JSON.parse(content)

			for (const [serverId, pid] of Object.entries(pids)) {
				// Check if process is still running
				const info = await invoke<ProcessInfo | null>('get_process_info', { pid })
				if (info) {
					console.log('Recovered running server:', serverId, 'PID:', pid)
					const server = getServer(serverId)
					server.status = 'online'
					server.pid = pid
					server.memoryBytes = info.memory_bytes
					server.cpuUsage = info.cpu_usage
				}
			}
		} catch (e) {
			console.error('Failed to recover running servers:', e)
		}
	}

	// Clear persisted PIDs file
	async function clearPersistedPIDs() {
		try {
			await writeTextFile(PIDS_FILE, '{}', { baseDir: BaseDirectory.Document })
		} catch (e) {
			// Ignore
		}
	}

	function setStatus(serverId: string, status: ServerProcess['status']) {
		const server = getServer(serverId)
		server.status = status

		if (status === 'offline') {
			server.memoryBytes = 0
			server.cpuUsage = 0
			server.tps = 0
			server.history = []
			server.pid = null
		}

		// Persist PIDs whenever status changes
		persistPIDs()
	}

	function setProcess(serverId: string, process: Child | null) {
		const server = getServer(serverId)
		server.process = process
		server.pid = process?.pid || null
		// Persist whenever process is set
		persistPIDs()
	}

	function setTps(serverId: string, tps: number) {
		getServer(serverId).tps = tps
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

	function getPid(serverId: string): number | null {
		const server = getServer(serverId)
		return server.process?.pid || server.pid
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

	function getTps(serverId: string): number {
		return getServer(serverId).tps
	}

	async function refreshProcessInfo(serverId: string) {
		const server = getServer(serverId)
		const pid = server.process?.pid || server.pid

		if (!pid) {
			server.memoryBytes = 0
			server.cpuUsage = 0
			return
		}

		try {
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
			} else {
				// Process no longer running
				if (server.status === 'online') {
					server.status = 'offline'
					server.pid = null
					persistPIDs()
				}
			}
		} catch (e) {
			console.error('Failed to get process info:', e)
		}
	}

	// Kill all running servers - call on app exit
	async function killAllServers() {
		for (const [serverId, server] of Object.entries(servers.value)) {
			const pid = server.process?.pid || server.pid
			if (pid && server.status !== 'offline') {
				try {
					console.log('Killing server process:', serverId, 'PID:', pid)
					// Use Rust command to kill entire process tree (important for Java)
					await invoke('kill_process', { pid })
				} catch (e) {
					console.error('Failed to kill server:', serverId, e)
				}
			}
		}
		// Clear persisted PIDs after killing
		await clearPersistedPIDs()
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
		getPid,
		getConsoleLines,
		getMemoryBytes,
		getCpuUsage,
		getTps,
		setTps,
		refreshProcessInfo,
		killAllServers,
		recoverRunningServers,
		persistPIDs
	}
}
