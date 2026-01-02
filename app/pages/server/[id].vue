<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
       <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-4">
            <UButton
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              to="/"
            />
            
            <div v-if="loading" class="h-8 w-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
            <div v-else class="flex items-center gap-3">
               <div class="w-10 h-10 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                 <UIcon :name="server?.icon || 'i-lucide-box'" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
               </div>
               <div>
                 <h1 class="font-bold text-lg leading-tight">{{ server?.name }}</h1>
                 <p class="text-xs text-gray-500">{{ server?.typeName }} {{ server?.version }} • ID: {{ server?.id }}</p>
               </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
             <UBadge :color="statusColor" variant="subtle" size="md" class="px-3 py-1.5 uppercase">{{ serverStatus }}</UBadge>
             
             <UButton 
               v-if="serverStatus === 'offline'"
               color="success" 
               icon="i-lucide-play" 
               label="Start" 
               @click="startServer" 
             />
             <template v-else>
                <UButton 
                   color="error" 
                   icon="i-lucide-square" 
                   label="Stop" 
                   :loading="serverStatus === 'stopping'"
                   @click="stopServer" 
                />
                <UButton 
                   color="error" 
                   variant="ghost"
                   icon="i-lucide-skull" 
                   @click="killServer"
                   title="Force Kill"
                />
             </template>
          </div>
       </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center h-full">
         <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
      </div>

      <div v-else class="max-w-7xl mx-auto h-full p-6 flex flex-col">
        <UTabs v-model="selectedTab" :items="tabs" class="w-full flex-1 flex flex-col" :ui="{ wrapper: 'flex-1 flex flex-col', container: 'flex-1 mt-4 overflow-y-auto' }">
           
           <!-- Console / Overview -->
           <template #console>
             <div class="h-full flex flex-col">
               <div ref="consoleRef" class="flex-1 bg-black max-h-[68vh] rounded-lg border border-gray-800 p-4 font-mono text-xs md:text-sm text-gray-300 overflow-y-auto custom-scrollbar font-ligatures-none">
                  <div v-if="consoleLines.length === 0" class="text-gray-500 italic">Server is offline. Output will appear here.</div>
                  <div 
                     v-for="(line, i) in consoleLines" 
                     :key="i" 
                     class="whitespace-pre-wrap break-all px-1 -mx-1 rounded"
                     :class="{
                        'bg-yellow-500/20': line.includes(' WARN]') || line.includes(' WARN:'),
                        'bg-red-500/20': line.includes(' ERROR]') || line.includes(' ERROR:')
                     }"
                     v-html="parseAnsiToHtml(line)"
                  ></div>
               </div>
               <div class="mt-4 flex gap-2">
                 <UInput 
                    v-model="consoleInput"
                    placeholder="Type a command..." 
                    class="flex-1" 
                    icon="i-lucide-terminal" 
                    @keydown.enter="sendCommand"
                    :disabled="serverStatus === 'offline'"
                 />
                 <UButton 
                    color="neutral" 
                    variant="soft" 
                    @click="sendCommand"
                    :disabled="serverStatus === 'offline'"
                 >Send</UButton>
               </div>
             </div>
           </template>

           <!-- Settings (RAM, Flags, Java) -->
           <template #settings>
              <div class="max-w-6xl mx-auto space-y-6 py-6 px-4">
                 
                 <!-- Header & Actions -->
                 <div class="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm sticky top-0 z-20 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
                    <div>
                       <h2 class="font-bold text-lg text-gray-900 dark:text-white">Server Configuration</h2>
                       <p class="text-xs text-gray-500">Manage general settings, gameplay, and performance</p>
                    </div>
                    <UButton size="md" color="primary" icon="i-lucide-save" :loading="saving" @click="saveAllSettings">Save All Changes</UButton>
                 </div>

                 <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    
                    <!-- Left Column: General & Gameplay -->
                    <div class="space-y-6">
                       <!-- General Settings -->
                       <UCard>
                          <template #header>
                             <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-info" class="w-5 h-5 text-primary-500" />
                                <h3 class="font-semibold">General Information</h3>
                             </div>
                          </template>
                          
                          <div class="space-y-6">
                             <div class="space-y-2">
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Server Name</label>
                                <UInput v-model="serverName" placeholder="My Awesome Server" icon="i-lucide-pencil" />
                             </div>

                             <!-- MOTD Editor -->
                             <div class="space-y-3">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Message of the Day (MOTD)</label>
                                <div class="flex flex-wrap gap-1 mb-2">
                                   <!-- Colors -->
                                   <button v-for="code in mcColorCodes" :key="code.code" 
                                      @click="insertMotdCode(code.code)"
                                      class="w-6 h-6 rounded text-xs font-bold border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                                      :style="{ backgroundColor: code.color, color: code.textColor }"
                                      :title="code.name"
                                   >
                                      {{ code.code }}
                                   </button>
                                   <div class="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                   <!-- Styles -->
                                   <button v-for="style in mcStyleCodes" :key="style.code"
                                      @click="insertMotdCode(style.code)"
                                      class="px-2 h-6 rounded text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                      :class="style.class"
                                      :title="style.name"
                                   >
                                      {{ style.label }}
                                   </button>
                                </div>
                                <textarea 
                                   ref="motdTextarea"
                                   :value="getPropertyValue('motd')" 
                                   @input="(e) => updateProperty('motd', (e.target as HTMLTextAreaElement).value)"
                                   placeholder="A Minecraft Server"
                                   class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                   rows="3"
                                ></textarea>
                                <div class="p-3 bg-black border border-gray-800 rounded-lg overflow-hidden">
                                   <p class="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Preview</p>
                                   <div class="font-minecraft text-lg leading-tight" v-html="renderMotdPreview(getPropertyValue('motd'))"></div>
                                </div>
                             </div>
                          </div>
                       </UCard>

                       <!-- Gameplay Settings -->
                       <UCard>
                          <template #header>
                             <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-gamepad-2" class="w-5 h-5 text-primary-500" />
                                <h3 class="font-semibold">Gameplay</h3>
                             </div>
                          </template>

                          <div class="space-y-6">
                             <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Gamemode</label>
                                   <USelectMenu 
                                       class="w-full"
                                      :model-value="getPropertyValue('gamemode')" 
                                      @update:model-value="(val) => updateProperty('gamemode', val)"
                                      :items="['survival', 'creative', 'adventure', 'spectator']"
                                   />
                                </div>
                                <div class="space-y-2">
                                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
                                   <USelectMenu 
                                       class="w-full"
                                      :model-value="getPropertyValue('difficulty')" 
                                      @update:model-value="(val) => updateProperty('difficulty', val)"
                                      :items="['peaceful', 'easy', 'normal', 'hard']"
                                   />
                                </div>
                                <div class="space-y-2">
                                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Port</label>
                                   <UInput 
                                       type="number"
                                       placeholder="25565"
                                       class="w-full"
                                       icon="i-lucide-network"
                                      :model-value="getPropertyValue('server-port')" 
                                      @update:model-value="(val) => updateProperty('server-port', val)"
                                   />
                                </div>
                                
                             </div>

                             <div class="space-y-4 pt-2">
                                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                   <div>
                                      <p class="font-medium text-gray-900 dark:text-white">PVP</p>
                                      <p class="text-xs text-gray-500">Allow players to fight each other</p>
                                   </div>
                                   <USwitch 
                                      :model-value="getPropertyValue('pvp') === 'true'" 
                                      @update:model-value="(val) => updateProperty('pvp', val)" 
                                      color="primary"
                                   />
                                </div>

                                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                   <div>
                                      <p class="font-medium text-gray-900 dark:text-white">Allow Flight</p>
                                      <p class="text-xs text-gray-500">Allow flying in survival mode</p>
                                   </div>
                                   <USwitch 
                                      :model-value="getPropertyValue('allow-flight') === 'true'" 
                                      @update:model-value="(val) => updateProperty('allow-flight', val)" 
                                      color="primary"
                                   />
                                </div>

                                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                   <div>
                                      <p class="font-medium text-gray-900 dark:text-white">Command Blocks</p>
                                      <p class="text-xs text-gray-500">Enable command block functionality</p>
                                   </div>
                                   <USwitch 
                                      :model-value="getPropertyValue('enable-command-block') === 'true'" 
                                      @update:model-value="(val) => updateProperty('enable-command-block', val)" 
                                      color="primary"
                                   />
                                </div>
                             </div>
                          </div>
                       </UCard>
                    </div>

                    <!-- Right Column: System & Danger -->
                    <div class="space-y-6">
                       <!-- Java Settings -->
                       <UCard>
                          <template #header>
                             <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-cpu" class="w-5 h-5 text-primary-500" />
                                <h3 class="font-semibold">System & Performance</h3>
                             </div>
                          </template>
                          
                          <div class="space-y-6">
                             <div class="space-y-4">
                                <div class="flex justify-between items-end">
                                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Memory Allocation (RAM)</label>
                                  <span class="text-lg font-bold text-primary-600 dark:text-primary-400">{{ javaSettings.memory }} GB</span>
                                </div>
                                <USlider v-model="javaSettings.memory" :min="1" :max="32" :step="0.5" />
                                <div class="flex justify-between text-xs text-gray-500 font-mono">
                                   <span>1 GB</span>
                                   <span>32 GB</span>
                                </div>
                             </div>

                             <div class="space-y-2 flex flex-col">
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Java Startup Flags</label>
                                <UTextarea v-model="javaSettings.flags" placeholder="-Aikars flags..." :rows="4" class="font-mono text-xs" />
                                <p class="text-xs text-gray-500">Advanced: Add custom JVM arguments here.</p>
                             </div>
                          </div>
                       </UCard>

                        <UCard >
                           <template #header>
                             <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-users" class="w-5 h-5 text-primary-500" />
                                <h3 class="font-semibold">Capacity</h3>
                             </div>
                          </template>
                           <div class="space-y-2 col-span-2">
                              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Players</label>
                              <UInputNumber size="xl" class="w-44" placeholder="20" :value="getPropertyValue('max-players')"  @update:model-value="(val) => updateProperty('max-players', val)">
                                 <template #decrement>
                                    <UButton size="xs" icon="i-lucide-minus" />
                                 </template>

                                 <template #increment>
                                    <UButton size="xs" icon="i-lucide-plus" />
                                 </template>
                              </UInputNumber>
                              <p class="text-xs text-gray-500">MORE PLAYERS = MORE RAM</p>
                           </div>
                       </UCard>

                       <!-- Danger Zone -->
                       <UCard :ui="{ ring: 'ring-1 ring-error-500/50', divide: 'divide-error-500/20', body: { base: 'bg-error-50/50 dark:bg-error-950/10' } }">
                          <template #header>
                             <h3 class="font-semibold text-error-500 flex items-center gap-2">
                                <UIcon name="i-lucide-alert-triangle" />
                                Danger Zone
                             </h3>
                          </template>
                          
                          <div class="flex items-center justify-between">
                             <div>
                                <div class="font-medium text-gray-900 dark:text-white">Delete Server</div>
                                <div class="text-sm text-gray-500 w-3/4">Permanently delete this server and all its files. This action cannot be undone.</div>
                             </div>
                             <UButton 
                                color="error" 
                                variant="solid" 
                                label="Delete" 
                                icon="i-lucide-trash-2"
                                @click="openDeleteModal"
                             />
                          </div>
                       </UCard>
                    </div>

                 </div>

                  <!-- Delete Confirmation Modal -->
                  <UModal v-model:open="showDeleteModal" title="Delete server" description="Are you sure you want to delete?">
                     <template #body>
                        <div class="p-6 space-y-4">
                           <div class="flex items-center gap-3 text-error-500 mb-2">
                              <div class="p-2 flex justify-center items-center bg-error-50 dark:bg-error-900/20 rounded-lg">
                                 <UIcon name="i-lucide-alert-triangle" class="w-6 h-6" />
                              </div>
                              <h3 class="font-bold text-lg text-gray-900 dark:text-white">Delete Server?</h3>
                           </div>
                           
                           <p class="text-gray-500 dark:text-gray-400">
                              Are you sure you want to delete <span class="font-bold text-gray-900 dark:text-white">{{ serverFolderName }}</span>? 
                              This action will permanently remove all server files, worlds, and configs. 
                              <span class="font-bold text-error-500">This cannot be undone.</span>
                           </p>
                           
                           <div class="space-y-2 flex flex-col">
                              <label class="text-xs font-medium text-gray-500 uppercase">Type server name to confirm</label>
                              <UInput 
                                 v-model="deleteConfirmation" 
                                 :placeholder="serverFolderName" 
                                 icon="i-lucide-trash-2"
                                 :ui="{ icon: { trailing: { pointer: '' } } }"
                                 color="error"
                              />
                           </div>

                           
                        </div>
                     </template>

                     <template #footer>
                        <div class="flex justify-end gap-2 mt-6">
                           <UButton color="neutral" variant="ghost" @click="showDeleteModal = false">Cancel</UButton>
                           <UButton 
                              color="error" 
                              variant="solid" 
                              label="Delete Permanently" 
                              :loading="deletingServer"
                              :disabled="deleteConfirmation !== serverFolderName"
                              @click="confirmDeleteServer"
                           />
                        </div>
                     </template>
                     
                  </UModal>
              </div>
           </template>



           <template #addons>
               <div class="h-full flex flex-col p-4 relative">
                  <!-- Toolbar -->
                  <div class="flex items-center justify-between mb-4">
                     <div>
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white">Installed {{ addonsFolder === 'mods' ? 'Mods' : 'Plugins' }}</h3>
                        <p class="text-sm text-gray-500">Manage your server extensions</p>
                     </div>
                     <UButton 
                        icon="i-lucide-download" 
                        color="primary" 
                        :label="addonsFolder === 'mods' ? 'Download Mods' : 'Download Plugins'" 
                        @click="showModrinthModal = true"
                     />
                  </div>

                  <!-- Installed List -->
                  <UCard class="flex-1 min-h-0 flex flex-col" :ui="{ body: { base: 'flex-1 min-h-0 overflow-y-auto p-0' } }">
                     <div v-if="loadingAddons" class="flex justify-center py-12">
                         <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
                     </div>
                     <div v-else-if="addons.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500">
                         <UIcon name="i-lucide-package" class="w-12 h-12 mb-2 opacity-30" />
                         <p>No extensions installed</p>
                     </div>
                     <table v-else class="w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-800/50 text-left sticky top-0 z-10 backdrop-blur">
                           <tr>
                              <th class="p-3 font-medium text-gray-500 w-8"></th>
                              <th class="p-3 font-medium text-gray-500">Name</th>
                              <th class="p-3 font-medium text-gray-500 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                           <tr v-for="addon in addons" :key="addon.fileName" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td class="p-3 w-14">
                                 <img v-if="addon.icon" :src="addon.icon" class="w-6 h-6 rounded object-cover" />
                                 <UIcon v-else name="i-lucide-box" class="w-6 h-6 text-gray-400" />
                              </td>
                              <td class="p-3">
                                 <div class="font-medium" :class="{'text-gray-400 line-through': !addon.enabled}">{{ addon.title || addon.fileName }}</div>
                                 <div class="text-xs text-gray-500">{{ addon.fileName }}</div>
                              </td>
                              <td class="p-3 text-right">
                                 <div class="flex justify-end gap-1">
                                       <USwitch 
                                          :model-value="addon.enabled" 
                                          @update:model-value="toggleAddon(addon)"
                                          color="primary"
                                          size="md"
                                       />
                                    <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="deleteAddon(addon.fileName)" />
                                    <UTooltip v-if="addon.source === 'modrinth' && addon.latestVersionId" :text="`Update to ${addon.latestVersionNumber}`">
                                       <UButton icon="i-lucide-rotate-cw" color="primary" variant="ghost" size="xs" @click="updateAddon(addon)" />
                                    </UTooltip>
                                 </div>
                              </td>
                           </tr>
                        </tbody>
                     </table>
                  </UCard>
                  
                  <!-- Modrinth Modal -->
                  <UModal v-model:open="showModrinthModal" :ui="{ width: 'w-screen max-w-4xl' }">
                     <template #header>
                         <div class="flex items-center gap-4 w-full">
                            <UInput 
                               v-model="modrinthQuery" 
                               icon="i-lucide-search" 
                               placeholder="Search..." 
                               class="flex-1" 
                               autofocus
                               @keydown.enter="searchModrinth"
                            />
                            <USelect 
                               v-model="selectedCategory" 
                               :options="modrinthCategories" 
                               option-attribute="label"
                               value-attribute="value"
                               placeholder="Category"
                               class="w-40"
                            />
                            <UButton color="primary" icon="i-lucide-search" :loading="searchingModrinth" @click="searchModrinth" />
                         </div>
                     </template>

                     <template #body>
                        <div class="h-[60vh] overflow-y-auto p-4 space-y-2">
                           <div v-if="modrinthResults.length === 0 && !searchingModrinth" class="text-center py-12 text-gray-500">
                              <UIcon name="i-lucide-search" class="w-12 h-12 mx-auto mb-2 opacity-20" />
                              <p>Search via Modrinth to find addons...</p>
                           </div>
                           
                           <div v-for="hit in modrinthResults" :key="hit.slug" class="flex gap-4 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <img :src="hit.icon_url || 'https://cdn.modrinth.com/placeholder.svg'" class="w-12 h-12 rounded bg-gray-200 object-cover" />
                              <div class="flex-1 min-w-0">
                                 <h4 class="font-bold text-sm truncate flex items-center gap-2">
                                    {{ hit.title }}
                                    <UBadge v-if="installedAddonsMeta[hit.slug]" size="xs" color="success" variant="subtle">Installed</UBadge>
                                 </h4>
                                 <p class="text-xs text-gray-500 line-clamp-2 my-1">{{ hit.description }}</p>
                                 <div class="flex items-center gap-2">
                                    <UBadge size="xs" color="neutral" variant="subtle">{{ hit.project_type }}</UBadge>
                                    <span class="text-xs text-gray-400">Downloads: {{ hit.downloads }}</span>
                                 </div>
                              </div>
                              <UButton 
                                 size="xs" 
                                 color="primary" 
                                 variant="soft" 
                                 icon="i-lucide-download" 
                                 class="self-center"
                                 :loading="hit.installing"
                                 @click="installFromModrinth(hit)"
                              />
                           </div>
                        </div>
                     </template>
                     

                  </UModal>
               </div>
           </template>

           <!-- File Manager -->
           <template #files>
               <div class="h-full flex flex-col p-4">
                  <!-- Navigation Bar -->
                  <div class="flex items-center gap-2 mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2 rounded-lg">
                     <UButton icon="i-lucide-home" color="neutral" variant="ghost" size="sm" @click="loadFiles('')" />
                     <UIcon name="i-lucide-chevron-right" class="text-gray-400 w-4 h-4" />
                     
                     <div class="flex-1 flex flex-wrap items-center gap-1 font-mono text-sm">
                        <template v-if="!fileCurrentPath">
                           <span class="text-gray-500">root</span>
                        </template>
                        <template v-else>
                           <UButton 
                              v-for="(part, idx) in fileCurrentPath.split('/')" 
                              :key="idx"
                              :label="part"
                              color="neutral"
                              variant="ghost"
                              size="xs"
                              @click="loadFiles(fileCurrentPath.split('/').slice(0, idx+1).join('/'))"
                           />
                        </template>
                     </div>

                     <UButton icon="i-lucide-arrow-up" color="neutral" variant="ghost" size="sm" :disabled="!fileCurrentPath" @click="navigateUp" />
                     <UButton icon="i-lucide-folder-symlink" color="neutral" variant="ghost" size="sm" title="Open in Explorer" @click="openServerFolder" />
                     <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="sm" :loading="loadingFiles" @click="loadFiles(fileCurrentPath)" />
                  </div>

                  <!-- File List -->
                  <UCard class="flex-1 min-h-0 flex flex-col" :ui="{ body: { base: 'flex-1 min-h-0 overflow-y-auto p-0' } }">
                     <div v-if="loadingFiles" class="flex justify-center py-12">
                        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
                     </div>
                     <div v-else-if="serverFiles.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500">
                        <UIcon name="i-lucide-folder-open" class="w-12 h-12 mb-2 opacity-50" />
                        <p>Empty directory</p>
                     </div>
                     <table v-else class="w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-800/50 text-left sticky top-0 z-10 backdrop-blur">
                           <tr>
                              <th class="p-3 font-medium text-gray-500 w-8"></th>
                              <th class="p-3 font-medium text-gray-500">Name</th>
                              <th class="p-3 font-medium text-gray-500 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                           <tr 
                              v-for="file in serverFiles" 
                              :key="file.name" 
                              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 group cursor-pointer"
                              @click="navigateFile(file)"
                           >
                              <td class="p-3 text-center">
                                 <UIcon :name="getFileIcon(file.name, file.isDirectory)" :class="['w-5 h-5', getFileColor(file.name, file.isDirectory)]" />
                              </td>
                              <td class="p-3 font-medium font-mono" :class="{'text-primary-500': file.isDirectory}">
                                 {{ file.name }}
                              </td>
                              <td class="p-3 text-right">
                                 <div class="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                                    <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click.stop="deleteFileEntry(file)" />
                                 </div>
                              </td>
                           </tr>
                        </tbody>
                     </table>
                  </UCard>
               </div>
           </template>
        </UTabs>
      </div>
      <!-- EULA Modal -->
      <UModal v-model:open="showEulaModal">
         <template #header>
            <div class="flex items-center gap-2 text-warning-500">
               <UIcon name="i-lucide-scroll-text" class="w-6 h-6" />
               <h3 class="font-bold text-lg text-gray-900 dark:text-white">Accept EULA</h3>
            </div>
         </template>
         
         <template #body>
            <div class="space-y-4">
               <p class="text-sm text-gray-600 dark:text-gray-300">
                  By using this software, you agree to the <a href="https://aka.ms/MinecraftEULA" target="_blank" class="text-primary-500 hover:underline">Minecraft End User License Agreement</a>.
               </p>
               <p class="text-xs text-gray-500">
                  You must accept the EULA to start the server.
               </p>
            </div>
         </template>


         <template #footer>
            <div class="flex justify-end gap-2">
               <UButton color="neutral" variant="ghost" @click="showEulaModal = false">Cancel</UButton>
               <UButton color="primary" @click="acceptEula">I Agree</UButton>
            </div>
         </template>
      </UModal>
    </main>
  </div>
