<template>
  <div class="min-h-screen bg-gray-950 p-8 pb-32">
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Header with Progress -->
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="lg"
            @click="goBack"
          />
          <div class="flex-1">
            <h1 class="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {{ stepTitles[step - 1] }}
            </h1>
            <p class="text-gray-400 text-sm">
              {{ stepDescriptions[step - 1] }}
            </p>
          </div>
        </div>

        <!-- Step Progress Bar -->
        <div class="flex items-center gap-2">
          <template v-for="(title, i) in stepTitles" :key="i">
            <div 
              class="flex items-center gap-2 cursor-pointer"
              @click="i < step - 1 && (step = i + 1)"
            >
              <div 
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                :class="step > i + 1 
                  ? 'bg-success-500 text-white' 
                  : step === i + 1 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-800 text-gray-500'"
              >
                <UIcon v-if="step > i + 1" name="i-lucide-check" class="w-4 h-4" />
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span 
                class="text-sm hidden md:block"
                :class="step === i + 1 ? 'text-primary-500 font-medium' : 'text-gray-400'"
              >
                {{ title }}
              </span>
            </div>
            <div 
              v-if="i < stepTitles.length - 1" 
              class="flex-1 h-0.5 rounded"
              :class="step > i + 1 ? 'bg-success-500' : 'bg-gray-800'"
            />
          </template>
        </div>
      </div>

      <!-- Step 1: Engine Selection -->
      <div v-if="step === 1" class="max-w-5xl mx-auto animate-in fade-in duration-300">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="type in serverTypes" 
            :key="type.id"
            class="relative p-5 rounded-xl border-2 cursor-pointer transition-all group"
            :class="selectedType === type.id 
              ? 'border-primary-500 bg-primary-900/20' 
              : 'border-gray-800 bg-gray-900 hover:border-gray-700'"
            @click="selectType(type.id)"
          >
            <!-- Badge -->
            <div 
              v-if="type.badge" 
              class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
              :class="type.badge === 'recommended' 
                ? 'bg-blue-950 text-blue-400 border border-blue-500/50' 
                : type.badge === 'popular' ? 'bg-amber-950 text-amber-400 border border-amber-500/50' : 'bg-green-950 text-success border border-success'"
            >
              {{ type.badge === 'recommended' ? 'Recommended for Beginners' : type.badge === 'popular' ? 'Most Popular' : 'New' }}
            </div>

            <!-- Icon & Name -->
            <div class="flex flex-col items-center text-center mb-4">
              <div class="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center mb-3">
                <UIcon :name="type.icon" class="w-7 h-7 text-gray-400" />
              </div>
              <h3 class="font-bold text-lg">{{ type.name }}</h3>
            </div>

            <!-- Description -->
            <p class="text-sm text-gray-400 text-center mb-4 leading-relaxed min-h-[60px]">
              {{ type.description }}
            </p>

            <!-- Performance Bar -->
            <div v-if="type.id !== 'custom'" class="mb-4">
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>Performance</span>
                <span 
                  :class="{
                    'text-green-400': type.performance === 'excellent',
                    'text-blue-400': type.performance === 'good',
                    'text-amber-400': type.performance === 'moderate'
                  }"
                >
                  {{ type.performance === 'excellent' ? 'Excellent' : type.performance === 'good' ? 'Good' : 'Moderate' }}
                </span>
              </div>
              <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all"
                  :class="{
                    'bg-green-500 w-full': type.performance === 'excellent',
                    'bg-blue-500 w-1/2': type.performance === 'good',
                    'bg-amber-500 w-1/3': type.performance === 'moderate'
                  }"
                />
              </div>
            </div>

            <!-- Features -->
            <div v-if="type.id !== 'custom'" class="flex justify-between text-xs">
              <div class="flex items-center gap-1" :class="type.supportsPlugins ? 'text-green-400' : 'text-gray-600'">
                <UIcon :name="type.supportsPlugins ? 'i-lucide-check' : 'i-lucide-x'" class="w-3.5 h-3.5" />
                <span>{{ type.supportsPlugins ? 'Plugins' : 'No Plugins' }}</span>
              </div>
              <div class="flex items-center gap-1" :class="type.supportsMods ? 'text-green-400' : 'text-gray-600'">
                <UIcon :name="type.supportsMods ? 'i-lucide-check' : 'i-lucide-x'" class="w-3.5 h-3.5" />
                <span>{{ type.supportsMods ? 'Mods' : 'No Mods' }}</span>
              </div>
            </div>

            <!-- Select Button -->
            <div class="mt-4">
              <button 
                class="w-full py-2 rounded-lg font-medium text-sm transition-colors"
                :class="selectedType === type.id 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'"
              >
                {{ selectedType === type.id ? 'Selected' : `Select ${type.name}` }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Version or Modpack Selection -->
      <div v-else-if="step === 2" class="animate-in fade-in duration-300">
        
        <!-- Modpack Browser -->
        <div v-if="selectedType === 'modpack'" class="max-w-5xl mx-auto space-y-6">
          <div class="text-center space-y-2">
             <h2 class="text-2xl font-bold text-white">Select Modpack</h2>
             <p class="text-gray-400">Browse popular options from Modrinth, or upload your own.</p>
          </div>

          <div class="bg-gray-900 border border-gray-800 p-1.5 rounded-xl flex gap-2 max-w-md mx-auto">
             <div 
                class="flex-1 rounded-lg py-2 text-sm font-medium cursor-pointer transition-colors text-center"
                :class="!customModpackPath ? 'bg-green-950/30 text-green-400 border border-green-500/20' : 'text-gray-500 hover:text-gray-300'"
                @click="customModpackPath = null; selectedModpack = null"
             >
                Browse Modrinth
             </div>
             <div 
                class="flex-1 rounded-lg py-2 text-sm font-medium cursor-pointer transition-colors text-center"
                :class="customModpackPath ? 'bg-primary-950/30 text-primary-400 border border-primary-500/20' : 'text-gray-500 hover:text-gray-300'"
                @click="selectModpackFile"
             >
                Upload Modpack
             </div>
          </div>

          <!-- File Upload State -->
          <div v-if="customModpackPath" class="max-w-xl mx-auto">
             <div class="p-8 border-2 border-dashed border-primary-500/30 bg-primary-900/10 rounded-xl text-center">
                <UIcon name="i-lucide-file-archive" class="w-12 h-12 text-primary-400 mx-auto mb-3" />
                <h3 class="font-bold text-lg text-white mb-1">{{ customModpackName }}</h3>
                <p class="text-xs text-gray-400 break-all mb-4 opacity-75">{{ customModpackPath }}</p>
                <UButton color="neutral" variant="ghost" size="xs" icon="i-lucide-refresh-cw" @click="selectModpackFile">Change File</UButton>
             </div>
          </div>

          <!-- Search & Filter -->
          <div class="flex gap-4" v-if="!customModpackPath">
              <UInput 
                v-model="modpackSearch" 
                icon="i-lucide-search" 
                placeholder="Search modpacks..." 
                class="flex-1" 
                size="lg"
              >
                <template #trailing>
                  <UButton v-if="modpackSearch" color="neutral" variant="link" icon="i-lucide-x" :padded="false" @click="modpackSearch = ''" />
                </template>
              </UInput>
              
              <div class="flex gap-2">
                 <USelectMenu 
                    v-model="modpackVersion" 
                    :items="availableMcVersions" 
                    placeholder="MC Version"
                    searchable
                    searchable-placeholder="Search version"
                 >
                 </USelectMenu>

                 <USelectMenu 
                    v-model="modpackLoader" 
                    :items="availableLoaders" 
                    placeholder="Loader"
                 >
                    <template #option="{ option }">
                       <span class="capitalize">{{ option }}</span>
                    </template>
                 </USelectMenu>

                 <USelectMenu :items="['Relevance', 'Downloads', 'Newest']" v-model="modpackSort" />
              </div>
          </div>

          <p class="text-sm text-gray-500">Found {{ modpackTotal }} modpacks</p>

          <!-- Loading State -->
          <div v-if="modpackLoading" class="flex justify-center py-20">
             <UIcon name="i-lucide-loader-2" class="w-12 h-12 animate-spin text-primary-500" />
          </div>

          <!-- Results Grid -->
          <div v-else-if="!customModpackPath" class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div 
               v-for="pack in modpacksList" 
               :key="pack.project_id"
               @click="openModpackDetails(pack)"
               class="bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-primary-500/50 rounded-xl p-4 cursor-pointer transition-all flex gap-4 group"
               :class="{ 'ring-2 ring-primary-500 bg-primary-900/10': selectedModpack?.id === pack.project_id }"
             >
                <img :src="pack.icon_url || 'https://cdn.modrinth.com/placeholder.svg'" class="w-20 h-20 rounded-xl bg-gray-800 object-cover" />
                
                <div class="flex-1 min-w-0 flex flex-col justify-between">
                   <div>
                      <h3 class="font-bold text-lg text-white truncate group-hover:text-primary-400 transition-colors">{{ pack.title }}</h3>
                      <p class="text-sm text-gray-400 line-clamp-2 leading-relaxed">{{ pack.description }}</p>
                   </div>
                   
                   <div class="flex items-center gap-4 text-xs text-gray-500 mt-3">
                      <span class="flex items-center gap-1">
                         <UIcon name="i-lucide-download" class="w-3.5 h-3.5" />
                         {{ (pack.downloads || 0).toLocaleString() }}
                      </span>
                      <span class="flex items-center gap-1">
                         <UIcon name="i-lucide-users" class="w-3.5 h-3.5" />
                         {{ (pack.followers || 0).toLocaleString() }}
                      </span>
                   </div>
                   
                   <div class="flex gap-1.5 mt-3 flex-wrap">
                      <UBadge color="neutral" variant="soft" size="xs" v-for="ver in (pack.game_versions || []).slice(0, 3)" :key="ver">{{ ver }}</UBadge>
                      <UBadge v-if="(pack.game_versions || []).length > 3" color="neutral" variant="soft" size="xs">+{{ pack.game_versions.length - 3 }}</UBadge>
                   </div>
                   
                   <!-- Loader badges if available -->
                   <div class="absolute top-4 right-4 flex gap-1">
                      <UBadge v-for="loader in (pack.loaders || [])" :key="loader" size="xs" color="neutral" variant="solid" class="capitalize">{{ loader }}</UBadge>
                   </div>
                </div>
             </div>
          </div>

          <!-- Pagination -->
          <div class="flex justify-center gap-1 pt-4 pb-8 items-center" v-if="totalPages > 1">
             <UButton 
                :disabled="modpackPage === 0" 
                @click="goToPage(modpackPage)" 
                color="neutral" 
                variant="ghost" 
                icon="i-lucide-chevron-left"
                size="sm"
             />
             
             <template v-for="(p, i) in visiblePages" :key="i">
                <span v-if="p === '...'" class="text-gray-500 px-2">...</span>
                <UButton 
                   v-else
                   :variant="p === modpackPage + 1 ? 'solid' : 'ghost'"
                   :color="p === modpackPage + 1 ? 'primary' : 'neutral'"
                   size="sm"
                   class="min-w-[32px] justify-center"
                   @click="goToPage(p as number)"
                >
                   {{ p }}
                </UButton>
             </template>

             <UButton 
                :disabled="modpackPage >= totalPages - 1" 
                @click="goToPage(modpackPage + 2)" 
                color="neutral" 
                variant="ghost" 
                icon="i-lucide-chevron-right"
                size="sm"
             />
          </div>
        </div>

        <!-- Classic Version Selection -->
        <div v-else class="max-w-xl mx-auto space-y-6">
          <!-- Selected Engine Summary -->
          <div class="flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div class="p-3 rounded-lg bg-primary-900/30 text-primary-400">
              <UIcon :name="selectedTypeData?.icon || 'i-lucide-box'" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-gray-200">{{ selectedTypeData?.name }}</h3>
              <p class="text-sm text-gray-500">{{ selectedTypeData?.description }}</p>
            </div>
          </div>

          <!-- Custom JAR Picker -->
          <div v-if="selectedType === 'custom'" class="space-y-2">
            <label class="text-sm font-medium text-gray-200">Server JAR File</label>
            <div 
              class="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-900/20 transition-colors"
              @click="selectJarFile"
            >
              <div v-if="!customJarPath" class="space-y-2">
                <UIcon name="i-lucide-upload-cloud" class="w-12 h-12 mx-auto text-gray-400" />
                <p class="font-medium text-gray-300">Click to select .jar file</p>
                <p class="text-xs text-gray-500">Supports Spigot, Paper, Fabric, Forge, etc.</p>
              </div>
              <div v-else class="space-y-2">
                <UIcon name="i-lucide-file-check" class="w-12 h-12 mx-auto text-success-500" />
                <p class="font-medium text-white">{{ customJarName }}</p>
                <p class="text-xs text-gray-400 truncate">{{ customJarPath }}</p>
              </div>
            </div>
          </div>

          <!-- Version Selection -->
          <div v-else class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="text-sm font-medium text-gray-200">Game Version</label>
              <div v-if="canToggleSnapshots" class="flex items-center gap-2">
                <span class="text-xs text-gray-500">{{ toggleLabel }}</span>
                <USwitch v-model="includeSnapshots" size="sm" />
              </div>
            </div>
            
            <USelectMenu
              v-model="selectedVersion"
              :items="availableVersions"
              :loading="isLoadingVersions"
              searchable
              searchable-placeholder="Search version..."
              placeholder="Select a version"
              size="lg"
            >
            </USelectMenu>

            <p class="text-xs text-gray-500 mt-2">
              <UIcon name="i-lucide-info" class="w-3 h-3 inline mr-1" />
              Latest available version fetched from API.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 3: World Settings -->
      <div v-else-if="step === 3" class="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        <!-- World Type Cards -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-gray-200">World Type</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div 
              v-for="wt in worldTypes" 
              :key="wt.value"
              class="relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary-400"
              :class="worldType === wt.value 
                ? 'border-primary-500 bg-primary-900/20' 
                : 'border-gray-800 bg-gray-900'"
              @click="worldType = wt.value"
            >
              <!-- Selection indicator -->
              <div 
                class="absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                :class="worldType === wt.value 
                  ? 'border-primary-500 bg-primary-500' 
                  : 'border-gray-600'"
              >
                <UIcon v-if="worldType === wt.value" name="i-lucide-check" class="w-3 h-3 text-white" />
              </div>
              
              <div class="p-2 w-10 h-10 rounded-lg bg-gray-800 mb-3 flex items-center justify-center">
                <UIcon :name="wt.icon" class="w-5 h-5 text-gray-400" />
              </div>
              <h4 class="font-semibold text-sm mb-1">{{ wt.label }}</h4>
              <p class="text-xs text-gray-500 leading-relaxed">{{ wt.description }}</p>
            </div>
          </div>
        </div>

        <!-- Two Column Layout -->
        <div class="grid md:grid-cols-2 gap-6">
          <!-- World Settings -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-200">World Settings</h3>
            
            <!-- World Seed -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <label class="text-xs text-gray-500">World Seed (Optional)</label>
                <UButton 
                  size="xs" 
                  color="primary" 
                  variant="ghost"
                  icon="i-lucide-shuffle"
                  @click="worldSeed = Math.floor(Math.random() * 9999999999).toString()"
                >
                  Randomize
                </UButton>
              </div>
              <UInput
                v-model="worldSeed"
                placeholder="Leave blank for random seed"
                size="lg"
                class="w-full"
              />
            </div>
          </div>

          <!-- Features -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-200">Features</h3>
            
            <!-- Generate Structures -->
            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div class="flex items-start gap-3">
                <div class="p-2 rounded-lg bg-blue-900/30">
                  <UIcon name="i-lucide-landmark" class="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p class="font-medium text-sm">Generate Structures</p>
                  <p class="text-xs text-gray-500">Include villages, dungeons, and strongholds in the world generation.</p>
                </div>
              </div>
              <USwitch v-model="generateStructures" />
            </div>

            <!-- Hardcore Mode -->
            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div class="flex items-start gap-3">
                <div class="p-2 rounded-lg bg-red-900/30">
                  <UIcon name="i-lucide-skull" class="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p class="font-medium text-sm">Hardcore Mode</p>
                  <p class="text-xs text-gray-500">World is deleted upon death. For experienced players only.</p>
                </div>
              </div>
              <USwitch v-model="hardcoreMode" />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Server Settings -->
      <div v-else-if="step === 4" class="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
        <!-- Java Version Info -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-coffee" class="w-5 h-5 text-amber-500" />
              <span class="font-medium">Java Runtime</span>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">Detected Version</p>
                <p class="font-mono font-medium">{{ detectedJavaVersion || 'Checking...' }}</p>
              </div>
              <UButton 
                icon="i-lucide-refresh-cw" 
                size="sm" 
                color="neutral" 
                variant="ghost"
                :loading="checkingJava"
                @click="detectJavaVersion"
              />
            </div>
            
            <div class="p-3 rounded-lg" :class="javaCompatibility.class">
              <div class="flex items-center gap-2">
                <UIcon :name="javaCompatibility.icon" class="w-5 h-5" />
                <div>
                  <p class="font-medium text-sm">{{ javaCompatibility.title }}</p>
                  <p class="text-xs opacity-80">{{ javaCompatibility.message }}</p>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Server Name & RAM -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-settings" class="w-5 h-5 text-primary-500" />
              <span class="font-medium">Server Settings</span>
            </div>
          </template>

          <div class="space-y-5">
            <!-- Server Name -->
            <div class="space-y-2 flex flex-col">
              <label class="text-sm font-medium text-gray-200">Server Name</label>
              <UInput
                v-model="serverName"
                placeholder="My Awesome Server"
                size="lg"
                icon="i-lucide-type"
              />
            </div>

            <!-- RAM Limit -->
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label class="text-sm font-medium text-gray-200">RAM Allocation</label>
                <span class="text-lg font-bold text-primary-500">{{ ramLimit }} GB</span>
              </div>
              <input 
                type="range" 
                v-model.number="ramLimit" 
                min="1" 
                max="16" 
                step="1"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />

              <div class="flex justify-between mt-8 pt-6 border-t border-gray-800">
                <span>1 GB</span>
                <span class="text-success-500 font-medium">Recommended: 6-8 GB</span>
                <span>16 GB</span>
              </div>
            </div>

            <!-- Path Preview -->
            <div class="space-y-2 flex flex-col">
              <label class="text-sm font-medium text-gray-200">Installation Path</label>
              <UInput
                :model-value="serverPath"
                readonly
                icon="i-lucide-folder"
                color="neutral"
                variant="subtle"
                size="lg"
                class="opacity-75 cursor-not-allowed"
              />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Step 5: Summary -->
      <div v-else-if="step === 5" class="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-clipboard-check" class="w-5 h-5 text-success-500" />
              <span class="font-medium">Server Summary</span>
            </div>
          </template>

          <div class="divide-y divide-gray-800">
            <div v-if="selectedType === 'modpack'" class="py-3 flex justify-between">
              <span class="text-gray-500">Modpack</span>
              <span class="font-medium text-primary-400">{{ selectedModpack?.title }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Engine</span>
              <span class="font-medium">{{ selectedTypeData?.name }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Version</span>
              <span class="font-medium">{{ selectedType === 'custom' ? customJarName : selectedVersion }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">World Type</span>
              <span class="font-medium">{{ worldTypes.find(t => t.value === worldType)?.label }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Seed</span>
              <span class="font-medium font-mono">{{ worldSeed || 'Random' }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Structures</span>
              <span class="font-medium">{{ generateStructures ? 'Enabled' : 'Disabled' }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Hardcore</span>
              <span class="font-medium" :class="hardcoreMode ? 'text-red-500' : ''">{{ hardcoreMode ? 'Enabled' : 'Disabled' }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Server Name</span>
              <span class="font-medium">{{ serverName }}</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">RAM</span>
              <span class="font-medium">{{ ramLimit }} GB</span>
            </div>
            <div class="py-3 flex justify-between">
              <span class="text-gray-500">Java</span>
              <span class="font-medium font-mono">{{ detectedJavaVersion || 'System default' }}</span>
            </div>
          </div>
        </UCard>

        <!-- Status Message -->
        <div v-if="statusMessage" class="text-center">
          <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 text-white text-sm backdrop-blur">
            <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
            {{ statusMessage }}
          </span>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 z-50">
        <div class="max-w-4xl mx-auto flex justify-between items-center">
          <UButton
            v-if="step > 1"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="step--"
          >
            Back
          </UButton>
          <div v-else />

          <UButton
            v-if="step < 5"
            color="primary"
            trailing-icon="i-lucide-arrow-right"
            :disabled="!canContinue"
            @click="step++"
          >
            Continue
          </UButton>

          <UButton
            v-else
            color="success"
            trailing-icon="i-lucide-rocket"
            :loading="isCreating"
            :disabled="!isValid"
            @click="createServer"
          >
            {{ isCreating ? 'Creating...' : 'Launch Server' }}
          </UButton>
        </div>
      </div>
    </div>
    <!-- Creation Overlay -->
    <div v-if="isCreating && selectedType === 'modpack'" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center p-8">
       <UIcon name="i-lucide-package" class="w-16 h-16 text-primary-500 mb-4 animate-bounce" />
       <h2 class="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent mb-2">Installing Modpack...</h2>
       <p class="text-gray-400 mb-8 max-w-md text-center">{{ statusMessage }}</p>
       
       <div class="w-full max-w-sm">
          <UProgress :value="creationProgress" color="primary" indicator class="mb-2" />
          <div class="flex justify-between text-xs text-gray-500">
             <span>{{ Math.round(creationProgress) }}%</span>
             <span>Minetools Installer</span>
          </div>
       </div>
    </div>
      <!-- Modpack Detail Modal -->
      <UModal v-model:open="showModpackModal" fullscreen>

        <template #header>
          <div class="w-full flex items-start gap-5 p-6">
            <div class="w-20 h-20 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden shadow-lg border border-gray-700">
                <img v-if="detailedModpack?.icon_url" :src="detailedModpack.icon_url" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-lucide-package" class="w-10 h-10 text-gray-500" />
                </div>
            </div>
            
            <div class="flex-1">
                <h2 class="text-2xl font-bold flex items-center gap-3">
                  {{ detailedModpack?.title }}
                  <UBadge color="neutral" variant="soft">{{ detailedModpack?.project_type }}</UBadge>
                </h2>
                <p class="text-gray-400 mt-1">{{ detailedModpack?.description }}</p>
                
                <div class="flex items-center gap-6 mt-4 text-sm text-gray-400">
                  <div class="flex items-center gap-1.5" title="Downloads">
                      <UIcon name="i-lucide-download" class="w-4 h-4" />
                      <span>{{ detailedModpack?.downloads?.toLocaleString() }}</span>
                  </div>
                  <div class="flex items-center gap-1.5" title="Followers">
                      <UIcon name="i-lucide-heart" class="w-4 h-4" />
                      <span>{{ detailedModpack?.followers?.toLocaleString() }}</span>
                  </div>
                  <div class="flex items-center gap-1.5" title="Updated">
                      <UIcon name="i-lucide-calendar" class="w-4 h-4" />
                      <span>{{ new Date(detailedModpack?.updated).toLocaleDateString() }}</span>
                  </div>
                </div>
            </div>

            <UButton 
              icon="i-lucide-x" 
              color="neutral" 
              variant="ghost" 
              @click="showModpackModal = false"
            />
          </div>
        </template>

        <template #body>
          <div class="flex flex-col h-full bg-gray-950 text-white">
              <!-- Modal Content (Scrollable) -->
              <div class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    <!-- Left: Description -->
                    <div class="lg:col-span-3">
                      <div v-if="loadingDetails" class="flex justify-center py-20">
                          <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary-500" />
                      </div>
                      <div v-else>
                          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                              <UIcon name="i-lucide-file-text" class="w-5 h-5 text-gray-500" />
                              Description
                          </h3>
                          <div 
                            class="prose prose-invert prose-indigo max-w-none bg-gray-900/30 p-6 rounded-xl border border-gray-800"
                            v-html="modpackDescriptionHtml || 'No description provided.'"
                          ></div>
                      </div>
                    </div>

                    <!-- Right: Sidebar -->
                    <div class="lg:col-span-1 space-y-6">
                      <!-- Version Selector -->
                      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
                          <h3 class="font-bold mb-3 flex items-center gap-2 text-primary-400">
                            <UIcon name="i-lucide-history" class="w-4 h-4" />
                            Select Version
                          </h3>
                          
                          <div class="space-y-4" v-if="modpackVersions.length">
                            <USelectMenu
                                v-model="selectedModpackVersion"
                                :items="modpackVersions"
                                option-attribute="name"
                                searchable
                                searchable-placeholder="Search version..."
                                placeholder="Select a version"
                                class="w-full"
                            >
                                <template #item="{ item }">
                                  <div class="flex flex-col gap-0.5 truncate py-1">
                                      <span class="truncate font-medium">{{ item.name }}</span>
                                      <span class="text-xs text-gray-500 flex items-center gap-2">
                                        <span>{{ item.version_number }}</span>
                                        <span>•</span>
                                        <span>{{ new Date(item.date_published).toLocaleDateString() }}</span>
                                      </span>
                                  </div>
                                </template>
                            </USelectMenu>
                            
                            <div v-if="selectedModpackVersion" class="space-y-2 text-xs text-gray-400 bg-gray-950/50 p-3 rounded border border-gray-800">
                                <div class="flex justify-between">
                                  <span>Minecraft</span>
                                  <span class="text-white">{{ selectedModpackVersion.game_versions.join(', ') }}</span>
                                </div>
                                <div class="flex justify-between">
                                  <span>Loader</span>
                                  <span class="text-white capitalize">{{ selectedModpackVersion.loaders.join(', ') }}</span>
                                </div>
                                <div class="flex justify-between">
                                  <span>Type</span>
                                  <span :class="{
                                      'text-green-400': selectedModpackVersion.version_type === 'release',
                                      'text-yellow-400': selectedModpackVersion.version_type === 'beta',
                                      'text-red-400': selectedModpackVersion.version_type === 'alpha'
                                  }" class="capitalize">{{ selectedModpackVersion.version_type }}</span>
                                </div>
                                <div class="flex justify-between">
                                  <span>Files</span>
                                  <span class="text-white">{{ selectedModpackVersion.files?.length || 0 }}</span>
                                </div>
                            </div>
                          </div>
                          <div v-else class="text-gray-500 text-sm">No versions found</div>
                      </div>
                      
                      <!-- Categories -->
                      <div v-if="detailedModpack?.categories?.length" class="bg-gray-900 border border-gray-800 rounded-xl p-4">
                          <h3 class="font-bold mb-3 flex items-center gap-2 text-primary-400">
                            <UIcon name="i-lucide-tag" class="w-4 h-4" />
                            Categories
                          </h3>
                          <div class="flex flex-wrap gap-2">
                            <UBadge v-for="cat in detailedModpack.categories" :key="cat" color="neutral" variant="soft" class="capitalize">
                                {{ cat }}
                            </UBadge>
                          </div>
                      </div>
                      
                      <!-- License -->
                      <div v-if="detailedModpack?.license" class="bg-gray-900 border border-gray-800 rounded-xl p-4">
                          <h3 class="font-bold mb-3 flex items-center gap-2 text-primary-400">
                            <UIcon name="i-lucide-scale" class="w-4 h-4" />
                            License
                          </h3>
                          <p class="text-sm text-gray-300">{{ detailedModpack.license.name || detailedModpack.license.id }}</p>
                      </div>

                    </div>
                </div>
              </div>

              <!-- Footer Actions -->
              <div class="p-4 border-t border-gray-800 bg-gray-900 flex justify-end gap-3 rounded-b-lg">
                <UButton color="neutral" variant="ghost" size="lg" @click="showModpackModal = false">
                    Cancel
                </UButton>
                <UButton 
                    color="primary" 
                    size="lg" 
                    icon="i-lucide-check" 
                    @click="confirmModpackSelection"
                    :disabled="!selectedModpackVersion"
                >
                    Confirm Selection
                </UButton>
              </div>
          </div>
        </template>
      </UModal>

  </div>
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid' 
import { fetch } from '@tauri-apps/plugin-http'
import { mkdir, writeFile, writeTextFile, readTextFile, copyFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { join, documentDir } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/plugin-dialog'
import { Command } from '@tauri-apps/plugin-shell'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// Configure links to open in new tab
const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const aIndex = tokens[idx].attrIndex('target')

  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank'])
  } else {
    tokens[idx].attrs![aIndex][1] = '_blank'
  }
  
  // Add rel="noopener noreferrer" for security
  const relIndex = tokens[idx].attrIndex('rel')
  if (relIndex < 0) {
    tokens[idx].attrPush(['rel', 'noopener noreferrer']) 
  } else {
    tokens[idx].attrs![relIndex][1] = 'noopener noreferrer'
  }

  return defaultRender(tokens, idx, options, env, self)
}

// Step state
const step = ref(1)

const stepTitles = ['Engine', 'Version', 'World', 'Settings', 'Launch']
const stepDescriptions = [
  'Choose the server software that powers your world',
  'Select the game version to run',
  'Configure your world generation settings',
  'Set up server name, memory, and Java',
  'Review and launch your new server'
]

// Engine state
const selectedType = ref<string | null>(null)
const customJarPath = ref<string | null>(null)
const customJarName = ref<string>('')

// Version state
const selectedVersion = ref<string | undefined>(undefined)
const isLoadingVersions = ref(false)
const availableVersions = ref<string[]>([])
const includeSnapshots = ref(false)

// World state
const worldSeed = ref('')
const worldType = ref('default')
const levelName = ref('world')
const generateStructures = ref(true)
const hardcoreMode = ref(false)

const worldTypes = [
  { label: 'Default', value: 'default', icon: 'i-lucide-mountain', description: 'Standard Minecraft terrain generation suitable for most gameplay.' },
  { label: 'Superflat', value: 'flat', icon: 'i-lucide-minus', description: 'Completely flat terrain, ideal for creative building projects.' },
  { label: 'Large Biomes', value: 'largeBiomes', icon: 'i-lucide-globe', description: 'Standard terrain but with biomes expanded to 16x larger size.' },
  { label: 'Amplified', value: 'amplified', icon: 'i-lucide-trending-up', description: 'Exaggerated terrain height and cliffs (requires strong CPU).' }
]

// Server settings state
const serverName = ref('')
const ramLimit = ref(6)

// Java detection
const detectedJavaVersion = ref<string | null>(null)
const checkingJava = ref(false)

import { installModpack, installMrpack, installZip, readMrpackMetadata, readMmcMetadata } from '~/utils/modpack'

// ... existing imports ...

// Creation state
const isCreating = ref(false)
const statusMessage = ref('')
const creationProgress = ref(0) // New progress state

// Modpack state
const modpackSearch = ref('')
const modpacksList = ref<any[]>([])
const modpackLoading = ref(false)
const selectedModpack = ref<any>(null)
const customModpackPath = ref<string | null>(null)
const customModpackName = ref<string>('')
const customModpackMetadata = ref<any>(null) // New metadata state
const selectedModpackVersionData = ref<any>(null) // New version data state
const modpackPage = ref(0)
const modpackTotal = ref(0)
// Filters
const modpackSort = ref('Relevance')
const modpackVersion = ref<string | undefined>(undefined)
const modpackLoader = ref<string | undefined>(undefined)

// Modpack Details Modal State
const showModpackModal = ref(false)
const detailedModpack = ref<any>(null)
const modpackVersions = ref<any[]>([])
const selectedModpackVersion = ref<any>(null)
const modpackDescriptionHtml = ref('')
const loadingDetails = ref(false)

const availableMcVersions = ref<string[]>([])
const availableLoaders = ['fabric', 'forge', 'neoforge', 'quilt']

async function fetchModrinthVersions() {
  try {
    const res = await fetch('https://api.modrinth.com/v2/tag/game_version')
    const data: Array<{ version: string, version_type: string, date: string }> = await res.json()
    
    availableMcVersions.value = data
      .filter(v => v.version_type === 'release')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(v => v.version)
  } catch (e) {
    console.error('Failed to resolve modrinth versions', e)
    availableMcVersions.value = ['1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.1', '1.19.2', '1.18.2', '1.16.5', '1.12.2']
  }
}

fetchModrinthVersions()

interface ServerType {
  id: string
  name: string
  icon: string
  description: string
  performance: 'excellent' | 'good' | 'moderate'
  supportsPlugins: boolean
  supportsMods: boolean
  badge?: 'recommended' | 'popular' | 'new'
  api: {
    url: string
    type: 'mcjarfiles' | 'papermc'
    snapshotUrl?: string
    previewUrl?: string
  }
}

const serverTypes: ServerType[] = [
  { 
    id: 'vanilla', 
    name: 'Vanilla', 
    icon: 'i-lucide-box', 
    description: 'The unmodified, official Minecraft experience as provided by Mojang.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: false,
    badge: 'recommended',
    api: { 
      url: 'https://mcjarfiles.com/api/get-versions/vanilla/release',
      snapshotUrl: 'https://mcjarfiles.com/api/get-versions/vanilla/snapshot',
      type: 'mcjarfiles'
    }
  },
  { 
    id: 'paper', 
    name: 'Paper', 
    icon: 'i-lucide-scroll', 
    description: 'An optimized fork of Spigot, offering better performance and configuration. Best for plugin servers.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    badge: 'popular',
    api: { url: 'https://mcjarfiles.com/api/get-versions/servers/paper', type: 'mcjarfiles' }
  },
  { 
    id: 'modpack', 
    name: 'Modpack', 
    icon: 'i-lucide-package', 
    description: 'A pre-configured server with a collection of mods for a specific game experience. Browse modrinth or import your own.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: true,
    badge: 'new',
    api: { url: '', type: 'custom' as any }
  },
  { 
    id: 'purpur', 
    name: 'Purpur', 
    icon: 'i-lucide-cat', 
    description: 'Drop-in replacement for Paper with many additional gameplay features and tweaks.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    api: { url: 'https://mcjarfiles.com/api/get-versions/servers/purpur', type: 'mcjarfiles' }
  },
  { 
    id: 'fabric', 
    name: 'Fabric', 
    icon: 'i-lucide-layers', 
    description: 'Lightweight, modern modding toolchain. Fast updates and performance-focused mods.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: true,
    api: { url: 'https://mcjarfiles.com/api/get-versions/modded/fabric', type: 'mcjarfiles' }
  },
  { 
    id: 'forge', 
    name: 'Forge', 
    icon: 'i-lucide-anvil', 
    description: 'The original and most popular mod loader. Largest mod library available.',
    performance: 'moderate',
    supportsPlugins: false,
    supportsMods: true,
    api: { url: 'https://mcjarfiles.com/api/get-versions/modded/forge', type: 'mcjarfiles' }
  },
  { 
    id: 'neoforge', 
    name: 'NeoForge', 
    icon: 'i-lucide-zap', 
    description: 'Community-driven fork of Forge with improved performance and modern features.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: true,
    api: { url: 'https://mcjarfiles.com/api/get-versions/modded/neoforge', type: 'mcjarfiles' }
  },
  { 
    id: 'velocity', 
    name: 'Velocity', 
    icon: 'i-lucide-network', 
    description: 'A modern, high-performance proxy for connecting multiple servers together.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    api: { url: 'https://mcjarfiles.com/api/get-versions/proxies/velocity', type: 'mcjarfiles' }
  },
  { 
    id: 'custom', 
    name: 'Custom JAR', 
    icon: 'i-lucide-upload', 
    description: 'Use your own server JAR file from local disk.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: false,
    api: { url: '', type: 'custom' as any }
  }
]

const selectedTypeData = computed(() => serverTypes.find(t => t.id === selectedType.value))

const canToggleSnapshots = computed(() => {
  return selectedTypeData.value?.id === 'vanilla'
})

const toggleLabel = computed(() => 'Show Snapshots')

// Java compatibility check
const javaCompatibility = computed(() => {
  if (!detectedJavaVersion.value) {
    return {
      class: 'bg-gray-800 text-gray-400',
      icon: 'i-lucide-info',
      title: 'Detecting Java...',
      message: 'Checking your system for Java installation'
    }
  }

  const javaMatch = String(detectedJavaVersion.value || '').match(/(\d+)/)
  const javaVer = javaMatch ? parseInt(javaMatch[1]) : 0
  const mcVersion = selectedVersion.value || ''
  
  // Determine required Java version
  let requiredJava = 17
  if (mcVersion >= '1.20.5') requiredJava = 21
  else if (mcVersion >= '1.17') requiredJava = 17
  else requiredJava = 8

  if (javaVer >= requiredJava) {
    return {
      class: 'bg-success-900/30 text-success-400',
      icon: 'i-lucide-check-circle',
      title: 'Java Compatible',
      message: `Java ${javaVer} meets the requirement of Java ${requiredJava}+ for Minecraft ${mcVersion || 'this version'}`
    }
  } else {
    return {
      class: 'bg-warning-900/30 text-warning-400',
      icon: 'i-lucide-alert-triangle',
      title: 'Java Update Recommended',
      message: `Minecraft ${mcVersion} requires Java ${requiredJava}+. You have Java ${javaVer}.`
    }
  }
})

const serverId = computed(() => uuidv4().slice(0, 8))

const serverFolderName = computed(() => {
  const safeName = (serverName.value || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${safeName}-${serverId.value}`
})

const serverPath = computed(() => {
  return `~/Documents/MineDash/servers/${serverFolderName.value}`
})

async function searchModpacks(query = '') {
  modpackLoading.value = true
  try {
    const facets = [['project_type:modpack']]
    
    if (modpackVersion.value) {
      facets.push([`versions:${modpackVersion.value}`])
    }
    
    if (modpackLoader.value) {
      facets.push([`categories:${modpackLoader.value}`])
    }

    let index = 'relevance'
    if (modpackSort.value === 'Downloads') index = 'downloads'
    if (modpackSort.value === 'Newest') index = 'newest'

    const params = new URLSearchParams({
      query,
      facets: JSON.stringify(facets),
      index,
      limit: '20',
      offset: (modpackPage.value * 20).toString()
    })
    
    // Using Modrinth API directly
    const res = await fetch(`https://api.modrinth.com/v2/search?${params}`)
    const data = await res.json()
    modpacksList.value = data.hits
    modpackTotal.value = data.total_hits
  } catch (e) {
    console.error('Failed to search modpacks', e)
  } finally {
    modpackLoading.value = false
  }
}

// Debounce search input
let searchTimeout: any = null
watch(modpackSearch, () => {
  modpackPage.value = 0
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchModpacks(modpackSearch.value)
  }, 500)
})

// Immediate search for filters
watch([modpackSort, modpackVersion, modpackLoader], () => {
  modpackPage.value = 0
  searchModpacks(modpackSearch.value)
})

watch(() => step.value, (newStep) => {
  if (newStep === 2 && selectedType.value === 'modpack' && modpacksList.value.length === 0) {
    searchModpacks()
  }
})

// Replaced by openModpackDetails
// async function selectModpack(pack: any) { ... }

async function openModpackDetails(pack: any) {
  detailedModpack.value = pack
  showModpackModal.value = true
  loadingDetails.value = true
  modpackVersions.value = []
  selectedModpackVersion.value = null
  modpackDescriptionHtml.value = ''

  try {
     // Fetch full project details to get body
     const projectRes = await fetch(`https://api.modrinth.com/v2/project/${pack.project_id || pack.id || pack.slug}`)
     const project = await projectRes.json()
     detailedModpack.value = { ...pack, ...project } // Merge details
     
     // Render description
     if (project.body) {
        modpackDescriptionHtml.value = md.render(project.body)
     }

     // Fetch versions
     const versionsRes = await fetch(`https://api.modrinth.com/v2/project/${pack.project_id || pack.id || pack.slug}/version`)
     const versions = await versionsRes.json()
     modpackVersions.value = versions

     // Pre-select latest release
     if (versions.length > 0) {
        const latest = versions.find((v: any) => v.version_type === 'release') || versions[0]
        selectedModpackVersion.value = latest
     }

  } catch (e) {
     console.error('Failed to load modpack details', e)
  } finally {
     loadingDetails.value = false
  }
}

function confirmModpackSelection() {
   if (!selectedModpackVersion.value) return
   
   // Apply selection
   selectedModpack.value = detailedModpack.value
   selectedModpackVersionData.value = selectedModpackVersion.value
   
   // Set game version from selected modpack version
   if (selectedModpackVersion.value.game_versions && selectedModpackVersion.value.game_versions.length > 0) {
      selectedVersion.value = selectedModpackVersion.value.game_versions[0]
   }
   
   // Set server name if empty
   if (!serverName.value && detailedModpack.value.title) {
      serverName.value = detailedModpack.value.title
   }

   showModpackModal.value = false
   step.value++
}

// Keeping original selectModpack for basic selection if needed, or deprecating it.
// We can just leave it as is, but UI now calls openModpackDetails.
async function selectModpack(pack: any) {
  // Redirect to modal flow
  openModpackDetails(pack)
}

// Pagination Logic
const totalPages = computed(() => Math.ceil(modpackTotal.value / 20))

const visiblePages = computed(() => {
  const current = modpackPage.value + 1
  const total = totalPages.value
  if (total <= 1) return [1]
  
  const delta = 2
  const range: (number | string)[] = []
  
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }
  
  if (current - delta > 2) {
    range.unshift('...')
  }
  
  if (current + delta < total - 1) {
    range.push('...')
  }
  
  range.unshift(1)
  if (total > 1) {
    range.push(total)
  }
  
  return range
})

function goToPage(p: number | string) {
   if (typeof p !== 'number') return
   modpackPage.value = p - 1
   searchModpacks(modpackSearch.value)
}

const canContinue = computed(() => {
  switch (step.value) {
    case 1: return !!selectedType.value
    case 2: 
      if (selectedType.value === 'modpack') return !!selectedModpack.value
      if (selectedType.value === 'custom') return !!customJarPath.value
      return !!selectedVersion.value
    case 3: return true // World settings are optional
    case 4: return serverName.value.length > 0
    default: return true
  }
})

const isValid = computed(() => {
  if (selectedType.value === 'custom') {
    return customJarPath.value && serverName.value.length > 0
  }
  return selectedVersion.value && serverName.value.length > 0
})

function selectType(id: string) {
  selectedType.value = id
}

async function selectJarFile() {
  const selected = await open({
    multiple: false,
    filters: [{ name: 'JAR Files', extensions: ['jar'] }]
  })
  
  if (selected && typeof selected === 'string') {
    customJarPath.value = selected
    const parts = selected.replace(/\\/g, '/').split('/')
    customJarName.value = parts[parts.length - 1] || 'server.jar'
  }
}

async function selectModpackFile() {
  const selected = await open({
    multiple: false,
    filters: [
      { name: 'Modpack Files', extensions: ['mrpack', 'zip'] }
    ]
  })
  
  if (selected && typeof selected === 'string') {
    customModpackPath.value = selected
    const parts = selected.replace(/\\/g, '/').split('/')
    customModpackName.value = parts[parts.length - 1] || 'modpack.mrpack'
    
    // Auto-detect metadata for .mrpack
    if (customModpackPath.value.endsWith('.mrpack')) {
       try {
          const { readFile } = await import('@tauri-apps/plugin-fs')
          const fileData = await readFile(customModpackPath.value)
          const meta = await readMrpackMetadata(fileData)
          
          customModpackMetadata.value = meta
          if (meta.name) customModpackName.value = meta.name
          if (meta.dependencies.minecraft) {
             // selectedVersion.value = meta.dependencies.minecraft
          }
          
          // Priority: fabric, quilt, neoforge, forge
          if (meta.dependencies["fabric-loader"]) modpackLoader.value = 'fabric'
          else if (meta.dependencies["quilt-loader"]) modpackLoader.value = 'quilt'
          else if (meta.dependencies["neoforge"]) modpackLoader.value = 'neoforge'
          else if (meta.dependencies["forge"]) modpackLoader.value = 'forge'
          
       } catch (e) {
          console.error('Failed to parse mrpack metadata', e)
       }
    } else if (customModpackPath.value.endsWith('.zip')) {
        // Auto-detect metadata for MultiMC/Prism Export (.zip)
        try {
            const { readFile } = await import('@tauri-apps/plugin-fs')
            const fileData = await readFile(customModpackPath.value)
            const mmcMeta = await readMmcMetadata(fileData)
            
            customModpackMetadata.value = mmcMeta
            
            // Extract components
            if (mmcMeta.components) {
                const mcComp = mmcMeta.components.find((c: any) => c.uid === 'net.minecraft')
                if (mcComp && mcComp.version) {
                    selectedVersion.value = mcComp.version
                }
                
                // Detect loader from components
                const fabric = mmcMeta.components.find((c: any) => c.uid === 'net.fabricmc.fabric-loader')
                const quilt = mmcMeta.components.find((c: any) => c.uid === 'org.quiltmc.quilt-loader')
                const forge = mmcMeta.components.find((c: any) => c.uid === 'net.minecraftforge')
                const neoforge = mmcMeta.components.find((c: any) => c.uid === 'net.neoforged')
                
                if (fabric) modpackLoader.value = 'fabric'
                else if (quilt) modpackLoader.value = 'quilt'
                else if (neoforge) modpackLoader.value = 'neoforge'
                else if (forge) modpackLoader.value = 'forge'
            }
        } catch (e) {
            console.error('Failed to parse mmc-pack metadata (might be generic zip)', e)
        }
    }

    // Auto-advance logic
    serverName.value = customModpackName.value.replace(/\.(mrpack|zip)$/, '')
    selectedModpack.value = { title: customModpackName.value } // Fake modpack object for UI
    step.value++
  }
}

function goBack() {
  if (step.value > 1) {
    step.value--
  } else {
    navigateTo('/')
  }
}

async function detectJavaVersion() {
  checkingJava.value = true
  try {
    const command = Command.create('run-bat', ['/C', 'java -version'])
    const output = await command.execute()
    
    // Java outputs version to stderr
    const versionOutput = output.stderr || output.stdout
    const match = versionOutput.match(/version "([^"]+)"/)
    
    if (match) {
      detectedJavaVersion.value = match[1] || null
    } else {
      detectedJavaVersion.value = 'Not found'
    }
  } catch (e) {
    console.error('Failed to detect Java', e)
    detectedJavaVersion.value = 'Not found'
  } finally {
    checkingJava.value = false
  }
}

async function fetchVersions() {
  if (!selectedTypeData.value) return
  if (selectedType.value === 'modpack') return // Modpacks use searchModpacks instead
  
  isLoadingVersions.value = true
  availableVersions.value = []
  selectedVersion.value = undefined

  try {
    const apiConfig = selectedTypeData.value.api
    let url = apiConfig.url

    if (includeSnapshots.value && apiConfig.snapshotUrl) {
      url = apiConfig.snapshotUrl
    }

    const response = await fetch(url)
    const data = await response.json()

    if (apiConfig.type === 'papermc') {
      const versionsObj = data.versions || {}
      const allVersions: string[] = []
      
      Object.keys(versionsObj).forEach(majorVer => {
        if (Array.isArray(versionsObj[majorVer])) {
          allVersions.push(...versionsObj[majorVer])
        }
      })
      
      availableVersions.value = allVersions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    } else {
      if (Array.isArray(data)) {
        availableVersions.value = data
      }
    }
  } catch (error) {
    console.error('Failed to fetch versions:', error)
  } finally {
    isLoadingVersions.value = false
  }
}

// Watchers
watch(step, (newStep) => {
  if (newStep === 2 && selectedType.value !== 'custom') {
    fetchVersions()
    includeSnapshots.value = false 
  }
  if (newStep === 4) {
    detectJavaVersion()
  }
})

watch(includeSnapshots, () => {
  if (step.value === 2) {
    fetchVersions()
  }
})

async function resolveDownloadUrl(): Promise<string | null> {
  if (!selectedTypeData.value || !selectedVersion.value) return null
  
  const apiConfig = selectedTypeData.value.api
  const version = selectedVersion.value

  try {
    if (apiConfig.type === 'papermc') {
      const url = `${apiConfig.url}/versions/${version}/builds/latest`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data?.downloads?.['server:default']?.url) {
        return `https://fill-data.papermc.io/v1/objects/${data.downloads['server:default'].checksums.sha256}/${data.downloads['server:default'].name}`
      }
      return null
    } else {
      let baseUrl = apiConfig.url
      
      if (baseUrl.includes('get-versions')) {
        let downloadUrl = baseUrl.replace('get-versions', 'get-jar')
        
        if (includeSnapshots.value && apiConfig.snapshotUrl) {
          downloadUrl = apiConfig.snapshotUrl.replace('get-versions', 'get-jar')
        }
        
        return `${downloadUrl}/${version}`
      }
      
      return null
    }
  } catch (e) {
    console.error('Error resolving download URL', e)
    return null
  }
}

// Add new state for installed files
const installedModpackFiles = ref<any[]>([])

const installedModpackDependencies = ref<any>(null)
const installedModpackMetadata = ref<Record<string, any>>({})

async function createServer() {
  if (!isValid.value) return

  isCreating.value = true
  installedModpackFiles.value = []
  installedModpackDependencies.value = null
  installedModpackMetadata.value = {}
  
  try {
    const uniqueId = uuidv4().slice(0, 8)
    const safeName = (serverName.value || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const folderName = `${safeName}-${uniqueId}`
    const relativePath = `MineDash/servers/${folderName}`

    statusMessage.value = 'Creating directory...'
    await mkdir(relativePath, { baseDir: BaseDirectory.Document, recursive: true })

    const jarName = 'server.jar'
    
    if (selectedType.value === 'custom') {
      if (!customJarPath.value) throw new Error('No JAR selected')
      
      statusMessage.value = 'Copying JAR file...'
      const destPath = await join(relativePath, jarName)
      await copyFile(customJarPath.value, destPath)
    } else if (selectedType.value === 'modpack') {
      if (customModpackPath.value) {
          // Install from local file
          creationProgress.value = 10
          statusMessage.value = 'Reading modpack file...'
          
          // Read file as binary
          const { readFile } = await import('@tauri-apps/plugin-fs')
          const fileData = await readFile(customModpackPath.value)
          
          if (customModpackPath.value.endsWith('.mrpack')) {
             statusMessage.value = 'Installing Modpack (.mrpack)...'
             // Ensure metadata is set if not already (redundant check)
             if (customModpackMetadata.value) {
                // We can use this to set loader info in server.json later if needed
             }
             
             const result = await installMrpack(fileData, relativePath, (msg, prog) => {
                 statusMessage.value = msg
                 if (prog !== undefined) creationProgress.value = prog
             })
             
             if (result && result.files) {
                installedModpackFiles.value = result.files
                installedModpackDependencies.value = result.dependencies
                installedModpackMetadata.value = result.metadata || {}
             }
          } else {
             statusMessage.value = 'Installing Zip (.zip)...'
             await installZip(fileData, relativePath, (msg, prog) => {
                 statusMessage.value = msg
                 if (prog !== undefined) creationProgress.value = prog
             })
          }
      } else {
          // Standard Modrinth Install
          const modpackData = selectedModpackVersionData.value
          if (!modpackData) throw new Error("No modpack version selected")
          
          const file = modpackData.files.find((f: any) => f.primary) || modpackData.files[0]
          if (!file) throw new Error("No file found for modpack version")
          
          statusMessage.value = 'Initializing installer...'
          const result = await installModpack(file.url, relativePath, (msg, prog) => {
              statusMessage.value = msg
              if (prog !== undefined) creationProgress.value = prog
          })
          
          if (result && result.files) {
            installedModpackFiles.value = result.files
            installedModpackDependencies.value = result.dependencies
            installedModpackMetadata.value = result.metadata || {}
          }
      }
    } else {
      statusMessage.value = 'Resolving download URL...'
      const downloadUrl = await resolveDownloadUrl()
      
      if (!downloadUrl) {
        statusMessage.value = 'Failed to resolve download URL.'
        isCreating.value = false
        return
      }

      statusMessage.value = 'Downloading server JAR...'
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`)
      
      const buffer = await response.arrayBuffer()
      await writeFile(
        await join(relativePath, jarName),
        new Uint8Array(buffer),
        { baseDir: BaseDirectory.Document }
      )
    }

    statusMessage.value = 'Writing server.properties...'
    
    // Create server.properties with world settings
    const serverProperties = [
      `level-seed=${worldSeed.value}`,
      `level-type=minecraft\\:${worldType.value}`,
      `generate-structures=${generateStructures.value}`,
      `hardcore=${hardcoreMode.value}`,
      `motd=${serverName.value}`,
      `max-players=20`
    ].join('\n')

    await writeTextFile(
      await join(relativePath, 'server.properties'),
      serverProperties,
      { baseDir: BaseDirectory.Document }
    )

    statusMessage.value = 'Creating server configuration...'

    // Save extended modpack metadata
    if (selectedType.value === 'modpack' && installedModpackFiles.value.length > 0) {
        // Save addons.json with resolved metadata
        if (installedModpackMetadata.value && Object.keys(installedModpackMetadata.value).length > 0) {
           await writeTextFile(
              await join(relativePath, 'addons.json'),
              JSON.stringify(installedModpackMetadata.value, null, 2), 
              { baseDir: BaseDirectory.Document }
           )
        }
    }

    // Create Metadata
    const metadata = {
      id: uniqueId,
      name: serverName.value,
      type: selectedTypeData.value?.id,
      typeName: selectedTypeData.value?.name,
      modpack: selectedModpack.value ? {
         id: selectedModpack.value.id || 'custom',
         title: selectedModpack.value.title || customModpackName.value,
         slug: selectedModpack.value.slug || customModpackName.value,
         loader: modpackLoader.value || selectedModpackVersionData.value?.loaders?.[0],
         version: selectedType.value === 'custom' ? 'custom' : (selectedModpackVersionData.value?.id || 'custom'),
         
         // Store extended metadata
         files: installedModpackFiles.value,
         dependencies: installedModpackDependencies.value
      } : undefined,
      version: selectedType.value === 'custom' ? 'Custom' : selectedVersion.value,
      icon: selectedTypeData.value?.icon,
      jarFile: jarName,
      createdAt: new Date().toISOString(),
      path: relativePath,
      javaSettings: {
        memory: ramLimit.value,
        path: 'java',
        flags: ''
      }
    }

    await writeTextFile(
      await join(relativePath, 'server.json'),
      JSON.stringify(metadata, null, 2),
      { baseDir: BaseDirectory.Document }
    )

    statusMessage.value = 'Done! Launching server...'
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Refresh servers list in sidebar
    const serversStore = useServersStore()
    await serversStore.refreshServers()
    
    // Navigate to the new server
    navigateTo(`/server/${folderName}`)

  } catch (error) {
    console.error('Creation failed', error)
    statusMessage.value = `Error: ${error}`
  } finally {
    isCreating.value = false
  }
}
</script>
