export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
      neutral: 'slate'
    },
    modal: {
      slots: {
        overlay: 'fixed inset-0 z-50 backdrop-blur-sm transition-opacity',
        content: 'fixed z-50 w-full focus:outline-none flex flex-col transition-all duration-300',
        header: 'flex items-center gap-3 p-6 min-h-16',
        body: 'flex-1 p-6 overflow-y-auto',
        footer: 'flex items-center gap-3 p-6',
        title: 'text-xl font-bold tracking-tight',
        description: 'mt-1 text-sm',
        close: 'absolute top-5 right-5 p-1 rounded-lg transition-colors'
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
