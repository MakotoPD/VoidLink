import JSZip from 'jszip'
import { join } from '@tauri-apps/api/path'
import { writeFile, mkdir } from '@tauri-apps/plugin-fs'
import { fetch } from '@tauri-apps/plugin-http'
import { BaseDirectory } from '@tauri-apps/plugin-fs'

export interface InstalledAddonMeta {
	title: string
	icon?: string
	slug?: string
	versionId: string
	fileName: string
	source: 'modrinth' | 'local'
}

// Helper to chunk arrays
function chunk<T>(arr: T[], size: number): T[][] {
	return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
		arr.slice(i * size, i * size + size)
	)
}

async function resolveModMetadata(files: ModrinthIndex['files']): Promise<Record<string, Omit<InstalledAddonMeta, 'fileName' | 'source'>>> {
	// Parse Modrinth CDN URLs to extract project and version IDs
	// URL format: https://cdn.modrinth.com/data/{projectId}/versions/{versionId}/{filename}
	const modrinthUrlRegex = /cdn\.modrinth\.com\/data\/([a-zA-Z0-9]+)\/versions\/([a-zA-Z0-9]+)\//

	const projectIds = new Set<string>()
	const fileToIds = new Map<string, { projectId: string; versionId: string }>()

	// 1. Extract IDs from download URLs
	for (const file of files) {
		const fileName = file.path.split('/').pop()!
		const url = file.downloads[0]
		if (!url) continue

		const match = url.match(modrinthUrlRegex)
		if (match && match[1] && match[2]) {
			const projectId = match[1]
			const versionId = match[2]
			projectIds.add(projectId)
			fileToIds.set(fileName, { projectId, versionId })
		}
	}

	// 2. Batch fetch project details
	const projectDetails = new Map<string, any>()
	const projectChunks = chunk(Array.from(projectIds), 100)

	for (const pChunk of projectChunks) {
		try {
			const res = await fetch(`https://api.modrinth.com/v2/projects?ids=${JSON.stringify(pChunk)}`)
			if (res.ok) {
				const projects = await res.json()
				projects.forEach((p: any) => projectDetails.set(p.id, p))
			}
		} catch (e) {
			console.error('Failed to fetch project details', e)
		}
	}

	// 3. Construct final metadata
	const finalMeta: Record<string, Omit<InstalledAddonMeta, 'fileName' | 'source'>> = {}

	for (const [fileName, ids] of fileToIds) {
		const project = projectDetails.get(ids.projectId)
		if (project) {
			finalMeta[fileName] = {
				title: project.title,
				icon: project.icon_url,
				slug: project.slug,
				versionId: ids.versionId
			}
		}
	}

	return finalMeta
}

interface ModrinthIndex {
	formatVersion: number
	game: string
	versionId: string
	name: string
	dependencies: {
		minecraft: string
		"fabric-loader"?: string
		"quilt-loader"?: string
		forge?: string
		neoforge?: string
		[key: string]: string | undefined
	}
	files: Array<{
		path: string
		hashes: {
			sha1: string
			sha512: string
		}
		env?: {
			client: string
			server: string
		}
		downloads: string[]
		fileSize: number
	}>
}

export async function readMrpackMetadata(buffer: ArrayBuffer | Uint8Array): Promise<ModrinthIndex> {
	const zip = await JSZip.loadAsync(buffer)
	const indexFile = zip.file('modrinth.index.json')
	if (!indexFile) throw new Error('Invalid modpack: missing modrinth.index.json')
	const indexStr = await indexFile.async('string')
	return JSON.parse(indexStr)
}

export async function readMmcMetadata(buffer: ArrayBuffer | Uint8Array): Promise<any> {
	const zip = await JSZip.loadAsync(buffer)
	// Check for mmc-pack.json
	let packFile = zip.file('mmc-pack.json')
	// Some zips might have it inside a subfolder, but usually exports are root. 
	// If not found, check 1 level deep? For now assume root or direct subfolder if user zipped a folder.
	// Actually, MultiMC exports usually have the instance folder content at root of zip.
	if (!packFile) {
		// Try searching one level deep
		const rootDirs = Object.keys(zip.files).filter(f => f.endsWith('/') && f.split('/').length === 2)
		if (rootDirs.length === 1) {
			packFile = zip.file(rootDirs[0] + 'mmc-pack.json')
		}
	}

	if (!packFile) throw new Error('Invalid modpack: missing mmc-pack.json')
	const content = await packFile.async('string')
	return JSON.parse(content)
}

