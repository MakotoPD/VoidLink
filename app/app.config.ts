export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
      neutral: 'gray'
    },
    modal: {
      slots: {
        overlay: 'fixed inset-0 z-50 bg-gray-900/50 dark:bg-gray-950/75 backdrop-blur-sm transition-opacity',
        content: 'fixed z-50 w-full bg-white dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-2xl focus:outline-none flex flex-col transition-all duration-300',
        header: 'flex items-center gap-3 p-6 min-h-16 border-b border-gray-200 dark:border-gray-800/50',
        body: 'flex-1 p-6 overflow-y-auto custom-scrollbar',
        footer: 'flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-gray-900/50',
        title: 'text-gray-900 dark:text-white text-xl font-bold tracking-tight',
        description: 'mt-1 text-gray-600 dark:text-gray-400 text-sm',
        close: 'absolute top-5 right-5 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/10'
      },
      variants: {
        transition: {
          true: {
            overlay: 'data-[state=open]:animate-[fade-in_200ms_ease-out] data-[state=closed]:animate-[fade-out_200ms_ease-in]',
            content: 'data-[state=open]:animate-[scale-in_200ms_ease-out] data-[state=closed]:animate-[scale-out_200ms_ease-in]'
          }
        },
        fullscreen: {
          true: {
            content: 'inset-0'
          },
          false: {
            content: 'w-[calc(100vw-2rem)] max-w-lg rounded-2xl top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]'
          }
        }
      }
    }
  }
})
