import { invoke } from '@tauri-apps/api/core'

export interface BackupInfo {
	id: string
	name: string
	created_at: string
	size_bytes: number
	path: string
	backup_type: 'manual' | 'auto' | 'pre-restore'
	included_folders: string[]
}

export interface BackupSettings {
	enabled: boolean
	interval_minutes: number
	max_backups: number
	custom_path: string | null
	included_folders: string[]
}

export interface BackupStats {
	total_backups: number
	total_size_bytes: number
	oldest_backup: string | null
	newest_backup: string | null
}

const autoBackupIntervals = new Map<string, ReturnType<typeof setInterval>>()

export function useBackupStore() {
	const backups = useState<Record<string, BackupInfo[]>>('backups', () => ({}))
	const settings = useState<Record<string, BackupSettings>>('backupSettings', () => ({}))
	const loading = useState<Record<string, boolean>>('backupLoading', () => ({}))

	// Default settings
	const defaultSettings: BackupSettings = {
		enabled: false,
		interval_minutes: 30,
		max_backups: 5,
		custom_path: null,
		included_folders: ['world', 'world_nether', 'world_the_end']
	}

	async function loadBackups(serverId: string, customPath?: string): Promise<BackupInfo[]> {
		loading.value[serverId] = true
		try {
			const list = await invoke<BackupInfo[]>('backup_list_cmd', {
				serverId,
				customPath: customPath || null
			})
			backups.value[serverId] = list.sort((a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
			)
			return backups.value[serverId]
		} catch (e) {
			console.error('Failed to load backups:', e)
			return []
		} finally {
			loading.value[serverId] = false
		}
	}

	async function createBackup(
		serverPath: string,
		serverId: string,
		backupType: 'manual' | 'auto' = 'manual',
		includedFolders?: string[],
		customPath?: string
	): Promise<BackupInfo | null> {
		loading.value[serverId] = true
		try {
			const serverSettings = settings.value[serverId] || defaultSettings
			const folders = includedFolders || serverSettings.included_folders

			const backup = await invoke<BackupInfo>('backup_create_cmd', {
				serverPath,
				serverId,
				backupType,
				includedFolders: folders,
				customPath: customPath || serverSettings.custom_path
			})

			// Refresh list after creation
			await loadBackups(serverId, customPath || serverSettings.custom_path || undefined)

			// Rotate if needed
			await rotateBackups(serverId, serverSettings.max_backups, customPath || serverSettings.custom_path || undefined)

			return backup
		} catch (e) {
			console.error('Failed to create backup:', e)
			throw e
		} finally {
			loading.value[serverId] = false
		}
	}

	async function restoreBackup(
		serverPath: string,
		serverId: string,
		backupId: string,
		includedFolders?: string[],
		customPath?: string
	): Promise<BackupInfo | null> {
		loading.value[serverId] = true
		try {
			const serverSettings = settings.value[serverId] || defaultSettings
			const folders = includedFolders || serverSettings.included_folders

			// Returns the pre-restore backup that was created
			const preRestoreBackup = await invoke<BackupInfo>('backup_restore_cmd', {
				serverPath,
				serverId,
				backupId,
				includedFolders: folders,
				customPath: customPath || serverSettings.custom_path
			})

			// Refresh list
			await loadBackups(serverId, customPath || serverSettings.custom_path || undefined)

			return preRestoreBackup
		} catch (e) {
			console.error('Failed to restore backup:', e)
			throw e
		} finally {
			loading.value[serverId] = false
		}
	}

	async function deleteBackup(
		serverId: string,
		backupId: string,
		customPath?: string
	): Promise<void> {
		loading.value[serverId] = true
		try {
			await invoke('backup_delete_cmd', {
				serverId,
				backupId,
				customPath: customPath || null
			})

			// Remove from local state
			if (backups.value[serverId]) {
				backups.value[serverId] = backups.value[serverId].filter(b => b.id !== backupId)
			}
		} catch (e) {
			console.error('Failed to delete backup:', e)
			throw e
		} finally {
			loading.value[serverId] = false
		}
	}

	async function rotateBackups(
		serverId: string,
		maxBackups: number,
		customPath?: string
	): Promise<number> {
		try {
			const deleted = await invoke<number>('backup_rotate_cmd', {
				serverId,
				maxBackups,
				customPath: customPath || null
			})

			if (deleted > 0) {
				await loadBackups(serverId, customPath)
			}

			return deleted
		} catch (e) {
			console.error('Failed to rotate backups:', e)
			return 0
		}
	}

	async function getBackupStats(
		serverId: string,
		customPath?: string
	): Promise<BackupStats | null> {
		try {
			return await invoke<BackupStats>('backup_stats_cmd', {
				serverId,
				customPath: customPath || null
			})
		} catch (e) {
			console.error('Failed to get backup stats:', e)
			return null
		}
	}

	async function getAvailableFolders(serverPath: string): Promise<string[]> {
		try {
			return await invoke<string[]>('backup_get_folders_cmd', { serverPath })
		} catch (e) {
			console.error('Failed to get available folders:', e)
			return []
		}
	}

	async function loadSettings(serverId: string, customPath?: string): Promise<BackupSettings> {
		try {
			const loaded = await invoke<BackupSettings>('backup_load_settings_cmd', {
				serverId,
				customPath: customPath || null
			})
			settings.value[serverId] = loaded
			return loaded
		} catch (e) {
			console.error('Failed to load backup settings:', e)
			settings.value[serverId] = { ...defaultSettings }
			return settings.value[serverId]
		}
	}

	async function saveSettings(
		serverId: string,
		newSettings: BackupSettings,
		customPath?: string
	): Promise<void> {
		try {
			await invoke('backup_save_settings_cmd', {
				serverId,
				settings: newSettings,
				customPath: customPath || null
			})
			settings.value[serverId] = newSettings

			// Update auto-backup interval if settings changed
			if (newSettings.enabled) {
				startAutoBackup(serverId, '', newSettings)
			} else {
				stopAutoBackup(serverId)
			}
		} catch (e) {
			console.error('Failed to save backup settings:', e)
			throw e
		}
	}

	function startAutoBackup(serverId: string, serverPath: string, serverSettings?: BackupSettings) {
		// Stop existing interval if any
		stopAutoBackup(serverId)

		const s = serverSettings || settings.value[serverId]
		if (!s || !s.enabled) return

		const intervalMs = s.interval_minutes * 60 * 1000

		const interval = setInterval(async () => {
			// Check if server is running before creating backup
			const processStore = useServerProcessStore()
			const status = processStore.getStatus(serverId)

			if (status === 'online') {
				console.log(`Auto-backup triggered for server ${serverId}`)
				try {
					await createBackup(serverPath, serverId, 'auto', s.included_folders, s.custom_path || undefined)
				} catch (e) {
					console.error('Auto-backup failed:', e)
				}
			}
		}, intervalMs)

		autoBackupIntervals.set(serverId, interval)
		console.log(`Auto-backup scheduled for ${serverId} every ${s.interval_minutes} minutes`)
	}

	function stopAutoBackup(serverId: string) {
		const interval = autoBackupIntervals.get(serverId)
		if (interval) {
			clearInterval(interval)
			autoBackupIntervals.delete(serverId)
			console.log(`Auto-backup stopped for ${serverId}`)
		}
	}

	function getBackups(serverId: string): BackupInfo[] {
		return backups.value[serverId] || []
	}

	function getSettings(serverId: string): BackupSettings {
		return settings.value[serverId] || { ...defaultSettings }
	}

	function isLoading(serverId: string): boolean {
		return loading.value[serverId] || false
	}

	function formatBytes(bytes: number, decimals = 1): string {
		if (bytes === 0) return '0 B'
		const k = 1024
		const dm = decimals < 0 ? 0 : decimals
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr)
		return date.toLocaleString()
	}

	return {
		backups,
		settings,
		loading,
		loadBackups,
		createBackup,
		restoreBackup,
		deleteBackup,
		rotateBackups,
		getBackupStats,
		getAvailableFolders,
		loadSettings,
		saveSettings,
		startAutoBackup,
		stopAutoBackup,
		getBackups,
		getSettings,
		isLoading,
		formatBytes,
		formatDate
	}
}
