<template>
  <div class="h-full flex flex-col gap-6 p-4">
    <!-- Top Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- CPU Card -->
      <div class="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
        <div class="absolute right-0 top-0 w-full h-full rounded-lg bg-radial-[at_75%_25%] from-red-500/5 dark:from-red-500/10 to-transparent to-75%"></div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">CPU Usage</p>
          <p class="text-2xl font-bold text-red-500 mt-1">{{ cpuUsage.toFixed(1) }}%</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
          <UIcon name="i-lucide-cpu" class="w-6 h-6 text-red-500" />
        </div>
      </div>

      <!-- RAM Card -->
      <div class="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
        <div class="absolute right-0 top-0 w-full h-full rounded-lg bg-radial-[at_75%_25%] from-yellow-500/5 dark:from-yellow-500/10 to-transparent to-75%"></div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">RAM Usage</p>
          <div class="mt-1">
            <p class="text-2xl font-bold text-yellow-500">{{ formatBytes(memoryBytes) }}</p>
          </div>
        </div>
        <div class="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
          <UIcon name="i-lucide-memory-stick" class="w-6 h-6 text-yellow-500" />
        </div>
      </div>

      <!-- Uptime / Status Card -->
      <div class="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
        <div :class="['absolute right-0 top-0 w-full h-full rounded-lg bg-radial-[at_75%_25%] to-75% ',statusColorClassGradient]" class=""></div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Server Status</p>
          <div class="mt-1 flex items-center gap-2">
            <div :class="['w-2 h-2 rounded-full', statusColorClass]"></div>
            <p class="text-xl font-bold text-gray-900 dark:text-white capitalize">{{ status }}</p>
          </div>
           <p v-if="status === 'online'" class="text-xs text-green-500 mt-1 font-mono">Online</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
           <UIcon name="i-lucide-activity" :class="['w-6 h-6', statusIconClass]" />
        </div>
      </div>

      <!-- TPS Card -->
      <div class="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
        <div :class="['absolute right-0 top-0 w-full h-full rounded-lg bg-radial-[at_75%_25%] to-transparent to-75% ' ,tpsColorClassGradient]"></div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">TPS</p>
          <p :class="['text-2xl font-bold mt-1', tpsColorClass]">{{ tps.toFixed(1) }}</p>
        </div>
        <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', tpsBgClass]">
          <UIcon name="i-lucide-gauge" :class="['w-6 h-6', tpsColorClass]" />
        </div>
      </div>
    </div>

    <!-- Graph Section -->
    <div class="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col min-h-[400px]">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-lg text-gray-900 dark:text-white">Performance Graph</h3>
        <div class="flex gap-2">
           <!-- Potential time range selector here -->
           <UBadge color="neutral" variant="soft">Real-time</UBadge>
        </div>
      </div>
      
      <div class="relative flex-1 w-full h-full min-h-0">
         <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useServerProcessStore } from '~/composables/useServerProcessStore'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  serverId: string
  serverData: any // Server definition
}>()

const store = useServerProcessStore()
const serverProcess = computed(() => store.getServer(props.serverId))

const cpuUsage = computed(() => serverProcess.value.cpuUsage || 0)
const memoryBytes = computed(() => serverProcess.value.memoryBytes || 0)
const status = computed(() => serverProcess.value.status)
const tps = computed(() => serverProcess.value.tps || 20)
const history = computed(() => serverProcess.value.history || [])

// RAM Calculation for % bar
const ramParams = computed(() => {
   const limitGB = props.serverData?.javaSettings?.memory || 4
   const limitBytes = limitGB * 1024 * 1024 * 1024
   const percent = (memoryBytes.value / limitBytes) * 100
   return { percent: Math.min(percent, 100) }
})

const statusColorClass = computed(() => {
   switch (status.value) {
     case 'online': return 'bg-green-500'
     case 'starting': return 'bg-yellow-500'
     case 'stopping': return 'bg-red-500'
     default: return 'bg-gray-500'
   }
})

const statusColorClassGradient = computed(() => {
   switch (status.value) {
     case 'online': return 'from-green-500/10'
     case 'starting': return 'from-yellow-500/10'
     case 'stopping': return 'from-red-500/10'
     default: return 'from-gray-500/10'
   }
})

const statusIconClass = computed(() => {
   switch (status.value) {
     case 'online': return 'text-green-500 animate-pulse'
     default: return 'text-gray-500'
   }
})

const tpsColorClass = computed(() => {
   const val = tps.value
   if (val >= 19.0) return 'text-green-500'
   if (val >= 15.0) return 'text-yellow-500'
   return 'text-red-500'
})

const tpsColorClassGradient = computed(() => {
   const val = tps.value
   if (val >= 19.0) return 'from-green-500/10'
   if (val >= 15.0) return 'from-yellow-500/10'
   return 'from-red-500/10'
})

const tpsBgClass = computed(() => {
   const val = tps.value
   if (val >= 19.0) return 'bg-green-500/10'
   if (val >= 15.0) return 'bg-yellow-500/10'
   return 'bg-red-500/10'
})


function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Chart Config
const chartData = computed(() => {
  const dataPoints = history.value
  // Limit to reasonable number if not handled in store, store handles 60.
  
  const labels = dataPoints.map(p => {
     const date = new Date(p.timestamp)
     return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  })

  return {
    labels,
    datasets: [
      {
        label: 'CPU Usage (%)',
        borderColor: '#ef4444', // Red 500
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red 500 transparent
        data: dataPoints.map(p => p.cpu),
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'RAM Usage (MB)',
        borderColor: '#eab308', // Yellow 500
        backgroundColor: 'rgba(234, 179, 8, 0.1)', // Yellow 500 transparent
        data: dataPoints.map(p => parseFloat((p.memory / 1024 / 1024).toFixed(1))), // MB
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  }
})

const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
         labels: {
            color: '#9ca3af' // gray-400
         }
      },
      tooltip: {
         backgroundColor: 'rgba(17, 24, 39, 0.9)',
         titleColor: '#f3f4f6',
         bodyColor: '#d1d5db',
         borderColor: '#374151',
         borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#10b981', // green-500 (Timestamp Green request)
          maxTicksLimit: 8
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 0,
        // Suggested max for CPU? 100?
        title: { display: true, text: 'CPU %', color: '#ef4444' },
        ticks: { color: '#ef4444' },
        grid: {
           color: 'rgba(239, 68, 68, 0.1)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 0,
        grid: {
          drawOnChartArea: false,
        },
        title: { display: true, text: 'RAM (MB)', color: '#eab308' },
        ticks: { color: '#eab308' }
      },
    }
  }
})
</script>