</template>

<script setup lang="ts">
import { readTextFile, writeTextFile, readDir, remove, exists, mkdir, writeFile, rename, BaseDirectory } from '@tauri-apps/plugin-fs'
import { fetch } from '@tauri-apps/plugin-http'
import { Command, type Child, open } from '@tauri-apps/plugin-shell'
import { join } from '@tauri-apps/api/path'
import { documentDir } from '@tauri-apps/api/path'
import { parseAnsiToHtml } from '~/utils/ansiParser'
import { getFileIcon, getFileColor } from '~/utils/fileIcons'

const route = useRoute()
const serverId = route.params.id as string // actually folder name

const serverFolderName = computed(() => route.params.id as string)

const loading = ref(true)
const saving = ref(false)
const server = ref<any>(null)

// Settings
const serverName = ref('')
const javaSettings = reactive({
   memory: 4,
   path: 'java',
   flags: ''
})

// Properties
const rawProperties = ref('')
const parsedProperties = ref<Record<string, any>>({})
const propsSearch = ref('')

// MOTD Editor
const motdTextarea = ref<HTMLTextAreaElement | null>(null)

const mcColorCodes = [
   { code: '0', color: '#000000', textColor: '#fff', name: 'Black' },
   { code: '1', color: '#0000AA', textColor: '#fff', name: 'Dark Blue' },
   { code: '2', color: '#00AA00', textColor: '#fff', name: 'Dark Green' },
   { code: '3', color: '#00AAAA', textColor: '#000', name: 'Dark Aqua' },
   { code: '4', color: '#AA0000', textColor: '#fff', name: 'Dark Red' },
   { code: '5', color: '#AA00AA', textColor: '#fff', name: 'Dark Purple' },
   { code: '6', color: '#FFAA00', textColor: '#000', name: 'Gold' },
   { code: '7', color: '#AAAAAA', textColor: '#000', name: 'Gray' },
   { code: '8', color: '#555555', textColor: '#fff', name: 'Dark Gray' },
   { code: '9', color: '#5555FF', textColor: '#fff', name: 'Blue' },
   { code: 'a', color: '#55FF55', textColor: '#000', name: 'Green' },
   { code: 'b', color: '#55FFFF', textColor: '#000', name: 'Aqua' },
   { code: 'c', color: '#FF5555', textColor: '#000', name: 'Red' },
   { code: 'd', color: '#FF55FF', textColor: '#000', name: 'Light Purple' },
   { code: 'e', color: '#FFFF55', textColor: '#000', name: 'Yellow' },
   { code: 'f', color: '#FFFFFF', textColor: '#000', name: 'White' },
]