export async function installModpack(
	mrpackUrl: string,
	serverPath: string, // relative to Document
	onProgress: (status: string, progress?: number) => void
): Promise<{ files: ModrinthIndex['files'], dependencies: ModrinthIndex['dependencies'], metadata: Record<string, any> }> {
	try {
		onProgress('Downloading modpack file...', 0)

		// 1. Download .mrpack
		const packRes = await fetch(mrpackUrl, {
			method: 'GET',
		})
		if (!packRes.ok) throw new Error(`Failed to download modpack: ${packRes.statusText}`)
		const packBuffer = await packRes.arrayBuffer()

		return await installMrpack(packBuffer, serverPath, onProgress)

	} catch (e) {
		console.error('Modpack installation failed', e)
		throw e
	}
}

export async function installMrpack(
	buffer: ArrayBuffer | Uint8Array,
	serverPath: string,
	onProgress: (status: string, progress?: number) => void
): Promise<{ files: ModrinthIndex['files'], dependencies: ModrinthIndex['dependencies'], metadata: Record<string, any> }> {
	// 2. Parse ZIP
	onProgress('Parsing modpack...')
	const zip = await JSZip.loadAsync(buffer)

	const indexFile = zip.file('modrinth.index.json')
	if (!indexFile) throw new Error('Invalid modpack: missing modrinth.index.json')

	const indexStr = await indexFile.async('string')
	const index: ModrinthIndex = JSON.parse(indexStr)

	// 3. Download files
	const serverFiles = index.files.filter(f => f.env?.server !== 'unsupported')
	const totalFiles = serverFiles.length
	let downloadedFiles = 0

	// Resolve metadata in background while downloading? 
	// Or just do it after? Doing it in parallel is better for UX but we need to wait for it anyway.
	// Let's start it now.
	const metadataPromise = resolveModMetadata(serverFiles).catch((e: any) => {
		console.error('Metadata resolution failed', e)
		return {}
	})

	onProgress(`Downloading ${totalFiles} files...`, 0)

	const concurrency = 5
	const queue = [...serverFiles]

	async function worker() {
		while (queue.length > 0) {
			const file = queue.shift()!

			try {
				const fullPath = await join(serverPath, file.path)
				const url = file.downloads[0]
				if (!url) continue

				// Ensure dir exists
				// Simple heuristic to extract dir path
				const lastSlash = file.path.lastIndexOf('/')
				if (lastSlash !== -1) {
					const dir = file.path.substring(0, lastSlash)
					const dirPath = await join(serverPath, dir)
					try {
						await mkdir(dirPath, { baseDir: BaseDirectory.Document, recursive: true })
					} catch { }
				}

				const res = await fetch(url)
				if (res.ok) {
					const buf = await res.arrayBuffer()
					await writeFile(fullPath, new Uint8Array(buf), { baseDir: BaseDirectory.Document })
				}
			} catch (e) {
				console.error(`Failed to download ${file.path}`, e)
			}

			downloadedFiles++
			onProgress(`Downloading files...`, (downloadedFiles / totalFiles) * 100)
		}
	}

	await Promise.all(Array.from({ length: concurrency }, worker))

	// 4. Extract overrides
	onProgress('Extracting overrides...')
	const overridesFolder = zip.folder('overrides')
	if (overridesFolder) {
		const overrideFiles: Array<{ relativePath: string, file: JSZip.JSZipObject }> = []
		overridesFolder.forEach((relativePath, file) => {
			if (!file.dir) overrideFiles.push({ relativePath, file })
		})

		for (const { relativePath, file } of overrideFiles) {
			const content = await file.async('uint8array')
			const destPath = await join(serverPath, relativePath)

			const lastSlash = relativePath.lastIndexOf('/')
			if (lastSlash !== -1) {
				const dir = relativePath.substring(0, lastSlash)
				const dirPath = await join(serverPath, dir)
				try { await mkdir(dirPath, { baseDir: BaseDirectory.Document, recursive: true }) } catch { }
			}

			await writeFile(destPath, content, { baseDir: BaseDirectory.Document })
		}
	}

	// 5. Install Loader
	onProgress('Installing server loader...')
	const deps = index.dependencies
	const mcVer = deps.minecraft

	if (deps["fabric-loader"]) {
		const loaderVer = deps["fabric-loader"]
		const url = `https://meta.fabricmc.net/v2/versions/loader/${mcVer}/${loaderVer}/1.0.1/server/jar`
		const res = await fetch(url)
		const buf = await res.arrayBuffer()
		await writeFile(await join(serverPath, 'server.jar'), new Uint8Array(buf), { baseDir: BaseDirectory.Document })
	} else if (deps["quilt-loader"]) {
		const loaderVer = deps["quilt-loader"]
		const url = `https://meta.quiltmc.org/v3/versions/loader/${mcVer}/${loaderVer}/server/jar`
		const res = await fetch(url)
		const buf = await res.arrayBuffer()
		await writeFile(await join(serverPath, 'server.jar'), new Uint8Array(buf), { baseDir: BaseDirectory.Document })
	} else if (deps["forge"]) {
		const forgeVer = deps["forge"]
		const info = `Forge installation required.\nVersion: ${forgeVer}\nPlease download Forge Installer manually.`
		await writeFile(await join(serverPath, 'FORGE_INSTALL_NEEDED.txt'), new TextEncoder().encode(info), { baseDir: BaseDirectory.Document })
	}

	onProgress('Installation complete!', 100)

	onProgress('Installation complete!', 100)

	// Wait for metadata
	onProgress('Resolving mod details...')
	const metadata = await metadataPromise

	return {
		files: index.files,
		dependencies: index.dependencies,
		metadata
	}
}

