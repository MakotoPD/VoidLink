<template>
  <div class="h-screen bg-[#0b1116] text-gray-200 font-sans flex flex-col overflow-hidden relative">
    <!-- Custom Title Bar Area for Dragging - Fixed Header -->
    <div class="h-8 z-40 backdrop-blur-sm shrink-0 w-full" data-tauri-drag-region>
      <WindowControls />
    </div>
    
    <!-- Main Content Area - Scrollable -->
    <div class="flex-1 overflow-y-auto custom-scrollbar relative">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
// Layout does not need logic anymore as sidebar is removed
</script>