const mcStyleCodes = [
   { code: 'l', label: 'B', class: 'font-bold', name: 'Bold' },
   { code: 'o', label: 'I', class: 'italic', name: 'Italic' },
   { code: 'n', label: 'U', class: 'underline', name: 'Underline' },
   { code: 'm', label: 'S', class: 'line-through', name: 'Strikethrough' },
   { code: 'k', label: '?', class: '', name: 'Obfuscated' },
   { code: 'r', label: 'R', class: 'text-gray-400', name: 'Reset' },
]

const mcColorMap: Record<string, string> = {
   '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
   '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
   '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
   'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF',
}

function insertMotdCode(code: string) {
   const textarea = motdTextarea.value
   if (!textarea) return
   
   const start = textarea.selectionStart
   const end = textarea.selectionEnd
   const currentValue = parsedProperties.value['motd'] || ''
   const newValue = currentValue.slice(0, start) + '§' + code + currentValue.slice(end)
   parsedProperties.value['motd'] = newValue
   
   // Restore cursor position
   nextTick(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + 2
   })
}

function renderMotdPreview(motd: string): string {
   if (!motd) return '<span class="text-gray-500">A Minecraft Server</span>'
   
   let result = ''
   let currentColor = '#AAAAAA'
   let bold = false, italic = false, underline = false, strike = false
   
   let i = 0
   while (i < motd.length) {
      if (motd[i] === '§' && i + 1 < motd.length) {
         const code = motd[i + 1].toLowerCase()
         
         if (mcColorMap[code]) {
            currentColor = mcColorMap[code]
            bold = italic = underline = strike = false
         } else if (code === 'l') bold = true
         else if (code === 'o') italic = true
         else if (code === 'n') underline = true
         else if (code === 'm') strike = true
         else if (code === 'r') {
            currentColor = '#AAAAAA'
            bold = italic = underline = strike = false
         }
         
         i += 2
         continue
      }
      
      let styles = `color: ${currentColor};`
      if (bold) styles += ' font-weight: bold;'
      if (italic) styles += ' font-style: italic;'
      if (underline) styles += ' text-decoration: underline;'
      if (strike) styles += ' text-decoration: line-through;'
      
      const char = motd[i] === '<' ? '&lt;' : motd[i] === '>' ? '&gt;' : motd[i]
      result += `<span style="${styles}">${char}</span>`
      i++
   }
   
   return result || '<span class="text-gray-500">A Minecraft Server</span>'
}

