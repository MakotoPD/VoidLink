<template>
  <div>
    <!-- Header -->
    <div data-tauri-drag-region class="page-head" style="margin-bottom:20px; align-items:center">
      <div class="page-head-left">
        <p class="eyebrow">Create Server</p>
        <h1 class="page-title" style="font-size:26px; line-height:1.2">{{ stepTitles[step - 1] }}</h1>
        <p class="page-sub" style="margin-top:4px; font-size:12px">{{ stepDescriptions[step - 1] }}</p>
      </div>
      <button class="btn ghost icon-only" @click="goBack" title="Back" style="flex-shrink:0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    </div>

    <!-- Wizard Steps -->
    <div class="wizard-steps" style="margin-bottom:20px">
      <template v-for="(title, i) in stepTitles" :key="i">
        <div
          class="wz-step"
          :class="{ done: step > i + 1, active: step === i + 1 }"
          @click="i < step - 1 && (step = i + 1)"
        >
          <div class="wz-num">
            <svg v-if="step > i + 1" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="wz-label">{{ title }}</span>
        </div>
        <div v-if="i < stepTitles.length - 1" class="wz-line" :class="{ done: step > i + 1 }"></div>
      </template>
    </div>

    <!-- Wizard Body -->
    <div class="wizard-body">

      <!-- Step 1: Engine Selection -->
      <div v-if="step === 1" class="engine-grid">
        <div
          v-for="type in serverTypes"
          :key="type.id"
          class="engine-card"
          :class="{ active: selectedType === type.id }"
          @click="selectType(type.id)"
        >
          <span v-if="type.badge === 'recommended'" class="badge-recommended">Recommended</span>
          <span v-else-if="type.badge === 'popular'" class="badge-popular">Popular</span>
          <span v-else-if="type.badge === 'new'" class="badge-new">New</span>

          <div class="eng-icon">
            <UIcon :name="type.icon" class="w-6 h-6" />
          </div>
          <div class="eng-name">{{ type.name }}</div>
          <div class="eng-desc">{{ type.description }}</div>

          <div v-if="type.id !== 'custom'" class="eng-features">
            <span :class="type.supportsPlugins ? 'feat-on' : 'feat-off'">Plugins</span>
            <span :class="type.supportsMods ? 'feat-on' : 'feat-off'">Mods</span>
          </div>
        </div>
      </div>

      <!-- Step 2: Version or Modpack Selection -->
      <div v-else-if="step === 2">

        <!-- Modpack Browser -->
        <div v-if="selectedType === 'modpack'" class="mx-auto" style="display:flex; flex-direction:column; gap:16px">
          <div style="display:flex; gap:2px; background:var(--bg-2); border:1px solid var(--line-1); border-radius:10px; padding:3px; max-width:280px">
             <div
                style="flex:1; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; cursor:pointer; text-align:center; transition:all 0.1s"
                :style="!customModpackPath ? 'background:var(--accent); color:#07090c' : 'color:var(--ink-2)'"
                @click="customModpackPath = null; selectedModpack = null"
             >Browse Modrinth</div>
             <div
                style="flex:1; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; cursor:pointer; text-align:center; transition:all 0.1s"
                :style="customModpackPath ? 'background:var(--accent); color:#07090c' : 'color:var(--ink-2)'"
                @click="selectModpackFile"
             >Import File</div>
          </div>

          <!-- File Upload State -->
          <div v-if="customModpackPath" class="card card-pad" style="text-align:center; border-style:dashed; background:var(--accent-soft)">
             <UIcon name="i-lucide-file-archive" class="w-10 h-10" style="color:var(--accent); margin-bottom:12px" />
             <div style="font-size:15px; font-weight:500; color:var(--ink-0); margin-bottom:6px">{{ customModpackName }}</div>
             <div style="font-size:11px; color:var(--ink-3); word-break:break-all; margin-bottom:16px; font-family:'Geist Mono',monospace">{{ customModpackPath }}</div>
             <button class="btn ghost sm" @click="selectModpackFile">Choose Different File</button>
          </div>

          <!-- Search & Filter -->
          <div v-if="!customModpackPath" style="display:flex; flex-direction:column; gap:12px">
            <div class="card card-pad" style="display:flex; flex-wrap:wrap; gap:10px; align-items:center">
              <UInput
                v-model="modpackSearch"
                icon="i-lucide-search"
                placeholder="Search for modpacks..."
                style="flex:1; min-width:200px"
                size="lg"
                color="neutral"
                variant="outline"
              >
                <template #trailing>
                  <UButton v-if="modpackSearch" color="neutral" variant="link" icon="i-lucide-x" :padded="false" @click="modpackSearch = ''" />
                </template>
              </UInput>
              <div style="display:flex; gap:8px; flex-wrap:wrap">
                <USelectMenu v-model="modpackVersion" :items="availableMcVersions" placeholder="MC Version" searchable searchable-placeholder="Search version" size="lg" color="neutral" variant="outline" style="min-width:130px" />
                <USelectMenu v-model="modpackLoader" :items="availableLoaders" placeholder="Loader" size="lg" color="neutral" variant="outline" style="min-width:110px">
                  <template #label>
                    <span v-if="modpackLoader" class="capitalize">{{ modpackLoader }}</span>
                    <span v-else style="color:var(--ink-3)">Loader</span>
                  </template>
                  <template #option="{ option }"><span class="capitalize">{{ option }}</span></template>
                </USelectMenu>
                <USelectMenu :items="['Relevance', 'Downloads', 'Newest']" v-model="modpackSort" size="lg" color="neutral" variant="outline" style="min-width:110px" />
              </div>
            </div>
            <div style="font-size:13px; color:var(--ink-3)">Found <span style="color:var(--ink-0); font-weight:500">{{ modpackTotal.toLocaleString() }}</span> modpacks</div>
          </div>

          <!-- Loading -->
          <div v-if="modpackLoading" style="display:flex; flex-direction:column; align-items:center; padding:60px 0; gap:12px; color:var(--ink-3)">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" style="color:var(--accent)" />
            <span style="font-size:13px">Searching modpacks...</span>
          </div>

          <!-- Results Grid -->
          <div v-else-if="!customModpackPath" class="grid-2">
            <div
              v-for="pack in modpacksList"
              :key="pack.project_id"
              @click="openModpackDetails(pack)"
              class="card"
              style="display:flex; gap:14px; padding:14px; cursor:pointer; transition:all 0.12s; position:relative; overflow:hidden"
              :style="selectedModpack?.id === pack.project_id ? 'border-color:var(--accent-line); background:var(--bg-2)' : ''"
            >
              <img :src="pack.icon_url || 'https://cdn.modrinth.com/placeholder.svg'" style="width:72px; height:72px; border-radius:10px; object-fit:cover; flex-shrink:0; background:var(--bg-3)" loading="lazy" />
              <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:4px">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px">
                  <div style="font-size:14px; font-weight:500; color:var(--ink-0); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">{{ pack.title }}</div>
                  <span v-if="pack.loaders?.length" class="pill" style="flex-shrink:0; text-transform:capitalize">{{ pack.loaders[0] }}</span>
                </div>
                <div style="font-size:12px; color:var(--ink-2); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden">{{ pack.description }}</div>
                <div style="display:flex; align-items:center; gap:12px; font-size:11px; color:var(--ink-3); font-family:'Geist Mono',monospace; margin-top:auto">
                  <span style="display:flex; align-items:center; gap:4px"><UIcon name="i-lucide-download" class="w-3 h-3" /> {{ (pack.downloads || 0).toLocaleString() }}</span>
                  <div style="flex:1"></div>
                  <span v-for="ver in (pack.game_versions || []).slice(0, 2)" :key="ver" class="tag-mono">{{ ver }}</span>
                  <span v-if="(pack.game_versions || []).length > 2" style="color:var(--ink-4)">+{{ pack.game_versions.length - 2 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1 && !customModpackPath" style="display:flex; justify-content:center; align-items:center; gap:8px; padding-top:8px">
            <UButton :disabled="modpackPage === 0" @click="goToPage(modpackPage)" color="neutral" variant="ghost" icon="i-lucide-chevron-left" size="md" />
            <div style="display:flex; gap:4px; background:var(--bg-2); border:1px solid var(--line-1); border-radius:8px; padding:4px">
              <template v-for="(p, i) in visiblePages" :key="i">
                <div v-if="p === '...'" style="width:28px; height:28px; display:grid; place-items:center; color:var(--ink-3); font-size:12px">…</div>
                <button v-else @click="goToPage(p as number)" :class="p === modpackPage + 1 ? 'btn sm' : 'btn ghost sm'" style="min-width:28px; justify-content:center">{{ p }}</button>
              </template>
            </div>
            <UButton :disabled="modpackPage >= totalPages - 1" @click="goToPage(modpackPage + 2)" color="neutral" variant="ghost" icon="i-lucide-chevron-right" size="md" />
          </div>
        </div>

        <!-- Classic Version / Custom JAR -->
        <div v-else class=" mx-auto" style="display:flex; flex-direction:column; gap:16px; max-width:560px">

          <!-- Selected Engine Summary -->
          <div class="card card-pad" style="display:flex; align-items:center; gap:16px">
            <div class="eng-icon" style="margin-bottom:0; flex-shrink:0">
              <UIcon :name="selectedTypeData?.icon || 'i-lucide-box'" class="w-6 h-6" />
            </div>
            <div style="flex:1; min-width:0">
              <div class="eyebrow" style="margin-bottom:2px">Selected Engine</div>
              <div style="font-size:15px; font-weight:500; color:var(--ink-0)">{{ selectedTypeData?.name }}</div>
              <div style="font-size:12px; color:var(--ink-2); margin-top:2px">{{ selectedTypeData?.description }}</div>
            </div>
            <button class="btn ghost sm" @click="step = 1">Change</button>
          </div>

          <!-- Custom JAR Picker -->
          <div v-if="selectedType === 'custom'" style="display:flex; flex-direction:column; gap:12px">
            <div class="card card-pad" style="display:flex; flex-direction:column; gap:10px">
              <label class="field" style="gap:10px">
                <span style="font-size:12px; color:var(--ink-2); font-weight:500">Server JAR File</span>
                <div
                  style="border:1.5px dashed var(--line-2); border-radius:10px; padding:28px; text-align:center; cursor:pointer; transition:all 0.12s"
                  :style="customJarPath ? 'border-color:var(--ok); background:var(--ok-soft)' : ''"
                  @click="selectJarFile"
                >
                  <div v-if="!customJarPath" style="display:flex; flex-direction:column; align-items:center; gap:8px; color:var(--ink-3)">
                    <UIcon name="i-lucide-upload-cloud" class="w-8 h-8" />
                    <div style="font-size:13px; color:var(--ink-1)">Click to select .jar file</div>
                    <div style="font-size:11px">Spigot, Paper, Fabric, Forge, etc.</div>
                  </div>
                  <div v-else style="display:flex; flex-direction:column; align-items:center; gap:6px">
                    <UIcon name="i-lucide-file-check" class="w-8 h-8" style="color:var(--ok)" />
                    <div style="font-size:13px; font-weight:500; color:var(--ink-0)">{{ customJarName }}</div>
                    <div style="font-size:11px; color:var(--ink-3); font-family:'Geist Mono',monospace; word-break:break-all">{{ customJarPath }}</div>
                    <button class="btn ghost sm" style="margin-top:4px" @click.stop="selectJarFile">Change File</button>
                  </div>
                </div>
              </label>
            </div>

            <div class="card card-pad">
              <div style="font-size:12px; color:var(--ink-2); font-weight:500; margin-bottom:10px">Capabilities</div>
              <div class="grid-2">
                <div class="card card-pad" style="display:flex; align-items:center; justify-content:space-between; gap:8px">
                  <span style="font-size:13px; color:var(--ink-1); display:flex; align-items:center; gap:8px"><UIcon name="i-lucide-toy-brick" class="w-4 h-4" style="color:var(--ink-3)" /> Plugins</span>
                  <USwitch v-model="customSupportsPlugins" color="primary" />
                </div>
                <div class="card card-pad" style="display:flex; align-items:center; justify-content:space-between; gap:8px">
                  <span style="font-size:13px; color:var(--ink-1); display:flex; align-items:center; gap:8px"><UIcon name="i-lucide-puzzle" class="w-4 h-4" style="color:var(--ink-3)" /> Mods</span>
                  <USwitch v-model="customSupportsMods" color="primary" />
                </div>
              </div>
            </div>
          </div>

          <!-- Version Selection -->
          <div v-else class="card card-pad" style="display:flex; flex-direction:column; gap:14px">
            <div style="display:flex; justify-content:space-between; align-items:center">
              <label style="font-size:13px; font-weight:500; color:var(--ink-0)">Game Version</label>
              <div v-if="canToggleSnapshots" style="display:flex; align-items:center; gap:8px; background:var(--bg-2); border:1px solid var(--line-1); border-radius:8px; padding:6px 10px">
                <span style="font-size:11px; color:var(--ink-2)">{{ toggleLabel }}</span>
                <USwitch v-model="includeSnapshots" size="sm" color="primary" />
              </div>
            </div>
            <USelectMenu
              v-model="selectedVersion"
              :items="availableVersions"
              :loading="isLoadingVersions"
              searchable
              searchable-placeholder="Search version..."
              placeholder="Select a version"
              size="xl"
              variant="outline"
              color="neutral"
              class="w-full"
            >
              <template #label>
                <span v-if="selectedVersion" style="display:flex; align-items:center; gap:8px">
                  <span style="width:8px; height:8px; border-radius:50%; background:var(--ok); flex-shrink:0"></span>
                  <span style="font-weight:500; color:var(--ink-0); font-family:'Geist Mono',monospace">{{ selectedVersion }}</span>
                </span>
                <span v-else style="color:var(--ink-3)">Select version...</span>
              </template>
            </USelectMenu>
            <div style="font-size:11px; color:var(--ink-3); display:flex; align-items:flex-start; gap:6px">
              <UIcon name="i-lucide-info" class="w-4 h-4 shrink-0" style="color:var(--accent); margin-top:1px" />
              <span>We automatically fetch the latest stable versions. Toggle snapshots to test upcoming features.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: World Settings -->
      <div v-else-if="step === 3" style="display:flex; flex-direction:column; gap:20px">

        <!-- World Type Grid -->
        <div>
          <div class="eyebrow" style="margin-bottom:12px; display:flex; align-items:center; gap:6px">
            <UIcon name="i-lucide-globe" class="w-4 h-4" style="color:var(--accent)" /> World Type
          </div>
          <div class="grid-4">
            <div
              v-for="wt in worldTypes"
              :key="wt.value"
              class="engine-card"
              :class="{ active: worldType === wt.value }"
              @click="worldType = wt.value"
            >
              <div class="eng-icon" style="margin-bottom:8px"><UIcon :name="wt.icon" class="w-5 h-5" /></div>
              <div class="eng-name" style="font-size:13px">{{ wt.label }}</div>
              <div class="eng-desc" style="font-size:11px">{{ wt.description }}</div>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
          <!-- World Seed -->
          <div class="card card-pad" style="display:flex; flex-direction:column; gap:12px">
            <div style="display:flex; justify-content:space-between; align-items:center">
              <div class="section-title"><UIcon name="i-lucide-settings-2" class="w-4 h-4" style="color:var(--accent)" /> World Seed</div>
              <button class="btn ghost sm" @click="worldSeed = Math.floor(Math.random() * 9999999999).toString()">
                <UIcon name="i-lucide-shuffle" class="w-3 h-3" /> Randomize
              </button>
            </div>
            <input v-model="worldSeed" class="input mono" placeholder="Leave blank for random seed" />
            <span class="field" style="gap:0"><span class="hint">Same seed = same world layout.</span></span>
          </div>

          <!-- Game Rules -->
          <div class="card" style="overflow:hidden">
            <div class="card-head"><h4><UIcon name="i-lucide-sparkles" class="w-4 h-4" style="color:var(--accent)" /> Game Rules</h4></div>
            <div class="card-pad" style="display:flex; flex-direction:column; gap:12px">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:12px">
                <div style="display:flex; flex-direction:column; gap:2px">
                  <span style="font-size:13px; color:var(--ink-0)">Generate Structures</span>
                  <span style="font-size:11px; color:var(--ink-3)">Villages, dungeons, strongholds</span>
                </div>
                <USwitch v-model="generateStructures" color="primary" />
              </div>
              <div style="height:1px; background:var(--line-1)"></div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:12px">
                <div style="display:flex; flex-direction:column; gap:2px">
                  <span style="font-size:13px; color:var(--ink-0)">Hardcore Mode</span>
                  <span style="font-size:11px; color:var(--ink-3)">One life only. World deleted on death.</span>
                </div>
                <USwitch v-model="hardcoreMode" color="primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Server Settings -->
      <div v-else-if="step === 4" class=" mx-auto" style="display:flex; flex-direction:column; gap:16px; max-width:560px">

        <!-- Java Runtime -->
        <div class="card card-pad">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px">
            <div style="display:flex; align-items:center; gap:10px">
              <div class="eng-icon" style="margin-bottom:0; background:rgba(245,158,11,0.12); color:var(--warn)">
                <UIcon name="i-lucide-coffee" class="w-5 h-5" />
              </div>
              <span style="font-size:14px; font-weight:500; color:var(--ink-0)">Java Runtime</span>
            </div>
            <span class="tag-mono">{{ detectedJavaVersion || 'Detecting...' }}</span>
          </div>
          <div
            :style="{
              borderRadius:'8px', padding:'12px', display:'flex', alignItems:'flex-start', gap:'10px', border:'1px solid transparent',
              background: javaCompatibility.title === 'Java Compatible' ? 'var(--ok-soft)' : javaCompatibility.title === 'Java Update Recommended' ? 'var(--warn-soft)' : 'var(--bg-3)',
              color: javaCompatibility.title === 'Java Compatible' ? 'var(--ok)' : javaCompatibility.title === 'Java Update Recommended' ? 'var(--warn)' : 'var(--ink-2)',
              borderColor: javaCompatibility.title === 'Java Compatible' ? 'rgba(52,211,153,0.3)' : javaCompatibility.title === 'Java Update Recommended' ? 'rgba(245,158,11,0.3)' : 'var(--line-1)'
            }"
          >
            <UIcon :name="javaCompatibility.icon" class="w-4 h-4 shrink-0" style="margin-top:1px" />
            <div style="flex:1">
              <div style="font-size:13px; font-weight:500; margin-bottom:2px">{{ javaCompatibility.title }}</div>
              <div style="font-size:11px; line-height:1.5; opacity:0.85">{{ javaCompatibility.message }}</div>
            </div>
            <UButton v-if="!detectedJavaVersion" icon="i-lucide-refresh-cw" size="xs" color="neutral" variant="ghost" :loading="checkingJava" @click="detectJavaVersion" />
          </div>
        </div>

        <!-- Configuration -->
        <div class="card card-pad" style="display:flex; flex-direction:column; gap:20px">
          <div class="section-title"><UIcon name="i-lucide-slider" class="w-4 h-4" style="color:var(--accent)" /> Configuration</div>

          <div class="field">
            <label>Server Name</label>
            <input v-model="serverName" class="input" placeholder="My Awesome Server" />
            <span class="hint">Folder name is generated automatically.</span>
          </div>

          <div class="field" style="border-top:1px solid var(--line-1); padding-top:16px">
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:12px">
              <div>
                <label style="font-size:12px; color:var(--ink-2); font-weight:500; display:flex; align-items:center; gap:6px">
                  <UIcon name="i-lucide-memory-stick" class="w-3.5 h-3.5" style="color:var(--ink-3)" /> RAM Allocation
                </label>
                <span class="hint" style="margin-top:2px">Memory for the server process.</span>
              </div>
              <div style="font-family:'Instrument Serif',serif; font-size:32px; color:var(--accent); line-height:1">
                {{ ramLimit }}<span style="font-family:'Geist',sans-serif; font-size:13px; color:var(--ink-3); margin-left:4px">GB</span>
              </div>
            </div>
            <input type="range" v-model.number="ramLimit" min="1" :max="systemRamGB" step="1" style="width:100%; accent-color:var(--accent); cursor:pointer" />
            <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--ink-3); font-family:'Geist Mono',monospace; margin-top:6px">
              <span>1 GB</span>
              <span style="color:var(--accent)">Rec: 6–8 GB</span>
              <span>{{ systemRamGB }} GB</span>
            </div>
          </div>

          <div class="field" style="border-top:1px solid var(--line-1); padding-top:16px; opacity:0.7">
            <label class="eyebrow" style="font-size:10px">Installation Path</label>
            <input :value="serverPath" class="input mono" readonly style="cursor:default; font-size:11px" />
          </div>
        </div>
      </div>

      <!-- Step 5: Summary -->
      <div v-else-if="step === 5" class=" mx-auto" style="max-width:480px; display:flex; flex-direction:column; gap:16px">
        <div class="card">
          <div class="card-head" style="justify-content:center; flex-direction:column; align-items:center; padding:20px 22px; gap:8px">
            <div style="width:52px; height:52px; border-radius:12px; background:var(--ok-soft); display:grid; place-items:center; border:1px solid rgba(52,211,153,0.3)">
              <UIcon name="i-lucide-rocket" class="w-7 h-7" style="color:var(--ok)" />
            </div>
            <div style="font-family:'Instrument Serif',serif; font-size:22px; color:var(--ink-0)">Ready to Launch</div>
            <div style="font-size:12px; color:var(--ink-3)">Review your configuration before creating the server.</div>
          </div>
          <div class="card-pad">
            <div v-if="selectedType === 'modpack'" class="summary-row">
              <span class="s-label">Modpack</span>
              <span class="s-val" style="color:var(--accent)">{{ selectedModpack?.title }}</span>
            </div>
            <div class="summary-row">
              <span class="s-label">Engine</span>
              <span class="s-val" style="display:flex; align-items:center; gap:6px"><UIcon :name="selectedTypeData?.icon" class="w-3.5 h-3.5" style="color:var(--ink-3)" />{{ selectedTypeData?.name }}</span>
            </div>
            <div class="summary-row">
              <span class="s-label">Version</span>
              <span class="s-val">{{ selectedType === 'custom' ? customJarName : selectedVersion }}</span>
            </div>
            <div class="summary-row">
              <span class="s-label">World Type</span>
              <span class="s-val">{{ worldTypes.find(t => t.value === worldType)?.label }}</span>
            </div>
            <div class="summary-row">
              <span class="s-label">Seed</span>
              <span class="s-val" style="color:var(--ink-2)">{{ worldSeed || 'Random' }}</span>
            </div>
            <div class="summary-row">
              <span class="s-label">Server Name</span>
              <span class="s-val">{{ serverName }}</span>
            </div>
            <div class="summary-row">
              <span class="s-label">RAM</span>
              <span class="s-val">{{ ramLimit }} GB</span>
            </div>
            <div class="summary-row">
              <span class="s-label">Java</span>
              <span class="s-val" style="color:var(--ink-2)">{{ detectedJavaVersion || 'System default' }}</span>
            </div>
          </div>
        </div>

        <div v-if="statusMessage" style="display:flex; align-items:center; gap:10px; padding:12px 16px; background:var(--bg-2); border:1px solid var(--line-1); border-radius:10px; font-size:13px; color:var(--ink-1)">
          <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" style="color:var(--accent); flex-shrink:0" />
          {{ statusMessage }}
        </div>
      </div>

    </div><!-- end wizard-body -->

    <!-- Wizard Footer -->
    <div class="wizard-foot">
      <button v-if="step > 1" class="btn ghost" @click="step--">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <div v-else></div>

      <button v-if="step < 5" class="btn" :disabled="!canContinue" @click="step++">
        Continue
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <button v-else class="btn success" :disabled="!isValid || isCreating" @click="createServer">
        <UIcon v-if="isCreating" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
        <UIcon v-else name="i-lucide-rocket" class="w-4 h-4" />
        {{ isCreating ? 'Creating...' : 'Launch Server' }}
      </button>
    </div>

    <!-- Creation Overlay (modpack) -->
    <div v-if="isCreating && selectedType === 'modpack'" style="position:fixed; inset:0; background:rgba(7,9,12,0.88); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:32px; backdrop-filter:blur(6px)">
      <UIcon name="i-lucide-package" class="w-14 h-14 animate-bounce" style="color:var(--accent); margin-bottom:16px" />
      <div style="font-family:'Instrument Serif',serif; font-size:24px; color:var(--ink-0); margin-bottom:8px">Installing Modpack...</div>
      <div style="font-size:14px; color:var(--ink-2); margin-bottom:32px; max-width:380px; text-align:center">{{ statusMessage }}</div>
      <div style="width:100%; max-width:320px; display:flex; flex-direction:column; gap:8px">
        <UProgress :value="creationProgress" color="primary" indicator />
        <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--ink-3); font-family:'Geist Mono',monospace">
          <span>{{ Math.round(creationProgress) }}%</span>
          <span>Minetools Installer</span>
        </div>
      </div>
    </div>
      <!-- Modpack Detail Modal -->
      <UModal v-model:open="showModpackModal" fullscreen class=" ">

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
                  <UBadge color="neutral" variant="soft" class="capitalize" :ui="{ base: 'rounded-full' }">{{ detailedModpack?.project_type }}</UBadge>
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
          <div class="flex flex-col h-full bg-gray-100 dark:bg-gray-950 text-white">
              <!-- Modal Content (Scrollable) -->
              <div class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    <!-- Left: Description -->
                    <div class="lg:col-span-3">
                      <div v-if="loadingDetails" class="flex justify-center py-20">
                          <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary-500" />
                      </div>
                      <div v-else>
                          <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-black dark:text-white">
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
                      <div class="bg-gray-200 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl p-4">
                          <h3 class="font-bold mb-3 flex items-center gap-2 text-primary-400">
                            <UIcon name="i-lucide-history" class="w-4 h-4" />
                            Select Version
                          </h3>
                          
                          <div class="space-y-4" v-if="modpackVersions.length">
                            <!-- Loader Selector (only if multiple loaders) -->
                            <div v-if="availableModalLoaders.length > 1">
                              <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Loader</label>
                              <USelectMenu
                                  v-model="selectedModalLoader"
                                  :items="availableModalLoaders"
                                  placeholder="All Loaders"
                                  class="w-full capitalize"
                                  :portal="true"
                                  :ui="{ content: 'z-[100]' }"
                              />
                            </div>
                            
                            <!-- Game Version Selector -->
                            <div>
                              <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Minecraft Version</label>
                              <USelectMenu
                                  v-model="selectedModalGameVersion"
                                  :items="availableModalGameVersions"
                                  placeholder="All Versions"
                                  searchable
                                  searchable-placeholder="Search version..."
                                  class="w-full"
                                  :portal="true"
                                  :ui="{ content: 'z-[100]' }"
                              />
                            </div>
                            
                            <!-- Modpack Version Selector -->
                            <div>
                              <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Modpack Version</label>
                              <USelectMenu
                                  v-model="selectedModpackVersion"
                                  :items="filteredModalVersions"
                                  option-attribute="name"
                                  placeholder="Select a version"
                                  class="w-full"
                                  :portal="true"
                                  :ui="{ content: 'z-[100]' }"
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
                            </div>
                            
                            <div v-if="selectedModpackVersion" class="space-y-2 text-xs text-gray-700 dark:text-gray-400 bg-gray-200 dark:bg-gray-950/50 p-3 rounded border border-gray-300 dark:border-gray-800">
                                <div class="flex justify-between">
                                  <span>Minecraft</span>
                                  <span class="text-black dark:text-white">{{ selectedModpackVersion.game_versions?.join(', ') }}</span>
                                </div>
                                <div class="flex justify-between">
                                  <span>Loader</span>
                                  <span class="text-black dark:text-white capitalize">{{ selectedModpackVersion.loaders?.join(', ') }}</span>
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
                                  <span class="text-black dark:text-white">{{ selectedModpackVersion.files?.length || 0 }}</span>
                                </div>
                            </div>
                          </div>
                          <div v-else class="text-gray-500 text-sm">No versions found</div>
                      </div>
                      
                      <!-- Categories -->
                      <div v-if="detailedModpack?.categories?.length" class="bg-gray-200 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl p-4">
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
                      <div v-if="detailedModpack?.license" class="bg-gray-200 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl p-4">
                          <h3 class="font-bold mb-3 flex items-center gap-2 text-primary-400">
                            <UIcon name="i-lucide-scale" class="w-4 h-4" />
                            License
                          </h3>
                          <p class="text-sm text-gray-700 dark:text-gray-300">{{ detailedModpack.license.name || detailedModpack.license.id }}</p>
                      </div>

                    </div>
                </div>
              </div>

              <!-- Footer Actions -->
              <div class="p-4 border-t border-gray-300 dark:border-gray-800 bg-gray-200 dark:bg-gray-900 flex justify-end gap-3 rounded-b-lg">
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
const customJarName = ref('')
const customSupportsPlugins = ref(false)
const customSupportsMods = ref(false)

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
import { useJava } from '~/composables/useJava'
const { installations, scanJava, getJavaForVersion } = useJava()

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