export async function installZip(
	buffer: ArrayBuffer | Uint8Array,
	serverPath: string,
	onProgress: (status: string, progress?: number) => void
) {
	try {
		onProgress('Extracting zip file...', 0)
		const zip = await JSZip.loadAsync(buffer)

		const files: Array<{ relativePath: string, file: JSZip.JSZipObject }> = []
		zip.forEach((relativePath, file) => {
			if (!file.dir) files.push({ relativePath, file })
		})

		const total = files.length
		let count = 0

		for (const { relativePath, file } of files) {
			let destRelPath = relativePath

			// Flatten MultiMC/Prism structure
			// If path contains /minecraft/mods/ or /minecraft/config/, strip everything before that
			if (destRelPath.includes('/minecraft/')) {
				const parts = destRelPath.split('/minecraft/')
				if (parts.length > 1) {
					destRelPath = parts[1]! // mods/foo.jar
				}
			} else if (destRelPath.startsWith('minecraft/')) {
				destRelPath = destRelPath.substring('minecraft/'.length)
			}

			// Only extract mods and config if they were inside minecraft/ or at root
			// If extracting a full instance zip, we might want to be selective?
			// User requested: "move mods and config to server"
			// So if checking specific folders:
			const isTarget = destRelPath.startsWith('mods/') || destRelPath.startsWith('config/')

			// Should we extract everything flattened, or just those?
			// If it's a generic zip, maybe just extract everything?
			// "niech je przeniesie do serwera" implies extraction.
			// Let's extract everything but flattened if it was in minecraft/

			const content = await file.async('uint8array')
			const destPath = await join(serverPath, destRelPath)

			const lastSlash = destRelPath.lastIndexOf('/')
			if (lastSlash !== -1) {
				const dir = destRelPath.substring(0, lastSlash)
				const dirPath = await join(serverPath, dir)
				try { await mkdir(dirPath, { baseDir: BaseDirectory.Document, recursive: true }) } catch { }
			}

			await writeFile(destPath, content, { baseDir: BaseDirectory.Document })

			count++
			if (count % 10 === 0) {
				onProgress('Extracting...', (count / total) * 100)
			}
		}

		onProgress('Extraction complete!', 100)
	} catch (e) {
		console.error('Zip installation failed', e)
		throw e
	}
}