// --- Addons (Mods/Plugins) Logic ---
// --- Addons (Mods/Plugins) Logic ---
interface AddonMeta {
    title: string
    icon?: string
    slug?: string
    versionId?: string
    fileName: string
    source: 'modrinth' | 'local'
}

interface AddonUI extends AddonMeta {
    latestVersionId?: string
    latestVersionNumber?: string
    enabled: boolean
}

const addons = ref<AddonUI[]>([]) // Combined list
const installedAddonsMeta = ref<Record<string, Omit<AddonMeta, 'fileName' | 'source'>>>({}) // Persistent meta
const loadingAddons = ref(false)
const checkingUpdates = ref(false)

// ...

async function toggleAddon(addon: AddonUI) {
   const folder = serverFolderName.value
   const oldName = addon.fileName
   // If currently enabled (ends with .jar), disable it (append .disabled)
   // If currently disabled (.disabled), enable it (remove .disabled)
   // But easier: check addon.enabled flag derived from extension.
   
   const newName = addon.enabled ? `${oldName}.disabled` : oldName.replace(/\.disabled$/, '')
   
   const oldPath = `MineDash/servers/${folder}/${addonsFolder.value}/${oldName}`
   const newPath = `MineDash/servers/${folder}/${addonsFolder.value}/${newName}`
   
   try {
       await rename(oldPath, newPath, { oldPathBaseDir: BaseDirectory.Document, newPathBaseDir: BaseDirectory.Document })
       
       // Update Meta Key
       if (installedAddonsMeta.value[oldName]) {
           installedAddonsMeta.value[newName] = installedAddonsMeta.value[oldName]
           delete installedAddonsMeta.value[oldName]
           await saveAddonsMeta()
       }
       
       loadAddons()
   } catch (e) {
       console.error('Toggle failed', e)
   }
}

