import { Command } from '@tauri-apps/plugin-shell'

export interface JavaStatus {
	installed: boolean
	version: string
	details: string
}

export async function detectJava(): Promise<JavaStatus> {
	try {
		// Try running 'java -version'. 
		// Note: Java outputs version to STDERR, not STDOUT.
		const cmd = Command.create('run-java', ['-version'])

		// We need to capture output.
		const output = await cmd.execute()

		// Combine stdout and stderr just in case, but usually it's stderr
		const fullOutput = output.stderr + '\n' + output.stdout

		if (output.code === 0) {
			// Parse version. Example: "openjdk version "21.0.2" ..."
			const versionMatch = fullOutput.match(/version "([^"]+)"/)
			const version = versionMatch ? versionMatch[1] : 'Unknown'

			// Also try to capture the runtime name (e.g. "OpenJDK Runtime Environment")
			const runtimeMatch = fullOutput.match(/(OpenJDK|Java\(TM\)) Runtime Environment/)
			const runtime = runtimeMatch ? runtimeMatch[1] : 'Java'

			return {
				installed: true,
				version: version,
				details: fullOutput.split('\n')[0] // First line usually contains the summary
			}
		} else {
			return {
				installed: false,
				version: '',
				details: `Exited with code ${output.code}`
			}
		}
	} catch (e) {
		console.error('Java detection failed', e)
		return {
			installed: false,
			version: '',
			details: String(e)
		}
	}
}
