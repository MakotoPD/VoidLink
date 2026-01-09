import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export const useAutoUpdate = () => {
	const toast = useToast()

	const checkForUpdates = async (silent = false) => {
		try {
			const update = await check()

			if (update) {
				toast.add({
					title: 'Update Available',
					description: `Version ${update.version} is available.`,
					icon: 'i-lucide-download',
					color: 'primary',
					duration: 0,
					actions: [{
						label: 'Update & Restart',
						onClick: async () => {
							let downloaded = 0
							let contentLength = 0

							toast.add({
								title: 'Downloading Update',
								description: 'Please wait...',
								icon: 'i-lucide-loader-2',
								color: 'primary',
								duration: 0,
								// @ts-expect-error - loading prop exists on some versions/custom toasts but standard uses icon
								loading: true
							})

							await update.downloadAndInstall((event) => {
								switch (event.event) {
									case 'Started':
										contentLength = event.data.contentLength || 0
										break
									case 'Progress':
										downloaded += event.data.chunkLength
										break
									case 'Finished':
										break
								}
							})

							await relaunch()
						}
					}, {
						label: 'Later',
						onClick: () => { }
					}]
				})
			} else if (!silent) {
				toast.add({
					title: 'Up to date',
					description: 'You are running the latest version.',
					icon: 'i-lucide-check-circle',
					color: 'success'
				})
			}
		} catch (error) {
			console.error('Failed to check for updates:', error)
			if (!silent) {
				toast.add({
					title: 'Update Check Failed',
					description: String(error),
					icon: 'i-lucide-alert-circle',
					color: 'error'
				})
			}
		}
	}

	return {
		checkForUpdates
	}
}