// ...



async function checkForUpdates() {
    checkingUpdates.value = true
    try {
        const serverVersion = server.value.version
        const serverType = server.value.type

        let loaders: string[] = []
        if (serverType === 'fabric') loaders = ['fabric']
        else if (serverType === 'forge') loaders = ['forge']
        else if (serverType === 'neoforge') loaders = ['neoforge']
        else if (serverType === 'paper' || serverType === 'purpur') loaders = ['paper', 'bukkit', 'spigot']
        else if (serverType === 'velocity') loaders = ['velocity']
        
        const params = new URLSearchParams()
        if (loaders.length) params.append('loaders', JSON.stringify(loaders))
        if (serverVersion) params.append('game_versions', JSON.stringify([serverVersion]))

        // Check for each addon in parallel
        await Promise.all(addons.value.map(async (addon) => {
            if (addon.source !== 'modrinth' || !addon.slug) return
            
            try {
                const res = await fetch(`https://api.modrinth.com/v2/project/${addon.slug}/version?${params.toString()}`)
                const versions = await res.json()
                
                if (versions && versions.length > 0) {
                    const validVersion = versions[0]
                    
                    if (validVersion.id !== addon.versionId) {
                        let isActuallyCurrent = false
                        
                        // Check if current file matches the remote version's files (Auto-Heal)
                        const remoteFiles = validVersion.files || []
                        const localFileName = addon.fileName.replace('.disabled', '')
                        const match = remoteFiles.find((f: any) => f.filename === localFileName)
                        
                        if (match) {
                            isActuallyCurrent = true
                            // Update local meta with missing version ID
                            if (installedAddonsMeta.value[addon.fileName]) {
                                installedAddonsMeta.value[addon.fileName].versionId = validVersion.id
                                saveAddonsMeta()
                            }
                        }

                        if (!isActuallyCurrent) {
                            addon.latestVersionId = validVersion.id
                            addon.latestVersionNumber = validVersion.version_number
                        }
                    }
                }
            } catch (ignore) { /* verify failed for specific addon */ }
        }))

    } catch (e) {
        console.error('Update check failed', e)
    } finally {
        checkingUpdates.value = false
    }
}

async function updateAddon(addon: AddonUI) {
    if (!addon.latestVersionId || !addon.slug) return
    
    // 1. Delete old
    await deleteAddon(addon.fileName)
    
    // 2. Install new (Simulate project object)
    // We need to fetch versions AGAIN or pass the cached ID?
    // Let's modify installFromModrinth or just duplicate logic slightly for stability.
    // Better: Re-use installFromModrinth logic but with just slug/meta.
    const projectStub = { title: addon.title, slug: addon.slug, icon_url: addon.icon }
    await installFromModrinth(projectStub)
}

// ...

// Update installFromModrinth to save versionId


const modrinthQuery = ref('')
const modrinthResults = ref<any[]>([])
const searchingModrinth = ref(false)
const showModrinthModal = ref(false)
const selectedCategory = ref('')

const modrinthCategories = [
    { label: 'All', value: '' },
    { label: 'Fabric', value: 'fabric' },
    { label: 'Forge', value: 'forge' },
    { label: 'NeoForge', value: 'neoforge' },
    { label: 'Quilt', value: 'quilt' },
    { label: 'Bukkit', value: 'bukkit' },
    { label: 'Spigot', value: 'spigot' },
    { label: 'Paper', value: 'paper' },
    { label: 'Datapack', value: 'datapack' }
]

// Use composable for server state persistence
const serverStore = useServerProcessStore()
const storeServerId = computed(() => serverFolderName.value)
const serverState = computed(() => serverStore.getServer(storeServerId.value))

// These are reactive references to the store - mutations work directly
const serverStatus = computed({
   get: () => serverState.value.status,
   set: (val) => { serverState.value.status = val }
})
const serverProcess = computed({
   get: () => serverState.value.process,
   set: (val) => { serverState.value.process = val }
})

// Direct reference to console lines array - mutations like .push() work
const consoleLines = computed(() => serverState.value.consoleLines)
const consoleRef = ref<HTMLElement | null>(null)

watch(() => consoleLines.value.length, async () => {
   await nextTick()
   if (consoleRef.value) {
       consoleRef.value.scrollTop = consoleRef.value.scrollHeight
   }
})
const showEulaModal = ref(false)

const statusColor = computed(() => {
   switch(serverStatus.value) {
      case 'online': return 'success'
      case 'starting': return 'warning'
      case 'stopping': return 'warning'
      default: return 'neutral'
   }
})

const addonsFolder = computed(() => {
   if (!server.value) return null
   const t = server.value.type
   if (['fabric', 'forge', 'neoforge', 'quilt'].includes(t)) return 'mods'
   if (['paper', 'purpur', 'folia', 'velocity'].includes(t)) return 'plugins'
   return null
})

async function saveAddonsMeta() {
   try {
      const folder = serverFolderName.value
      const path = `MineDash/servers/${folder}/addons.json`
      await writeTextFile(path, JSON.stringify(installedAddonsMeta.value, null, 2), { baseDir: BaseDirectory.Document })
   } catch (e) {
      console.error('Failed to save addons meta', e)
   }
}

async function loadAddons() {
   if (!addonsFolder.value) return
   loadingAddons.value = true
   addons.value = []
   try {
      const folder = serverFolderName.value
      const path = `MineDash/servers/${folder}/${addonsFolder.value}`
      const metaPath = `MineDash/servers/${folder}/addons.json`
      
      // Load Meta
      if (await exists(metaPath, { baseDir: BaseDirectory.Document })) {
         const content = await readTextFile(metaPath, { baseDir: BaseDirectory.Document })
         installedAddonsMeta.value = JSON.parse(content)
      } else {
         installedAddonsMeta.value = {}
      }

      if (!(await exists(path, { baseDir: BaseDirectory.Document }))) {
         await mkdir(path, { baseDir: BaseDirectory.Document, recursive: true })
      }
      
      const entries = await readDir(path, { baseDir: BaseDirectory.Document })
      
      addons.value = entries
         .filter(e => e.isFile && (e.name.endsWith('.jar') || e.name.endsWith('.jar.disabled')))
         .map(e => {
             const enabled = !e.name.endsWith('.disabled')
             const meta = installedAddonsMeta.value[e.name]
             if (meta) {
                 return {
                     fileName: e.name,
                     title: meta.title,
                     icon: meta.icon,
                     slug: meta.slug,
                     versionId: meta.versionId,
                     source: 'modrinth',
                     enabled
                 }
             }
             return {
                 fileName: e.name,
                 title: e.name.replace('.jar.disabled', '.jar'),
                 source: 'local',
                 enabled
             }
         })
         
      checkForUpdates()
   } catch (e) {
      console.error('Failed to load addons', e)
   } finally {
      loadingAddons.value = false
   }
}

async function handleDrop(e: DragEvent) {
   if (!e.dataTransfer?.files) return
   
   const files = Array.from(e.dataTransfer.files)
   for (const file of files) {
      if (file.name.endsWith('.jar')) {
         const buffer = await file.arrayBuffer()
         const targetPath = `MineDash/servers/${serverFolderName.value}/${addonsFolder.value}/${file.name}`
         await writeFile(targetPath, new Uint8Array(buffer), { baseDir: BaseDirectory.Document })
      }
   }
   loadAddons()
}

