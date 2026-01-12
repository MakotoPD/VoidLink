import { invoke } from '@tauri-apps/api/core'

export interface JavaInstallation {
	path: string
	version?: string
	major?: number
	vendor?: string
	arch?: string
	is_valid: boolean
}

export interface JavaValidation {
	is_valid: boolean
	version?: string
	major?: number
	vendor?: string
	arch?: string
	error?: string
}

export interface AdoptiumRelease {
	version: string
	major: number
	download_url: string
	filename: string
	size: number
	checksum: string | null
}

export const useJava = () => {
	// Global state shared across all components
	const installations = useState<JavaInstallation[]>('java-installations', () => [])
	const loading = useState('java-loading', () => false)
	const error = useState<string | null>('java-error', () => null)

	const scanJava = async () => {
		loading.value = true
		error.value = null
		try {
			installations.value = await invoke<JavaInstallation[]>('detect_java_installations_cmd')
		} catch (e) {
			console.error('Failed to scan for Java:', e)
			error.value = String(e)
		} finally {
			loading.value = false
		}
	}

	const validateJavaPath = async (path: string): Promise<JavaValidation> => {
		try {
			return await invoke<JavaValidation>('validate_java_path_cmd', { path })
		} catch (e) {
			console.error('Failed to validate Java path:', e)
			return {
				is_valid: false,
				error: String(e)
			}
		}
	}

	const fetchAdoptiumRelease = async (major: number): Promise<AdoptiumRelease | null> => {
		try {
			return await invoke<AdoptiumRelease>('fetch_adoptium_release_cmd', { major })
		} catch (e) {
			console.error(`Failed to fetch Adoptium release for Java ${major}:`, e)
			return null
		}
	}

	const downloadJava = async (major: number, installDir: string): Promise<string> => {
		return await invoke<string>('download_java_cmd', { major, installDir })
	}

	/**
	 * Returns the best matching Java installation for a given major version.
	 * Minecraft has STRICT maximum Java version requirements:
	 * - MC < 1.17: Java 8 ONLY
	 * - MC 1.17-1.20.4: Java 17 ONLY (Java 21 breaks compatibility)
	 * - MC >= 1.20.5: Java 21+ (can use higher)
	 * 
	 * @param entries - Array of available Java installations
	 * @param requiredMajor - Minimum required Java major version
	 * @param maxMajor - Maximum allowed Java major version (optional, defaults to requiredMajor for strict matching)
	 */
	const getJavaForVersion = (
		entries: JavaInstallation[],
		requiredMajor: number,
		maxMajor?: number
	): JavaInstallation | undefined => {
		// If no max specified, use strict matching (max = required)
		const maxAllowed = maxMajor ?? requiredMajor

		// 1. Try to find exact major match first (preferred)
		const exact = entries.find(j => j.major === requiredMajor && j.is_valid)
		if (exact) return exact

		// 2. Look for valid Java within the allowed range [requiredMajor, maxAllowed]
		const compatible = entries
			.filter(j => {
				const major = j.major || 0
				return j.is_valid && major >= requiredMajor && major <= maxAllowed
			})
			.sort((a, b) => (a.major || 0) - (b.major || 0)) // Prefer closest to required

		return compatible[0]
	}

	return {
		installations,
		loading,
		error,
		scanJava,
		validateJavaPath,
		fetchAdoptiumRelease,
		downloadJava,
		getJavaForVersion
	}
}
