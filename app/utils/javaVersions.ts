/**
 * Java Version Manager
 * Maps Minecraft versions to required Java versions and provides path selection
 */

export type JavaVersionKey = 'java8' | 'java11' | 'java17' | 'java21'

export interface JavaInstallations {
	java8?: string
	java11?: string
	java17?: string
	java21?: string
}

/**
 * Maps MC version ranges to required Java version
 */
export function getRequiredJavaVersion(mcVersion: string): JavaVersionKey {
	if (!mcVersion) return 'java17' // Default to Java 17

	// Parse version number (e.g., "1.20.4" -> 20.4)
	const versionMatch = mcVersion.match(/^1\.(\d+)(?:\.(\d+))?/)
	if (!versionMatch) return 'java17'

	const major = parseInt(versionMatch[1])
	const minor = parseInt(versionMatch[2] || '0')

	// MC 1.12.x and older -> Java 8
	if (major <= 12) return 'java8'

	// MC 1.13 - 1.16.x -> Java 11 (Java 8 also works but 11 recommended)
	if (major <= 16) return 'java11'

	// MC 1.17.x -> Java 16/17
	if (major === 17) return 'java17'

	// MC 1.18 - 1.20.4 -> Java 17
	if (major < 20 || (major === 20 && minor <= 4)) return 'java17'

	// MC 1.20.5+ -> Java 21
	return 'java21'
}

/**
 * Get display name for Java version
 */
export function getJavaVersionLabel(version: JavaVersionKey): string {
	const labels: Record<JavaVersionKey, string> = {
		java8: 'Java 8',
		java11: 'Java 11',
		java17: 'Java 17',
		java21: 'Java 21'
	}
	return labels[version]
}

/**
 * Get Java path for a specific MC version, with fallback to default
 */
export function getJavaPathForVersion(
	installations: JavaInstallations,
	mcVersion: string,
	fallback: string = 'java'
): string {
	const required = getRequiredJavaVersion(mcVersion)

	// Try exact match first
	if (installations[required]) {
		return installations[required]!
	}

	// Fallback: try higher versions (compatible)
	const fallbackOrder: Record<JavaVersionKey, JavaVersionKey[]> = {
		java8: ['java8', 'java11', 'java17', 'java21'],
		java11: ['java11', 'java17', 'java21'],
		java17: ['java17', 'java21'],
		java21: ['java21', 'java17'] // Java 21 required, 17 won't work but try anyway
	}

	for (const version of fallbackOrder[required]) {
		if (installations[version]) {
			return installations[version]!
		}
	}

	return fallback
}

/**
 * Check if a specific Java version is configured
 */
export function isJavaVersionConfigured(
	installations: JavaInstallations,
	version: JavaVersionKey
): boolean {
	return !!installations[version]
}

/**
 * Get MC version range description for a Java version
 */
export function getMcVersionRange(version: JavaVersionKey): string {
	const ranges: Record<JavaVersionKey, string> = {
		java8: '1.12.x and older',
		java11: '1.13 - 1.16.x',
		java17: '1.17 - 1.20.4',
		java21: '1.20.5+'
	}
	return ranges[version]
}