watch(addonsFolder, (newVal) => {
   if (newVal) loadAddons()
})

async function searchModrinth() {
   // Allow empty query if category is selected (browsing)
   if (!modrinthQuery.value && !selectedCategory.value) {
       // If mostly empty, maybe show popular? For now just return or specific behavior.
       // actually Modrinth allows empty query with facets.
   }

   searchingModrinth.value = true
   modrinthResults.value = []
   try {
      const serverVersion = server.value.version
      const serverType = server.value.type
      
      // Loader mapping
      let loaders: string[] = []
      if (['fabric', 'quilt'].includes(serverType)) loaders = ['fabric', 'quilt']
      else if (['forge'].includes(serverType)) loaders = ['forge']
      else if (['neoforge'].includes(serverType)) loaders = ['neoforge']
      else if (['velocity'].includes(serverType)) loaders = ['velocity']
      else if (['paper', 'purpur', 'spigot'].includes(serverType)) loaders = ['paper', 'purpur', 'spigot', 'bukkit']

      // Construct facets
      // [[version], [loader]] -> AND logic
      const facets = []
      
      // Version constraint
      if (serverVersion) facets.push(`["versions:${serverVersion}"]`)
      
      // Loader constraint (OR logic within)
      if (loaders.length > 0) {
          const loaderFacets = loaders.map(l => `"categories:${l}"`).join(',')
          facets.push(`[${loaderFacets}]`) 
      }
      
      // Project type constraint (mod or plugin)
      const typeFacet = addonsFolder.value === 'mods' ? '"project_type:mod"' : '"project_type:plugin"'
      facets.push(`[${typeFacet}]`)

      // User selected category filter
      if (selectedCategory.value) {
          facets.push(`["categories:${selectedCategory.value}"]`)
      }

      const facetsStr = `[${facets.join(',')}]`

      console.log('facetsStr:', facetsStr)
      
      const res = await fetch(`https://api.modrinth.com/v2/search?query=${encodeURIComponent(modrinthQuery.value)}&facets=${facetsStr}&limit=20`)
      const data = await res.json()
      modrinthResults.value = data.hits || []
   } catch (e) {
      console.error('Modrinth search failed', e)
   } finally {
      searchingModrinth.value = false
   }
}

async function installFromModrinth(project: any) {
   try {
       const serverVersion = server.value.version
       const serverType = server.value.type

       // Map server type to modrinth loader format for /version endpoint
       let loaders: string[] = []
       if (serverType === 'fabric') loaders = ['fabric']
       else if (serverType === 'forge') loaders = ['forge']
       else if (serverType === 'neoforge') loaders = ['neoforge']
       else if (serverType === 'paper' || serverType === 'purpur') loaders = ['paper', 'bukkit', 'spigot']
       else if (serverType === 'velocity') loaders = ['velocity']
       
       const params = new URLSearchParams()
       if (loaders.length) params.append('loaders', JSON.stringify(loaders))
       if (serverVersion) params.append('game_versions', JSON.stringify([serverVersion]))

       const res = await fetch(`https://api.modrinth.com/v2/project/${project.slug}/version?${params.toString()}`)
       const versions = await res.json()
       
       if (!versions || versions.length === 0) {
          console.warn('No compatible version found')
          return
       }
       
       const validVersion = versions[0]
       const file = validVersion.files.find((f: any) => f.primary) || validVersion.files[0]
       
       if (file) {
          const downloadUrl = file.url
          const fileName = file.filename
          
          await downloadAddon(downloadUrl, fileName)
          
          // Save Metadata
          installedAddonsMeta.value[fileName] = {
              title: project.title,
              icon: project.icon_url,
              slug: project.slug
          }
          await saveAddonsMeta()
          await loadAddons()
       }
   } catch (e) {
      console.error('Install failed', e)
   }
}

async function downloadAddon(url: string, fileName: string) {
   const folder = serverFolderName.value
   const targetPath = `MineDash/servers/${folder}/${addonsFolder.value}/${fileName}`
   
   const res = await fetch(url)
   const buffer = await res.arrayBuffer()
   
   await writeFile(targetPath, new Uint8Array(buffer), { baseDir: BaseDirectory.Document })
   // Note: loadAddons is called by caller usually, or we can leave it here if we want immediate feedback for simple downloads.
   // But to avoid double refresh with meta, caller handles it.
}

async function deleteAddon(fileName: string) {
   try {
      const folder = serverFolderName.value
      const path = `MineDash/servers/${folder}/${addonsFolder.value}/${fileName}`
      await remove(path, { baseDir: BaseDirectory.Document })
      
      if (installedAddonsMeta.value[fileName]) {
          delete installedAddonsMeta.value[fileName]
          await saveAddonsMeta()
      }
      
      loadAddons()
   } catch (e) { console.error('Delete failed', e) }
}

// Watch for tab change to load addons
watch(() => server.value, () => {
   // if tab is addons? 
})
// Actually we can just load on mount if specific tab active or lazy load.

// --- File Manager Logic ---
const fileCurrentPath = ref('')
const serverFiles = ref<any[]>([])
const loadingFiles = ref(false)

async function loadFiles(relativePath = '') {
    loadingFiles.value = true
    try {
        const folder = serverFolderName.value
        // If root, path is empty. If subdir, join.
        // relativePath is like "logs" or "world/stats"
        // Target full path: Documents/MineDash/servers/{folder}/{relativePath}
        
        // Remove leading slash if present
        if (relativePath.startsWith('/')) relativePath = relativePath.substring(1)
        
        fileCurrentPath.value = relativePath
        
        // Construct target path for reading
        const targetDir = relativePath 
            ? `MineDash/servers/${folder}/${relativePath}`
            : `MineDash/servers/${folder}`
            
        const entries = await readDir(targetDir, { baseDir: BaseDirectory.Document })
        
        // Sort: Directories first, then files. Alphabetical.
        serverFiles.value = entries.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1
            if (!a.isDirectory && b.isDirectory) return 1
            return a.name.localeCompare(b.name)
        })
        
    } catch (e) {
        console.error('Failed to load files', e)
        serverFiles.value = []
    } finally {
        loadingFiles.value = false
    }
}

async function navigateFile(entry: any) {
    if (entry.isDirectory) {
        const newPath = fileCurrentPath.value 
            ? `${fileCurrentPath.value}/${entry.name}` 
            : entry.name
        loadFiles(newPath)
    }
}

async function navigateUp() {
    if (!fileCurrentPath.value) return
    const parts = fileCurrentPath.value.split('/')
    parts.pop()
    const newPath = parts.join('/')
    loadFiles(newPath)
}

async function deleteFileEntry(entry: any) {
    if (!confirm(`Are you sure you want to delete ${entry.name}?`)) return
    
    try {
        const folder = serverFolderName.value
        const relative = fileCurrentPath.value 
            ? `${fileCurrentPath.value}/${entry.name}` 
            : entry.name
            
        const targetPath = `MineDash/servers/${folder}/${relative}`
        await remove(targetPath, { baseDir: BaseDirectory.Document, recursive: entry.isDirectory })
        
        // Refresh
        loadFiles(fileCurrentPath.value)
    } catch (e) {
        console.error('Failed to delete file', e)
        alert('Failed to delete file: ' + e)
    }
}

