
export function getFileIcon(filename: string, isDirectory: boolean): string {
	if (isDirectory) return 'i-lucide-folder'

	const ext = filename.split('.').pop()?.toLowerCase() || ''

	switch (ext) {
		case 'jar': return 'i-lucide-box'
		case 'json': return 'i-lucide-file-json'
		case 'properties': return 'i-lucide-settings'
		case 'log': return 'i-lucide-file-text'
		case 'txt': return 'i-lucide-file-text'
		case 'yml':
		case 'yaml': return 'i-lucide-file-code'
		case 'png':
		case 'jpg':
		case 'jpeg': return 'i-lucide-image'
		case 'sh':
		case 'bat': return 'i-lucide-terminal'
		case 'dat': return 'i-lucide-database'
		default: return 'i-lucide-file'
	}
}

export function getFileColor(filename: string, isDirectory: boolean): string {
	if (isDirectory) return 'text-yellow-500'

	const ext = filename.split('.').pop()?.toLowerCase() || ''
	switch (ext) {
		case 'jar': return 'text-primary-500'
		case 'json': return 'text-green-500'
		case 'properties': return 'text-gray-500'
		case 'log':
		case 'txt': return 'text-gray-400'
		case 'yml':
		case 'yaml': return 'text-indigo-500'
		case 'sh':
		case 'bat': return 'text-red-400'
		default: return 'text-gray-500'
	}
}
