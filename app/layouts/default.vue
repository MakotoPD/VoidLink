<template>
  <div class="min-h-screen bg-[#0b1116] text-gray-200 font-sans relative">
    <!-- Custom Title Bar Area for Dragging -->
    <div class="fixed top-0 left-0 right-0 h-8 z-40 backdrop-blur-sm" data-tauri-drag-region></div>
    
    <WindowControls />
    <slot />
  </div>
</template>

<script lang="ts" setup>
// Layout does not need logic anymore as sidebar is removed
</script>