async function openServerFolder() {
    try {
        const folder = serverFolderName.value
        const relative = fileCurrentPath.value 
            ? `MineDash/servers/${folder}/${fileCurrentPath.value}`
            : `MineDash/servers/${folder}`
            
        const docDir = await documentDir()
        const fullPath = await join(docDir, relative)
                
        // Use cwd option to avoid path escaping issues in arguments
        // 'start .' opens the current directory
        const command = Command.create('run-bat', ['/C', 'start .'], { cwd: fullPath })
        await command.spawn()
        
    } catch (e) {
        console.error('Failed to open folder', e)
        consoleLines.value.push(`Failed to open folder: ${e}`)
    }
}

// Watch tab change to load files if needed - simplified, just load when tab is active or lazy
// We'll add a watcher for the active tab later or just load once

const tabs = computed(() => {
    const allTabs = [
        { label: 'Console', icon: 'i-lucide-terminal', value: 'console', slot: 'console' as const },
        { label: 'Settings', icon: 'i-lucide-settings-2', value: 'settings', slot: 'settings' as const },
        { label: 'Mods & Plugins', icon: 'i-lucide-package', value: 'addons', slot: 'addons' as const },
        { label: 'Files', icon: 'i-lucide-folder-open', value: 'files', slot: 'files' as const }
    ]
    
    // Hide Addons tab if not supported (addonsFolder is null for vanilla/bedrock)
    if (!addonsFolder.value) {
        return allTabs.filter(t => t.value !== 'addons')
    }
    
    return allTabs
})

const selectedTab = ref('console')

watch(selectedTab, (index) => {
   const tab = selectedTab.value

   if (!tab) return
   
   if (tab === 'files' && serverFiles.value.length === 0) {
      loadFiles()
   }
   if (tab === 'addons' && !addons.value.length) {
      loadAddons()
   }
})


// --- Initialization ---

onMounted(async () => {
   selectedTab.value = 'console' // Ensure Console is selected by default
   await loadData()
})

async function loadData() {
   loading.value = true
   try {
      const folder = serverFolderName.value // e.g., "myserver-xyz789"
      
      // 1. Load server.json
      try {
         // Using plain path string construction because join from fs plugin was deprecated/moved
         const metaPath = `MineDash/servers/${folder}/server.json`
         const metaContent = await readTextFile(metaPath, { baseDir: BaseDirectory.Document })
         server.value = JSON.parse(metaContent)
         serverName.value = server.value.name || ''

         // Load global settings for defaults
         let globalSettings = { memory: 4, path: 'java', flags: '' }
         try {
            const globalContent = await readTextFile('MineDash/settings.json', { baseDir: BaseDirectory.Document })
            const gData = JSON.parse(globalContent)
            if (gData) {
               globalSettings = { ...globalSettings, ...gData, memory: gData.defaultMemory, flags: gData.defaultFlags }
            }
         } catch(e) { /* ignore */ }

         // Load saved settings if exist, else use globals
         if (server.value.javaSettings) {
             javaSettings.memory = server.value.javaSettings.memory ?? globalSettings.memory
             javaSettings.path = server.value.javaSettings.path ?? ( globalSettings.path || 'java' )
             javaSettings.flags = server.value.javaSettings.flags ?? globalSettings.flags
         } else {
             javaSettings.memory = globalSettings.memory
             javaSettings.path = globalSettings.path || 'java'
             javaSettings.flags = globalSettings.flags
         }
      } catch (e) {
         console.error('Failed to load server.json', e)
      }

      // 2. Load server.properties
      try {
         const propsPath = `MineDash/servers/${folder}/server.properties`
         const propsContent = await readTextFile(propsPath, { baseDir: BaseDirectory.Document })
         rawProperties.value = propsContent
         parsedProperties.value = parseProperties(propsContent)
      } catch (e) {
         console.log('No server.properties found (maybe not started yet?)')
         // Populate with defaults if empty so user can edit before start
         parsedProperties.value = getDefaultProperties()
      }

   } catch (e) {
      console.error('Error loading server data', e)
   } finally {
      loading.value = false
   }
}

// --- Properties Logic ---

function parseProperties(content: string) {
   const props: Record<string, any> = {}
   content.split('\n').forEach(line => {
      line = line.trim()
      if (!line || line.startsWith('#')) return
      const [key, ...rest] = line.split('=')
      if (key) {
         props[key.trim()] = rest.join('=').trim()
      }
   })
   return props
}

function getDefaultProperties() {
   // Minimal set to ensure UI shows something useful
   return {
      'server-port': '25565',
      'gamemode': 'survival',
      'difficulty': 'easy',
      'max-players': '20',
      'online-mode': 'true',
      'motd': 'A Minecraft Server'
   }
}