// Cascading filter state for modal
const selectedModalLoader = ref<string | undefined>(undefined)
const selectedModalGameVersion = ref<string | undefined>(undefined)

watch(selectedModalLoader, () => {
  selectedModalGameVersion.value = undefined
  selectedModpackVersion.value = null
})

watch(selectedModalGameVersion, () => {
  selectedModpackVersion.value = null
})

// Computed: unique loaders from all versions
const availableModalLoaders = computed(() => {
  const loaders = new Set<string>()
  modpackVersions.value.forEach((v: any) => {
    v.loaders?.forEach((l: string) => loaders.add(l))
  })
  return Array.from(loaders).sort()
})

// Computed: unique game versions, filtered by selected loader
const availableModalGameVersions = computed(() => {
  let versions = modpackVersions.value
  if (selectedModalLoader.value) {
    versions = versions.filter((v: any) => 
      v.loaders?.includes(selectedModalLoader.value)
    )
  }
  const gameVersions = new Set<string>()
  versions.forEach((v: any) => {
    v.game_versions?.forEach((gv: string) => gameVersions.add(gv))
  })
  // Sort by version number (newest first)
  return Array.from(gameVersions).sort((a, b) => {
    const parseVer = (v: string) => v.split('.').map(n => parseInt(n) || 0)
    const aVer = parseVer(a)
    const bVer = parseVer(b)
    for (let i = 0; i < Math.max(aVer.length, bVer.length); i++) {
      if ((bVer[i] || 0) !== (aVer[i] || 0)) return (bVer[i] || 0) - (aVer[i] || 0)
    }
    return 0
  })
})

