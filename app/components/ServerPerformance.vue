<template>
  <div class="h-full flex flex-col gap-12 p-4">
    <!-- Top Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
      <!-- CPU Card -->

      <div class="stat">
        <div class="stat-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="2" x2="9" y2="4" /><line x1="15" y1="2" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="22" /><line x1="15" y1="20" x2="15" y2="22" /><line x1="20" y1="9" x2="22" y2="9" /><line x1="20" y1="14" x2="22" y2="14" /><line x1="2" y1="9" x2="4" y2="9" /><line x1="2" y1="14" x2="4" y2="14" /></svg>
          Total CPU Usage
        </div>
        <div class="stat-value">
          {{ cpuUsage.toFixed(1) }}<span class="unit">%</span>
        </div>
        <div class="stat-trend">
          <span class="delta" :class="cpuUsage > 80 ? 'down' : cpuUsage > 0 ? 'up' : ''">
            {{ cpuUsage > 80 ? 'high load' : cpuUsage > 0 ? 'normal' : 'idle' }}
          </span>
        </div>
      </div>

      <!-- RAM Card -->
      <div class="stat">
        <div class="stat-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 19v-3" /><path d="M10 19v-3" /><path d="M14 19v-3" /><path d="M18 19v-3" /><rect x="2" y="12" width="20" height="4" rx="1" /><path d="M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /></svg>
          Total RAM Usage
        </div>
        <div class="stat-value">
          {{ formatBytes(memoryBytes) }}
        </div>
      </div>

      <!-- Uptime / Status Card -->

      <div class="stat">
        <div class="stat-label">
          <UIcon name="i-lucide-activity" :class="['w-3 h-3']" />
          Server Status
        </div>
        <div class="stat-value">
          <div class="mt-1 flex items-center gap-2">
            <p class="text-gray-900 dark:text-white capitalize">{{ status }}</p>
          </div>
        </div>
      </div>

      <!-- TPS Card -->
      <div class="stat">
        <div class="stat-label">
          <UIcon name="i-lucide-gauge" :class="['w-3 h-3']" />
          TPS
        </div>
        <div class="stat-value">
          <div class="mt-1 flex items-center gap-2">
            <p class="text-gray-900 dark:text-white capitalize">{{ tps.toFixed(1) }}</p>
          </div>
        </div>
        <div class="stat-trend">
          <span class="delta" :class="tps > 19.0 ? 'up' : tps > 15.0 ? 'neutral' : 'down'">
            {{ tps > 19.0 ? 'excellent' : tps > 15.0 ? 'good' : 'poor' }}
          </span>
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