// Property Definitions for UI Grouping
const propertyDefinitions = {
   'gamemode': { type: 'select', options: ['survival', 'creative', 'adventure', 'spectator'], group: 'Gameplay' },
   'difficulty': { type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'], group: 'Gameplay' },
   'pvp': { type: 'boolean', group: 'Gameplay' },
   'hardcore': { type: 'boolean', group: 'Gameplay' },
   'enable-command-block': { type: 'boolean', group: 'Gameplay' },
   'allow-flight': { type: 'boolean', group: 'Gameplay' },
   
   'server-port': { type: 'number', group: 'Network' },
   'max-players': { type: 'number', group: 'Network' },
   'online-mode': { type: 'boolean', group: 'Network' },
   'view-distance': { type: 'number', group: 'Performance' },
   'simulation-distance': { type: 'number', group: 'Performance' },
   
   'motd': { type: 'text', group: 'General' },
   'level-name': { type: 'text', group: 'General' },
   'level-seed': { type: 'text', group: 'General' },
}

// Computed for Search & Grouping
const groupedProperties = computed(() => {
   const query = propsSearch.value.toLowerCase()
   const groups: Record<string, any[]> = {}
   
   // Default group
   groups['Advanced'] = []
   
   Object.entries(parsedProperties.value).forEach(([key, val]) => {
      if (query && !key.toLowerCase().includes(query)) return

      const def = propertyDefinitions[key as keyof typeof propertyDefinitions]
      const type = def?.type || inferType(val)
      const group = def?.group || 'Advanced'
      
      // Transform value for UI (bool string -> bool)
      let uiValue: any = val
      if (type === 'boolean') uiValue = val === 'true'
      
      const propObj = {
         key,
         value: uiValue, // We need to sync this back to string on save
         type,
         options: def?.options
      }
      
      if (!groups[group]) groups[group] = []
      groups[group].push(propObj)
   })
   
   // Remove empty groups
   Object.keys(groups).forEach(k => {
      if (groups[k].length === 0) delete groups[k]
   })
   
   return groups
})

const accordionItems = computed(() => {
   // Order: General, Gameplay, Network, Performance, Advanced
   const order = ['General', 'Gameplay', 'Network', 'Performance', 'Advanced']
   const existingGroups = Object.keys(groupedProperties.value)
   const sorted = existingGroups.sort((a, b) => {
      const ia = order.indexOf(a)
      const ib = order.indexOf(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
   })
   
   return sorted.map(group => ({
      label: group,
      defaultOpen: group !== 'Advanced',
      properties: groupedProperties.value[group]
   }))
})

function inferType(val: string) {
   if (val === 'true' || val === 'false') return 'boolean'
   if (!isNaN(Number(val)) && val.trim() !== '') return 'number'
   return 'text'
}

function formatPropLabel(key: string) {
   return key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getPropertyValue(key: string): string {
   return parsedProperties.value[key] || ''
}

function updateProperty(key: string, value: any) {
   // Convert boolean back to string 'true'/'false'
   // Keep numbers/strings as is
   let strVal = String(value)
   parsedProperties.value[key] = strVal
}

// --- Saving ---

async function saveAllSettings() {
   saving.value = true
   try {
      const folder = serverFolderName.value
      
      // 1. Save server.json (Name & Java Settings)
      server.value.javaSettings = { ...javaSettings }
      server.value.name = serverName.value
      const metaPath = `MineDash/servers/${folder}/server.json`
      await writeTextFile(metaPath, JSON.stringify(server.value, null, 2), { baseDir: BaseDirectory.Document })

      // 2. Save server.properties
      let content = '#Minecraft server properties\n#Generated by MineDash\n'
      Object.entries(parsedProperties.value).forEach(([key, val]) => {
         content += `${key}=${val}\n`
      })
      const propsPath = `MineDash/servers/${folder}/server.properties`
      await writeTextFile(propsPath, content, { baseDir: BaseDirectory.Document })
      
      // Refresh raw properties view
      rawProperties.value = content

      // 3. Refresh global server list (Pinia) - NOW calls after properties are saved so it reads new port
      const serversStore = useServersStore()
      await serversStore.refreshServers()

      // Show toast (mock)
      console.log('All settings saved')
   } catch (e) {
      console.error('Failed to save settings', e)
   } finally {
      saving.value = false
   }
}



// --- Server Process Management Functions ---

async function startServer() {
   if (serverStatus.value !== 'offline') return
   
   // 1. Check EULA
   const folder = serverFolderName.value
   const eulaPath = `MineDash/servers/${folder}/eula.txt`
   
   try {
      if (await exists(eulaPath, { baseDir: BaseDirectory.Document })) {
          const content = await readTextFile(eulaPath, { baseDir: BaseDirectory.Document })
          if (!content.includes('eula=true')) {
              showEulaModal.value = true
              return
          }
      } else {
          showEulaModal.value = true
          return
      }
   } catch (e) {
      console.error('EULA check failed', e)
      showEulaModal.value = true
      return
   }

   serverStatus.value = 'starting'
   consoleLines.value.length = 0
   consoleLines.value.push('Starting server...')
   
   try {
      const folder = serverFolderName.value
      const serverPath = `MineDash/servers/${folder}`
      const fullServerPath = await join(await documentDir(), 'MineDash', 'servers', folder)
      
      // Detect platform
      const isWindows = navigator.userAgent.includes('Windows')
      
      // Build Java command parts
      const javaPath = 'java'
      const jarPath = await join(fullServerPath, 'server.jar')
      
      // Build args array
      const javaArgs: string[] = []
      if (javaSettings.memory) {
         javaArgs.push(`-Xmx${javaSettings.memory}G`, '-Xms1G')
      }
      if (javaSettings.flags) {
         javaArgs.push(...javaSettings.flags.split(' ').filter((f: string) => f.trim()))
      }
      // Use -Duser.dir to set working directory for server files (worlds, plugins, etc)
      javaArgs.push(`-Duser.dir=${fullServerPath}`)
      javaArgs.push('-jar', 'server.jar', '-nogui')
      
      // Generate start script for manual use
      const fullJavaCmd = `"${javaPath}" ${javaArgs.join(' ')}`
      const scriptContent = isWindows 
         ? `@echo off\ncd /d "${fullServerPath}"\n${fullJavaCmd}\npause\n`
         : `#!/bin/bash\ncd "${fullServerPath}"\n${fullJavaCmd}\n`
      const scriptPath = `${serverPath}/${isWindows ? 'start.bat' : 'start.sh'}`
      await writeTextFile(scriptPath, scriptContent, { baseDir: BaseDirectory.Document })
      consoleLines.value.push(`Generated ${isWindows ? 'start.bat' : 'start.sh'}`)
      
      consoleLines.value.push(`Executing: java ${javaArgs.join(' ')}`)
      
      // Run Java directly using run-java
      const cmd = Command.create('run-java', javaArgs, {cwd: fullServerPath})
      
      cmd.on('close', (data) => {
         consoleLines.value.push(`Server stopped with code ${data.code}`)
         serverStatus.value = 'offline'
         serverProcess.value = null
      })
      
      cmd.on('error', (error) => {
         consoleLines.value.push(`Error: ${error}`)
         serverStatus.value = 'offline'
      })
      
      cmd.stdout.on('data', (line) => {
         consoleLines.value.push(line)
         if (line.includes('Done') && line.includes('!')) {
            serverStatus.value = 'online'
         }
      })
      
      cmd.stderr.on('data', (line) => {
         consoleLines.value.push(line)
      })
      
      const child = await cmd.spawn()
      serverProcess.value = child
        
   } catch (e) {
      console.error('Failed to start server', e)
      consoleLines.value.push(`Failed to start: ${e}`)
      serverStatus.value = 'offline'
   }
}
async function killServer() {
   if (serverProcess.value) {
      await serverProcess.value.kill()
      consoleLines.value.push('Server killed by user.')
   }
}

async function acceptEula() {
   try {
      const folder = serverFolderName.value
      const eulaPath = `MineDash/servers/${folder}/eula.txt`
      await writeTextFile(eulaPath, 'eula=true', { baseDir: BaseDirectory.Document })
      showEulaModal.value = false
      startServer()
   } catch (e) {
      console.error('Failed to accept EULA', e)
   }
}


async function stopServer() {
   if (serverStatus.value === 'offline' || !serverProcess.value) return
   
   serverStatus.value = 'stopping'
   try {
      await serverProcess.value.write('stop\n')
   } catch (e) {
      console.error('Failed to send stop command', e)
   }
}

const consoleInput = ref('')

const showDeleteModal = ref(false)
const deleteConfirmation = ref('')
const deletingServer = ref(false)

function openDeleteModal() {
   showDeleteModal.value = true
   deleteConfirmation.value = ''
}

async function confirmDeleteServer() {
   const folder = serverFolderName.value
   
   if (deleteConfirmation.value !== folder) {
      return // Button should be disabled anyway
   }

   deletingServer.value = true
   try {
      if (serverStatus.value !== 'offline' && serverProcess.value) {
         await stopServer()
         // Wait a bit for proper stop
         await new Promise(r => setTimeout(r, 2000))
      }

      const path = `MineDash/servers/${folder}`
      await remove(path, { baseDir: BaseDirectory.Document, recursive: true })
      
      showDeleteModal.value = false
      
      // Refresh servers list in sidebar
      const serversStore = useServersStore()
      await serversStore.refreshServers()
      
      navigateTo('/')
   } catch (e) {
      console.error('Failed to delete server', e)
      // For actual errors, an alert or toast is still okay as fallback, but let's just log for now
      alert(`Failed to delete server: ${e}`) 
   } finally {
      deletingServer.value = false
   }
}

async function sendCommand() {
   if (!consoleInput.value) return
   if (!serverProcess.value) {
      consoleLines.value.push('Error: No server process')
      return
   }

   try {
      consoleLines.value.push(`> ${consoleInput.value}`)
      await serverProcess.value.write(consoleInput.value + '\n')
      consoleInput.value = ''
   } catch(e) {
      console.error('Failed to send command', e)
      consoleLines.value.push(`Failed to send command: ${e}`)
   }
}

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #1f2937; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #374151; 
  border-radius: 4px;
}
</style>
