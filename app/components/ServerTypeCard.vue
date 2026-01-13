<template>
  <div
    class="relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 group"
    :class="[
      selected
        ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/10'
        : 'border-gray-200 dark:border-gray-800 hover:border-primary-400 dark:hover:border-primary-700 hover:bg-gray-100 dark:hover:bg-gray-800/50'
    ]"
    @click="$emit('select')"
  >
    <!-- Selection Indicator -->
    <div
      v-if="selected"
      class="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center animate-in zoom-in duration-200"
    >
      <UIcon name="i-lucide-check" class="w-4 h-4" />
    </div>

    <!-- Content -->
    <div class="flex flex-col items-center text-center space-y-4">
      <!-- Icon Container -->
      <div 
        class="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        :class="selected ? 'bg-primary-200 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'"
      >
        <UIcon 
          :name="icon" 
          class="w-8 h-8"
          :class="selected ? 'text-primary-400' : 'text-gray-400'"
        />
      </div>

      <!-- Info -->
      <div>
        <h3 class="font-bold text-gray-900 dark:text-white mb-1">
          {{ name }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed px-2">
          {{ description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  icon: string
  description: string
  selected?: boolean
}>()

defineEmits(['select'])
</script>