// Computed: filtered modpack versions based on loader and game version
const filteredModalVersions = computed(() => {
  let versions = modpackVersions.value
  if (selectedModalLoader.value) {
    versions = versions.filter((v: any) => 
      v.loaders?.includes(selectedModalLoader.value)
    )
  }
  if (selectedModalGameVersion.value) {
    versions = versions.filter((v: any) => 
      v.game_versions?.includes(selectedModalGameVersion.value)
    )
  }
  return versions
})

const availableMcVersions = ref<string[]>([])
const availableLoaders = ['fabric', 'forge', 'neoforge', 'quilt']
const systemRamGB = ref(16) // Default fallback

// Fetch system RAM on init
;(async () => {
   try {
      const { invoke } = await import('@tauri-apps/api/core')
      const sysInfo = await invoke<{ total_memory_bytes: number }>('get_system_info')
      systemRamGB.value = Math.floor(sysInfo.total_memory_bytes / (1024 * 1024 * 1024))
   } catch (e) {
      console.log('Failed to get system info, using 16GB default')
   }
})()

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
    type: 'mcjars' | 'custom'
    mcjarsType?: string // MCJars server type identifier (e.g. VANILLA, PAPER)
  }
}

const serverTypes: ServerType[] = [
  // ─── Vanilla / Official ───────────────────────────────────────────────────
  {
    id: 'vanilla',
    name: 'Vanilla',
    icon: 'i-lucide-box',
    description: 'The unmodified, official Minecraft experience as provided by Mojang.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: false,
    api: { type: 'mcjars', mcjarsType: 'VANILLA' }
  },
  // ─── Plugin servers ───────────────────────────────────────────────────────
  {
    id: 'paper',
    name: 'Paper',
    icon: 'i-lucide-scroll',
    description: 'An optimized fork of Spigot with better performance and configuration. Best for plugin servers.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    badge: 'popular',
    api: { type: 'mcjars', mcjarsType: 'PAPER' }
  },
  {
    id: 'purpur',
    name: 'Purpur',
    icon: 'i-lucide-cat',
    description: 'Drop-in replacement for Paper with many additional gameplay features and tweaks.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    badge: 'recommended',
    api: { type: 'mcjars', mcjarsType: 'PURPUR' }
  },
  {
    id: 'spigot',
    name: 'Spigot',
    icon: 'i-lucide-shield',
    description: 'The classic Bukkit fork powering the majority of plugin servers for years.',
    performance: 'good',
    supportsPlugins: true,
    supportsMods: false,
    api: { type: 'mcjars', mcjarsType: 'SPIGOT' }
  },
  {
    id: 'folia',
    name: 'Folia',
    icon: 'i-lucide-leaf',
    description: 'Experimental Paper fork using region-based multithreading for massive performance on large servers.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    api: { type: 'mcjars', mcjarsType: 'FOLIA' }
  },
  {
    id: 'leaf',
    name: 'Leaf',
    icon: 'i-lucide-tree-pine',
    description: 'A Paper fork focused on performance and additional Folia-compatible features.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    api: { type: 'mcjars', mcjarsType: 'LEAF' }
  },
  // ─── Mod loaders ─────────────────────────────────────────────────────────
  {
    id: 'fabric',
    name: 'Fabric',
    icon: 'i-lucide-layers',
    description: 'Lightweight, modern modding toolchain. Fast updates and performance-focused mods.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: true,
    api: { type: 'mcjars', mcjarsType: 'FABRIC' }
  },
  {
    id: 'forge',
    name: 'Forge',
    icon: 'i-lucide-anvil',
    description: 'The original and most popular mod loader. Largest mod library available.',
    performance: 'moderate',
    supportsPlugins: false,
    supportsMods: true,
    api: { type: 'mcjars', mcjarsType: 'FORGE' }
  },
  {
    id: 'neoforge',
    name: 'NeoForge',
    icon: 'i-lucide-zap',
    description: 'Community-driven fork of Forge with improved performance and modern API.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: true,
    api: { type: 'mcjars', mcjarsType: 'NEOFORGE' }
  },
  {
    id: 'mohist',
    name: 'Mohist',
    icon: 'i-lucide-flame',
    description: 'Hybrid server that supports both Forge mods and Bukkit/Spigot plugins simultaneously.',
    performance: 'moderate',
    supportsPlugins: true,
    supportsMods: true,
    api: { type: 'mcjars', mcjarsType: 'MOHIST' }
  },
  {
    id: 'magma',
    name: 'Magma',
    icon: 'i-lucide-thermometer',
    description: 'A Forge + Paper hybrid allowing both mods and plugins on the same server.',
    performance: 'moderate',
    supportsPlugins: true,
    supportsMods: true,
    api: { type: 'mcjars', mcjarsType: 'MAGMA' }
  },
  // ─── Proxies ─────────────────────────────────────────────────────────────
  {
    id: 'velocity',
    name: 'Velocity',
    icon: 'i-lucide-network',
    description: 'A modern, high-performance proxy for connecting multiple servers together.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    api: { type: 'mcjars', mcjarsType: 'VELOCITY' }
  },
  {
    id: 'velocity-ctd',
    name: 'Velocity CTD',
    icon: 'i-lucide-git-fork',
    description: 'A community fork of Velocity with extended features and continued development.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    api: { type: 'mcjars', mcjarsType: 'VELOCITY_CTD' }
  },
  {
    id: 'youer',
    name: 'Youer',
    icon: 'i-lucide-radio',
    description: 'Hybrid server that supports both NeoForge mods and Bukkit/Spigot plugins simultaneously',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: true,
    api: { type: 'mcjars', mcjarsType: 'YOUER' }
  },
  // ─── Limbos ──────────────────────────────────────────────────────────────
  {
    id: 'loohp-limbo',
    name: 'Loohp Limbo',
    icon: 'i-lucide-cloud',
    description: 'A lightweight limbo server for holding players in an empty world while waiting for a backend server.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    api: { type: 'mcjars', mcjarsType: 'LOOHP_LIMBO' }
  },
  {
    id: 'nanolimbo',
    name: 'NanoLimbo',
    icon: 'i-lucide-minimize-2',
    description: 'A tiny, resource-efficient limbo server implementation.',
    performance: 'excellent',
    supportsPlugins: true,
    supportsMods: false,
    api: { type: 'mcjars', mcjarsType: 'NANOLIMBO' }
  },
  // ─── Modpack / Custom ─────────────────────────────────────────────────────
  {
    id: 'modpack',
    name: 'Modpack',
    icon: 'i-lucide-package',
    description: 'A pre-configured server with a collection of mods. Browse Modrinth or import your own.',
    performance: 'good',
    supportsPlugins: false,
    supportsMods: true,
    badge: 'new',
    api: { type: 'custom' }
  },
  {
    id: 'custom',
    name: 'Custom JAR',
    icon: 'i-lucide-upload',
    description: 'Use your own server JAR file from local disk.',
    performance: 'good',
    supportsPlugins: customSupportsPlugins.value,
    supportsMods: customSupportsMods.value,
    api: { type: 'custom' }
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
      class: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
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
      class: 'bg-success-100/50 dark:bg-success-900/30 text-success-400',
      icon: 'i-lucide-check-circle',
      title: 'Java Compatible',
      message: `Java ${javaVer} meets the requirement of Java ${requiredJava}+ for Minecraft ${mcVersion || 'this version'}`
    }
  } else {
    return {
      class: 'bg-warning-100/50 dark:bg-warning-900/30 text-warning-400',
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
  return `~/Documents/VoidLink/servers/${serverFolderName.value}`
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

     // Pre-select latest release and set filters
     if (versions.length > 0) {
        const latest = versions.find((v: any) => v.version_type === 'release') || versions[0]
        
        // Auto-fill filters based on selection
        if (latest.loaders && latest.loaders.length > 0) {
           selectedModalLoader.value = latest.loaders[0]
        }
        if (latest.game_versions && latest.game_versions.length > 0) {
           selectedModalGameVersion.value = latest.game_versions[0]
        }
        
        // Set the version after filters so it appears invalid if filters don't match (though we just matched them)
        // Actually best to set it directly.
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
             selectedVersion.value = meta.dependencies.minecraft
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
     await scanJava()
     
     // Determine required java based on MC version
     const mcVersion = selectedVersion.value || ''
     let requiredJava = 17
     if (mcVersion >= '1.20.5') requiredJava = 21
     else if (mcVersion >= '1.17') requiredJava = 17
     else requiredJava = 8
     
     const compatible = getJavaForVersion(installations.value, requiredJava)
     
     if (compatible) {
         detectedJavaVersion.value = `Java ${compatible.major || '?'} (${compatible.version || 'unknown'})`
     } else {
         if (installations.value.length > 0) {
             const best = installations.value[0]
             if (best) {
                detectedJavaVersion.value = `Java ${best.major || '?'} (${best.version || 'unknown'})`
             }
         } else {
             detectedJavaVersion.value = 'No Java detected'
         }
     }
  } catch (e) {
     console.error('Failed to detect java', e)
     detectedJavaVersion.value = 'Detection Failed'
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

    if (apiConfig.type === 'mcjars' && apiConfig.mcjarsType) {
      // MCJars API v2: GET /api/v2/builds/{TYPE}
      // Response: { success: true, builds: { "1.21.1": { type, supported, java, builds, created, latest: { jarUrl, ... } }, ... } }
      const response = await fetch(`https://mcjars.app/api/v2/builds/${apiConfig.mcjarsType}`)
      const data = await response.json()

      if (data?.builds && typeof data.builds === 'object') {
        const allVersions = Object.keys(data.builds)

        const filtered = includeSnapshots.value
          ? allVersions
          : allVersions.filter(v => {
              const vInfo = data.builds[v]
              return vInfo?.type === 'RELEASE' || vInfo?.type === undefined
            })

        // Sort: newest first using semver-style comparison
        availableVersions.value = filtered.sort((a, b) => {
          const parseVer = (v: string) => v.split('.').map(n => parseInt(n) || 0)
          const aVer = parseVer(a)
          const bVer = parseVer(b)
          for (let i = 0; i < Math.max(aVer.length, bVer.length); i++) {
            if ((bVer[i] || 0) !== (aVer[i] || 0)) return (bVer[i] || 0) - (aVer[i] || 0)
          }
          return 0
        })
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

interface DownloadResult { url: string; isZip: boolean }

async function resolveDownloadUrl(): Promise<DownloadResult | null> {
  if (!selectedTypeData.value || !selectedVersion.value) return null

  const apiConfig = selectedTypeData.value.api
  const version = selectedVersion.value

  try {
    if (apiConfig.type === 'mcjars' && apiConfig.mcjarsType) {
      // MCJars API v2: GET /api/v2/builds/{TYPE}/{VERSION}
      // Response: { success: true, builds: [ { jarUrl, zipUrl, installation, ... } ] }
      const response = await fetch(`https://mcjars.app/api/v2/builds/${apiConfig.mcjarsType}/${version}`)
      const data = await response.json()

      if (data?.builds && Array.isArray(data.builds) && data.builds.length > 0) {
        const build = data.builds[0]

        // Prefer direct JAR — no extraction needed
        if (build?.jarUrl) {
          return { url: build.jarUrl, isZip: false }
        }

        // ZIP-only build (e.g. Forge, NeoForge, Mohist, Magma) — needs extraction
        if (build?.zipUrl) {
          return { url: build.zipUrl, isZip: true }
        }

        // Fallback: parse installation steps (try jar first, then zip)
        if (build?.installation && Array.isArray(build.installation)) {
          let jarStep: string | null = null
          let zipStep: string | null = null

          for (const stepGroup of build.installation) {
            for (const step of stepGroup) {
              if (step.type === 'download' && step.url) {
                const url: string = step.url
                const file: string = step.file ?? ''
                if (!zipStep && (url.endsWith('.zip') || file.endsWith('.zip'))) {
                  zipStep = url
                } else if (!jarStep) {
                  jarStep = url
                }
              }
            }
          }

          if (jarStep) return { url: jarStep, isZip: false }
          if (zipStep) return { url: zipStep, isZip: true }
        }
      }
    }
    return null
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
    const relativePath = `VoidLink/servers/${folderName}`

    statusMessage.value = 'Creating directory...'
    await mkdir(relativePath, { baseDir: BaseDirectory.Document, recursive: true })

    const jarName = 'server.jar'
    
    if (selectedType.value === 'custom') {
      if (!customJarPath.value) throw new Error('No JAR selected')
      
      statusMessage.value = 'Copying JAR file...'
      // Ensure absolute path for destination
      const { documentDir } = await import('@tauri-apps/api/path')
      const docDir = await documentDir()
      const destPath = await join(docDir, relativePath, jarName)
      
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
      const downloadResult = await resolveDownloadUrl()

      if (!downloadResult) {
        statusMessage.value = 'Failed to resolve download URL.'
        isCreating.value = false
        return
      }

      const { url: downloadUrl, isZip } = downloadResult

      statusMessage.value = isZip ? 'Downloading server archive...' : 'Downloading server JAR...'
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`)

      const buffer = await response.arrayBuffer()

      if (isZip) {
        // ZIP archive — extract via Rust (faster, no JS memory overhead).
        // MCJars ZIPs contain server.jar and libraries/ at their root.
        statusMessage.value = 'Extracting server archive...'
        const { invoke } = await import('@tauri-apps/api/core')
        const { documentDir } = await import('@tauri-apps/api/path')
        const docDir = await documentDir()
        const absDestDir = await join(docDir, relativePath)
        await invoke('extract_zip_to_dir', {
          bytes: Array.from(new Uint8Array(buffer)),
          destDir: absDestDir
        })
      } else {
        // Plain JAR — save directly as server.jar
        await writeFile(
          await join(relativePath, jarName),
          new Uint8Array(buffer),
          { baseDir: BaseDirectory.Document }
        )
      }
    }

    statusMessage.value = 'Writing server.properties...'
    
    // Create server.properties with world settings
    const serverProperties = [
      `level-seed=${worldSeed.value}`,
      `level-type=minecraft\\:${worldType.value}`,
      `generate-structures=${generateStructures.value}`,
      `hardcore=${hardcoreMode.value}`,
      `motd=\u00A73Server Powered by \u00A7bVoidLink`,
      `max-players=20`,
      `pvp=true`,
      `online-mode=true`,
      `gamemode=survival`,
      `difficulty=normal`,
      `server-port=25565`,
      `enable-command-block=true`,
      `enable-rcon=true`,
      `broadcast-rcon-to-ops=false`,
      `rcon.port=25575`,
      `rcon.password=voidlink`
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
         versionId: selectedVersion.value || 'custom',
         versionName: selectedVersion.value || 'custom',
         slug: selectedModpack.value.slug || customModpackName.value,
         loader: modpackLoader.value,
         version: selectedType.value === 'custom' ? 'custom' : (selectedModpackVersionData.value?.id || 'custom'),
         // Store extended metadata
         files: installedModpackFiles.value,
         dependencies: installedModpackDependencies.value
      } : null,
      supportsPlugins: selectedTypeData.value?.id === 'custom' ? customSupportsPlugins.value : selectedTypeData.value?.supportsPlugins,
      supportsMods: selectedTypeData.value?.id === 'custom' ? customSupportsMods.value : selectedTypeData.value?.supportsMods,
      version: selectedVersion.value || 'Custom',
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
