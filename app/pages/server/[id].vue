<template>
  <div>
    <!-- Server Hero -->
    <div class="server-hero" data-tauri-drag-region>
      <div class="hero-inner">
        <!-- Server Icon -->
        <div class="hero-icon" @click="changeServerIcon">
          <img v-if="serverIconUrl" :src="serverIconUrl" alt="" />
          <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--ink-3)"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
          <div class="hero-icon-overlay">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </div>
        </div>

        <!-- Server info -->
        <div class="hero-info">
          <div v-if="loading" style="height: 32px; width: 200px; background: var(--bg-3); border-radius: 6px" />
          <template v-else>
            <h1 class="hero-name">{{ server?.name }}</h1>
            <div class="hero-meta">
              <span class="pill" :class="serverStatus === 'online' ? 'ok' : ''">
                <span class="dot" />
                {{ serverStatus }}
              </span>
              <span>{{ server?.typeName }}{{ server?.modpack?.loader ? ` (${server.modpack.loader})` : '' }}</span>
              <span class="tag-mono">v{{ server?.version }}</span>
              <span class="tag-mono" style="cursor: pointer" title="Click to copy ID" @click="copyId">#{{ server?.id }}</span>
            </div>
          </template>
        </div>

        <!-- Actions -->
        <div class="hero-actions">
          <button
            v-if="serverStatus === 'offline'"
            class="btn success"
            @click="startServer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            Start
          </button>
          <template v-else>
            <button class="btn danger" :disabled="serverStatus === 'stopping'" @click="stopServer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
              Stop
            </button>
            <button class="btn ghost icon-only" title="Force Kill" @click="killServer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--bad)"><circle cx="12" cy="8" r="4" /><path d="M12 12v9" /><path d="M8.5 18.5 12 21l3.5-2.5" /></svg>
            </button>
          </template>
          <button class="btn ghost icon-only" title="Open Server Folder" @click="openServerFolder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
          </button>
          <button
            v-if="server?.modpack?.id && server.modpack.id !== 'custom'"
            class="btn ghost icon-only"
            :title="updateAvailable ? 'Update Available' : 'Check Updates'"
            @click="checkModpackUpdate"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :style="updateAvailable ? 'color: var(--accent)' : ''"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
          </button>
          <NuxtLink to="/" class="btn ghost icon-only" title="Back to Dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Update Modal -->
    <UModal v-model:open="showUpdateModal">
      <template #body>
        <div class="card-pad" style="display: flex; flex-direction: column; gap: 14px;">
          <div style="font-size: 16px; font-weight: 700; color: var(--ink-0);">Update Modpack</div>
          <p style="font-size: 13px; color: var(--ink-2); margin: 0;">
            A new version is available: <strong style="color: var(--ink-0);">{{ updateData?.name }}</strong>
          </p>
          <div style="padding: 12px 14px; background: var(--warn-soft); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; font-size: 12px; color: var(--warn);">
            Updating will replace mods and config files. Your world data will be safe, but custom config changes might be lost.
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button class="btn ghost" @click="showUpdateModal = false">Cancel</button>
            <button class="btn" :disabled="isUpdating" @click="performModpackUpdate">{{ isUpdating ? 'Updating…' : 'Update Now' }}</button>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Tab navigation -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ active: selectedTab === tab.value }"
        @click="selectedTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Main Content -->
    <div v-if="loading" class="empty-state">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin: 0 auto 12px; display: block; color: var(--accent)"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
      Loading…
    </div>

    <div v-else>
      <UTabs
        v-model="selectedTab"
        :items="tabs"
        style=""
        :ui="{list: 'hidden'}"
      >
          <!-- Performance -->
          <template #performance>
            <ServerPerformance
              v-if="server"
              :server-id="storeServerId"
              :server-data="server"
            />
          </template>

          <!-- Console / Overview -->
          <template #console>
            <div class="console">
              <div
                ref="consoleRef"
                class="console-body custom-scrollbar"
              >
                <div v-if="consoleLines.length === 0" class="log-line" style="color: var(--ink-3); font-style: italic">
                  <span class="msg">Server is offline. Output will appear here.</span>
                </div>
                <div
                  v-for="(line, i) in consoleLines"
                  :key="i"
                  class="log-line"
                >
                  <template v-if="parseLogLine(line)">
                    <span class="t">{{ parseLogLine(line).time }}</span>
                    <span class="lvl" :class="parseLogLine(line).level">{{ parseLogLine(line).level }}</span>
                    <span class="msg" v-html="parseAnsiToHtml(parseLogLine(line).message)" />
                  </template>
                  <template v-else>
                    <span class="msg" v-html="parseAnsiToHtml(line)" />
                  </template>
                </div>
              </div>
              <div class="console-input">
                <span class="prompt">›</span>
                <input
                  v-model="consoleInput"
                  placeholder="Type a command…"
                  :disabled="serverStatus === 'offline'"
                  @keydown.enter="sendCommand"
                />
                <button :disabled="serverStatus === 'offline'" @click="scrollToBottom">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 13 12 18 17 13" /><polyline points="7 6 12 11 17 6" /></svg>
                </button>
                <button :disabled="serverStatus === 'offline'" @click="sendCommand">Send</button>
              </div>
            </div>
          </template>

          <!-- Settings (RAM, Flags, Java) -->
          <template #settings>
            <div style="max-width: 1024px; margin: 0 auto; padding: 24px 16px 96px;">
              <!-- Header & Actions -->
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; padding: 12px 18px; background: var(--bg-1); border: 1px solid var(--line-1); border-radius: 10px; backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 20;">
                <div>
                  <div class="eyebrow">Server Configuration</div>
                  <p style="font-size: 13px; color: var(--ink-3); margin: 4px 0 0;">Manage general settings, gameplay, and performance</p>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn ghost" @click="showPropertiesEditor = true">Edit properties</button>
                  <button class="btn" :disabled="saving" @click="saveAllSettings">{{ saving ? 'Saving…' : 'Save Changes' }}</button>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;">
                <!-- Left Column -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                  <!-- General Information -->
                  <div class="card">
                    <div class="card-head"><h4>General Information</h4></div>
                    <div class="card-pad" style="display: flex; flex-direction: column; gap: 16px;">
                      <div class="field">
                        <label>Server Name</label>
                        <UInput v-model="serverName" placeholder="My Awesome Server" size="lg" />
                      </div>
                      <div class="field">
                        <label>Message of the Day (MOTD)</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; background: var(--bg-0); border: 1px solid var(--line-1); border-radius: 8px; margin-bottom: 4px;">
                          <button
                            v-for="code in mcColorCodes"
                            :key="code.code"
                            style="width: 24px; height: 24px; border-radius: 4px; font-size: 10px; font-weight: 700; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;"
                            :style="{ backgroundColor: code.color, color: code.textColor }"
                            :title="code.name"
                            @click="insertMotdCode(code.code)"
                          >{{ code.code }}</button>
                          <div style="width: 1px; background: var(--line-2); margin: 0 4px;" />
                          <button
                            v-for="style in mcStyleCodes"
                            :key="style.code"
                            :class="style.class"
                            style="padding: 0 8px; height: 24px; border-radius: 4px; font-size: 10px; background: var(--bg-3); border: 1px solid var(--line-1); font-family: 'Geist Mono', monospace; color: var(--ink-1); cursor: pointer;"
                            :title="style.name"
                            @click="insertMotdCode(style.code)"
                          >{{ style.label }}</button>
                        </div>
                        <textarea
                          ref="motdTextarea"
                          :value="getPropertyValue('motd')"
                          placeholder="A Minecraft Server"
                          class="input mono"
                          rows="3"
                          style="resize: none; min-height: auto;"
                          @input="(e) => updateProperty('motd', (e.target as HTMLTextAreaElement).value)"
                        />
                        <div style="padding: 12px 14px; background: #000; border: 1px solid var(--line-1); border-radius: 8px;">
                          <div style="display: flex; align-items: center; gap: 10px;">
                            <img v-if="serverIconUrl" :src="serverIconUrl" style="width: 48px; height: 48px; border-radius: 4px; opacity: 0.9; flex-shrink: 0;">
                            <div v-else style="width: 48px; height: 48px; background: var(--bg-3); border-radius: 4px; display: grid; place-items: center; flex-shrink: 0;">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--ink-4)"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                            </div>
                            <div>
                              <div class="font-minecraft" style="color: #fff; font-size: 14px;">{{ serverName || 'Minecraft Server' }}</div>
                              <div class="font-minecraft" v-html="renderMotdPreview(getPropertyValue('motd'))" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Gameplay Experience -->
                  <div class="card">
                    <div class="card-head"><h4>Gameplay Experience</h4></div>
                    <div class="card-pad" style="display: flex; flex-direction: column; gap: 14px;">
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="field">
                          <label>Gamemode</label>
                          <USelectMenu class="w-full" size="lg" :model-value="getPropertyValue('gamemode')" :items="['survival', 'creative', 'adventure', 'spectator']" @update:model-value="(val) => updateProperty('gamemode', val)" />
                        </div>
                        <div class="field">
                          <label>Difficulty</label>
                          <USelectMenu class="w-full" size="lg" :model-value="getPropertyValue('difficulty')" :items="['peaceful', 'easy', 'normal', 'hard']" @update:model-value="(val) => updateProperty('difficulty', val)" />
                        </div>
                      </div>
                      <div class="field">
                        <label>Server Port</label>
                        <UInput type="number" placeholder="25565" class="w-full" size="lg" :model-value="getPropertyValue('server-port')" @update:model-value="(val) => updateProperty('server-port', val)" />
                      </div>
                      <div
                        v-for="(item, idx) in [
                          { label: 'PVP Combat', desc: 'Allow players to fight each other', prop: 'pvp' },
                          { label: 'Allow Flight', desc: 'Allow flying in survival mode', prop: 'allow-flight' },
                          { label: 'Command Blocks', desc: 'Enable command block functionality', prop: 'enable-command-block' },
                          { label: 'Hardcore Mode', desc: 'Players are banned upon death', prop: 'hardcore' }
                        ]"
                        :key="idx"
                        style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg-2); border: 1px solid var(--line-1); border-radius: 8px;"
                      >
                        <div>
                          <div style="font-size: 13px; font-weight: 500; color: var(--ink-0);">{{ item.label }}</div>
                          <div style="font-size: 11px; color: var(--ink-3); margin-top: 2px;">{{ item.desc }}</div>
                        </div>
                        <button class="toggle" :class="{ on: getPropertyValue(item.prop) === 'true' }" @click="updateProperty(item.prop, getPropertyValue(item.prop) === 'true' ? 'false' : 'true')" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right Column -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                  <!-- System & Performance -->
                  <div class="card">
                    <div class="card-head"><h4>System & Performance</h4></div>
                    <div class="card-pad" style="display: flex; flex-direction: column; gap: 18px;">
                      <div style="background: var(--bg-2); border: 1px solid var(--line-1); border-radius: 8px; padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
                          <div>
                            <div style="font-size: 13px; font-weight: 500; color: var(--ink-0);">RAM Allocation</div>
                            <div style="font-size: 11px; color: var(--ink-3); margin-top: 2px;">Reserved memory for Java</div>
                          </div>
                          <span style="font-family: 'Instrument Serif', serif; font-size: 26px; color: var(--accent);">{{ javaSettings.memory }} <span style="font-size: 12px; font-family: 'Geist', sans-serif; color: var(--ink-3);">GB</span></span>
                        </div>
                        <USlider v-model="javaSettings.memory" :min="1" :max="systemRamGB" :step="0.5" color="primary" class="w-full" />
                        <div style="display: flex; justify-content: space-between; font-size: 11px; font-family: 'Geist Mono', monospace; color: var(--ink-4); margin-top: 6px;">
                          <span>1 GB</span><span>{{ systemRamGB }} GB</span>
                        </div>
                      </div>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="field">
                          <label>Max Players</label>
                          <UInputNumber size="lg" class="w-full" placeholder="20" :value="getPropertyValue('max-players')" @update:model-value="(val) => updateProperty('max-players', val)" />
                        </div>
                        <div class="field">
                          <label>View Distance</label>
                          <UInputNumber size="lg" class="w-full" placeholder="10" :min="2" :max="32" :value="getPropertyValue('view-distance')" @update:model-value="(val) => updateProperty('view-distance', val)" />
                        </div>
                        <div class="field">
                          <label>Sim Distance</label>
                          <UInputNumber size="lg" class="w-full" placeholder="10" :min="2" :max="32" :value="getPropertyValue('simulation-distance')" @update:model-value="(val) => updateProperty('simulation-distance', val)" />
                        </div>
                        <div class="field">
                          <label>Spawn Radius</label>
                          <UInputNumber size="lg" class="w-full" placeholder="16" :value="getPropertyValue('spawn-protection')" @update:model-value="(val) => updateProperty('spawn-protection', val)" />
                        </div>
                      </div>
                      <div class="field">
                        <label>Java Startup Flags</label>
                        <UTextarea v-model="javaSettings.flags" placeholder="-Aikars flags..." :rows="3" class="font-mono text-xs" variant="outline" color="neutral" />
                      </div>
                    </div>
                  </div>

                  <!-- Access Control -->
                  <div class="card">
                    <div class="card-head"><h4>Access Control</h4></div>
                    <div class="card-pad" style="display: flex; flex-direction: column; gap: 8px;">
                      <div
                        v-for="(item, idx) in [
                          { label: 'Enable Whitelist', desc: 'Only whitelisted players can join', prop: 'white-list' },
                          { label: 'Enforce Whitelist', desc: 'Kick non-whitelisted players on reload', prop: 'enforce-whitelist' },
                          { label: 'Online Mode', desc: 'Verify player accounts with Mojang', prop: 'online-mode' }
                        ]"
                        :key="idx"
                        :style="`display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg-2); border: 1px solid var(--line-1); border-radius: 8px; opacity: ${item.prop === 'enforce-whitelist' && getPropertyValue('white-list') !== 'true' ? 0.4 : 1};`"
                      >
                        <div>
                          <div style="font-size: 13px; font-weight: 500; color: var(--ink-0);">{{ item.label }}</div>
                          <div style="font-size: 11px; color: var(--ink-3); margin-top: 2px;">{{ item.desc }}</div>
                        </div>
                        <button
                          class="toggle"
                          :class="{ on: getPropertyValue(item.prop) === 'true' }"
                          :disabled="item.prop === 'enforce-whitelist' && getPropertyValue('white-list') !== 'true'"
                          @click="updateAccessProperty(item.prop, getPropertyValue(item.prop) !== 'true')"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Danger Zone -->
                  <div class="danger-zone">
                    <div class="dz-title">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Danger Zone
                    </div>
                    <div class="dz-row">
                      <div>
                        <div class="dz-item-title">Delete Server</div>
                        <div class="dz-item-desc">Permanently delete this server and all its files. Cannot be undone.</div>
                      </div>
                      <button class="btn danger sm" @click="openDeleteModal">Delete Server</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Delete Confirmation Modal -->
              <UModal v-model:open="showDeleteModal" title="Delete server" description="Are you sure you want to delete?">
                <template #body>
                  <div class="card-pad" style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--bad-soft); border: 2px solid rgba(248,113,113,0.25); display: grid; place-items: center; flex-shrink: 0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--bad)"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </div>
                      <div>
                        <div style="font-size: 16px; font-weight: 700; color: var(--ink-0);">Delete Server?</div>
                        <div style="font-size: 12px; color: var(--bad); margin-top: 2px;">This action is irreversible</div>
                      </div>
                    </div>
                    <p style="font-size: 13px; color: var(--ink-2); background: var(--bg-2); padding: 12px 14px; border-radius: 8px; border: 1px solid var(--line-1); line-height: 1.6; margin: 0;">
                      Are you sure you want to delete <strong style="color: var(--ink-0);">{{ serverFolderName }}</strong>?
                      This will permanently remove all worlds, configurations, and player data.
                    </p>
                    <div class="field">
                      <label style="text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px;">Type server name to confirm</label>
                      <input v-model="deleteConfirmation" :placeholder="serverFolderName" class="input mono" style="border-color: rgba(248,113,113,0.4);" />
                    </div>
                  </div>
                </template>
                <template #footer>
                  <div style="display: flex; justify-content: flex-end; gap: 8px; padding: 14px 18px;">
                    <button class="btn ghost" @click="showDeleteModal = false">Cancel</button>
                    <button class="btn danger" :disabled="deleteConfirmation !== serverFolderName || deletingServer" @click="confirmDeleteServer">
                      {{ deletingServer ? 'Deleting…' : 'Delete Permanently' }}
                    </button>
                  </div>
                </template>
              </UModal>
            </div>
          </template>

          <template #crash-reports>
            <div style="padding: 24px; max-width: 1024px; margin: 0 auto;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                <div>
                  <h2 style="font-family: 'Instrument Serif', serif; font-size: 24px; font-weight: 400; color: var(--ink-0); margin: 0 0 4px;">Crash Reports</h2>
                  <p style="font-size: 13px; color: var(--ink-3); margin: 0;">View and analyze server crashes</p>
                </div>
                <button class="btn ghost" :disabled="loadingReports" @click="loadCrashReports">Refresh</button>
              </div>

              <div v-if="loadingReports" style="display: flex; justify-content: center; padding: 48px 0;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="color: var(--accent)"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              </div>

              <div v-else-if="crashReports.length === 0" class="empty-state">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 16px; display: block; color: var(--ok)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <h5>No Crashes Found</h5>
                <p>Your server appears to be stable.</p>
              </div>

              <div v-else style="display: flex; flex-direction: column; gap: 8px;">
                <div
                  v-for="report in crashReports"
                  :key="report.name"
                  style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--bg-1); border: 1px solid var(--line-1); border-radius: 10px; cursor: pointer; transition: background 0.15s;"
                  @click="openCrashReport(report)"
                >
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 36px; height: 36px; background: var(--bad-soft); border-radius: 8px; display: grid; place-items: center; flex-shrink: 0;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--bad)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <div>
                      <div style="font-size: 13px; font-weight: 600; color: var(--ink-0);">{{ report.name }}</div>
                      <div style="font-size: 11px; font-family: 'Geist Mono', monospace; color: var(--ink-3); margin-top: 2px;">{{ new Date(report.created * 1000).toLocaleString() }}</div>
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ink-3)"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              </div>

              <!-- Viewing Modal -->
              <UModal v-model:open="showReportModal" fullscreen>
                <template #header>
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--line-1); background: var(--bg-1);">
                    <div style="font-size: 14px; font-weight: 600; color: var(--ink-0); display: flex; align-items: center; gap: 8px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--bad)"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                      {{ viewingReport?.name }}
                    </div>
                    <button class="btn ghost icon-only sm" @click="showReportModal = false">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </template>
                <template #body>
                  <div style="height: calc(100vh - 140px); overflow: auto; padding: 16px; font-family: 'Geist Mono', monospace; font-size: 12px; color: var(--ink-2); white-space: pre-wrap; background: var(--bg-0); line-height: 1.65;" class="custom-scrollbar">{{ reportContent }}</div>
                </template>
              </UModal>
            </div>
          </template>

          <template #backups>
            <div style="padding: 24px; max-width: 1024px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
              <!-- Header -->
              <div class="card" style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; padding: 16px 20px; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 42px; height: 42px; background: var(--accent-soft); border: 1px solid var(--accent-line); border-radius: 10px; display: grid; place-items: center; flex-shrink: 0;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent)"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  </div>
                  <div>
                    <div style="font-size: 15px; font-weight: 600; color: var(--ink-0);">Server Backups</div>
                    <div style="font-size: 12px; color: var(--ink-3); margin-top: 2px;">Create, restore, and manage backups</div>
                  </div>
                </div>
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
                  <button class="btn ghost icon-only" :disabled="backupLoading" @click="loadBackupList">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  </button>
                  <button class="btn" :disabled="backupCreating || serverStatus !== 'offline'" @click="createManualBackup">Create Backup</button>
                </div>
              </div>

              <!-- Warning when server running -->
              <div v-if="serverStatus !== 'offline'" style="padding: 12px 16px; background: var(--warn-soft); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; font-size: 13px; color: var(--warn); display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Stop the server before creating or restoring backups to prevent data corruption.
              </div>

              <!-- Stats -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                <div class="stat">
                  <div class="stat-label">Total Backups</div>
                  <div class="stat-value" style="font-size: 30px;">{{ backupList.length }}</div>
                </div>
                <div class="stat">
                  <div class="stat-label">Storage Used</div>
                  <div class="stat-value" style="font-size: 30px;">{{ formatBackupSize(backupTotalSize) }}</div>
                </div>
                <div class="stat">
                  <div class="stat-label">Auto-Backup</div>
                  <div class="stat-value" style="font-size: 30px;" :style="backupSettings.enabled ? 'color: var(--ok)' : 'color: var(--ink-4)'">{{ backupSettings.enabled ? 'Active' : 'Off' }}</div>
                </div>
              </div>

              <!-- Backup Settings -->
              <div class="card">
                <div class="card-head">
                  <h4>Backup Settings</h4>
                  <button class="toggle" :class="{ on: backupSettings.enabled }" @click="backupSettings.enabled = !backupSettings.enabled; saveBackupSettings()" />
                </div>
                <div class="card-pad" style="display: flex; flex-direction: column; gap: 14px;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="field">
                      <label>Interval (minutes)</label>
                      <input class="input" type="number" v-model.number="backupSettings.interval_minutes" :min="5" :max="1440" placeholder="30" :disabled="!backupSettings.enabled" @change="saveBackupSettings" />
                    </div>
                    <div class="field">
                      <label>Max Backups to Keep</label>
                      <input class="input" type="number" v-model.number="backupSettings.max_backups" :min="1" :max="100" placeholder="5" @change="saveBackupSettings" />
                    </div>
                  </div>
                  <div class="field">
                    <label>Folders to Backup</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
                      <button
                        v-for="folder in availableBackupFolders"
                        :key="folder"
                        class="btn sm"
                        :class="backupSettings.included_folders.includes(folder) ? '' : 'ghost'"
                        @click="toggleBackupFolder(folder)"
                      >{{ folder }}</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Backup List -->
              <div>
                <div v-if="backupLoading" style="display: flex; justify-content: center; padding: 48px 0;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="color: var(--accent)"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                </div>
                <div v-else-if="backupList.length === 0" class="empty-state">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; display: block; color: var(--ink-4)"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg>
                  <h5>No Backups Yet</h5>
                  <p>Create your first backup to protect your world</p>
                </div>
                <div v-else style="display: flex; flex-direction: column; gap: 6px; max-height: 460px; overflow-y: auto;" class="custom-scrollbar">
                  <div
                    v-for="backup in backupList"
                    :key="backup.id"
                    style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--bg-1); border: 1px solid var(--line-1); border-radius: 10px;"
                  >
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <div
                        style="width: 36px; height: 36px; border-radius: 8px; display: grid; place-items: center; flex-shrink: 0;"
                        :style="backup.backup_type === 'auto' ? 'background: var(--accent-soft)' : backup.backup_type === 'pre-restore' ? 'background: var(--warn-soft)' : 'background: var(--ok-soft)'"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                          :style="backup.backup_type === 'auto' ? 'color: var(--accent)' : backup.backup_type === 'pre-restore' ? 'color: var(--warn)' : 'color: var(--ok)'"
                        ><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                      </div>
                      <div>
                        <div style="font-size: 13px; font-weight: 600; color: var(--ink-0);">{{ backup.name }}</div>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--ink-3); margin-top: 2px;">
                          <span>{{ formatBackupDate(backup.created_at) }}</span>
                          <span>•</span>
                          <span>{{ formatBackupSize(backup.size_bytes) }}</span>
                          <span class="pill" :class="backup.backup_type === 'auto' ? 'accent' : backup.backup_type === 'pre-restore' ? 'warn' : 'ok'" style="font-size: 10px; padding: 1px 6px;">{{ backup.backup_type }}</span>
                        </div>
                      </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn sm ghost" :disabled="serverStatus !== 'offline'" @click="restoreBackupConfirm(backup)">Restore</button>
                      <button class="btn sm danger icon-only" @click="deleteBackupConfirm(backup)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Restore Modal -->
              <UModal v-model:open="showRestoreModal">
                <template #header>
                  <div style="padding: 14px 18px; border-bottom: 1px solid var(--line-1); font-size: 15px; font-weight: 600; color: var(--ink-0); display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent)"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.03"/></svg>
                    Restore Backup
                  </div>
                </template>
                <template #body>
                  <div class="card-pad" style="display: flex; flex-direction: column; gap: 12px;">
                    <p style="font-size: 13px; color: var(--ink-2); margin: 0;">
                      Are you sure you want to restore <strong style="color: var(--ink-0);">{{ selectedBackup?.name }}</strong>?
                    </p>
                    <div style="padding: 12px 14px; background: var(--accent-soft); border: 1px solid var(--accent-line); border-radius: 8px; font-size: 12px; color: var(--ink-1);">
                      A backup of the current state will be created automatically before restoring.
                    </div>
                  </div>
                </template>
                <template #footer>
                  <div style="display: flex; justify-content: flex-end; gap: 8px; padding: 14px 18px;">
                    <button class="btn ghost" @click="showRestoreModal = false">Cancel</button>
                    <button class="btn" :disabled="backupRestoring" @click="performRestore">{{ backupRestoring ? 'Restoring…' : 'Restore Now' }}</button>
                  </div>
                </template>
              </UModal>

              <!-- Delete Backup Modal -->
              <UModal v-model:open="showDeleteBackupModal">
                <template #header>
                  <div style="padding: 14px 18px; border-bottom: 1px solid var(--line-1); font-size: 15px; font-weight: 600; color: var(--bad); display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    Delete Backup
                  </div>
                </template>
                <template #body>
                  <div class="card-pad">
                    <p style="font-size: 13px; color: var(--ink-2); margin: 0;">
                      Are you sure you want to delete <strong style="color: var(--ink-0);">{{ selectedBackup?.name }}</strong>? This cannot be undone.
                    </p>
                  </div>
                </template>
                <template #footer>
                  <div style="display: flex; justify-content: flex-end; gap: 8px; padding: 14px 18px;">
                    <button class="btn ghost" @click="showDeleteBackupModal = false">Cancel</button>
                    <button class="btn danger" :disabled="backupDeleting" @click="performDelete">{{ backupDeleting ? 'Deleting…' : 'Delete' }}</button>
                  </div>
                </template>
              </UModal>
            </div>
          </template>

          <template #addons>
            <div style="height: 100%; display: flex; flex-direction: column; padding: 16px; gap: 16px; position: relative;">
              <!-- Toolbar -->
              <div class="card" style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; padding: 14px 18px; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; background: var(--accent-soft); border: 1px solid var(--accent-line); border-radius: 10px; display: grid; place-items: center; flex-shrink: 0;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent)"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  </div>
                  <div>
                    <div style="font-size: 15px; font-weight: 600; color: var(--ink-0);">Installed {{ addonsFolder === 'mods' ? 'Mods' : 'Plugins' }}</div>
                    <div style="font-size: 12px; color: var(--ink-3); margin-top: 2px; display: flex; align-items: center; gap: 6px;">
                      Manage server extensions
                      <span class="tag-mono">{{ addons.length }} installed</span>
                    </div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="display: flex; background: var(--bg-2); border: 1px solid var(--line-1); border-radius: 8px; padding: 2px; gap: 2px;">
                    <button class="btn sm" :class="viewMode === 'grid' ? '' : 'ghost'" style="padding: 5px 8px;" @click="viewMode = 'grid'">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    </button>
                    <button class="btn sm" :class="viewMode === 'list' ? '' : 'ghost'" style="padding: 5px 8px;" @click="viewMode = 'list'">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    </button>
                  </div>
                  <div style="width: 1px; height: 24px; background: var(--line-1);" />
                  <button class="btn" @click="showModrinthModal = true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {{ addonsFolder === 'mods' ? 'Download Mods' : 'Download Plugins' }}
                  </button>
                </div>
              </div>

              <!-- Content Area -->
              <div style="flex: 1; min-height: 0; position: relative;">
                <div v-if="loadingAddons" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(11,15,20,0.7); backdrop-filter: blur(4px); border-radius: 10px; z-index: 10;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="color: var(--accent); margin-bottom: 12px;"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  <p style="font-size: 13px; color: var(--ink-2);">Loading extensions…</p>
                </div>

                <div v-else-if="addons.length === 0" class="empty-state" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--ink-4); margin-bottom: 16px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  <h5>No extensions installed</h5>
                  <p style="margin-bottom: 20px;">Start customizing by downloading mods or plugins</p>
                  <button class="btn ghost" @click="showModrinthModal = true">Browse Modrinth</button>
                </div>

                <div v-else style="height: 100%; overflow-y: auto; padding-right: 4px;" class="custom-scrollbar">
                  <!-- Grid View -->
                  <div v-if="viewMode === 'grid'" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; padding-bottom: 24px;">
                    <div
                      v-for="mod in addons"
                      :key="mod.fileName"
                      class="card"
                      style="padding: 14px; display: flex; flex-direction: column; gap: 12px;"
                    >
                      <div style="display: flex; align-items: flex-start; gap: 10px;">
                        <div style="position: relative; flex-shrink: 0;">
                          <div style="width: 44px; height: 44px; border-radius: 10px; overflow: hidden; background: var(--bg-3); border: 1px solid var(--line-1); display: grid; place-items: center;">
                            <img v-if="mod.icon" :src="mod.icon" style="width: 100%; height: 100%; object-fit: cover;" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'">
                            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ink-4)"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                          </div>
                          <div v-if="mod.source === 'modrinth'" style="position: absolute; bottom: -2px; right: -2px; width: 16px; height: 16px; background: var(--bg-0); border-radius: 50%; display: grid; place-items: center;">
                            <UIcon name="i-simple-icons-modrinth" class="w-2.5 h-2.5 text-[#1bd96a]" />
                          </div>
                        </div>
                        <div style="min-width: 0; flex: 1;">
                          <div style="font-size: 13px; font-weight: 500; color: var(--ink-0); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="mod.title">{{ mod.title }}</div>
                          <div style="font-size: 10px; font-family: 'Geist Mono', monospace; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">{{ mod.fileName }}</div>
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--line-1);">
                        <span class="tag-mono" style="font-size: 10px;">{{ mod.versionId ? mod.versionId.slice(0, 8) : 'Local' }}</span>
                        <div style="display: flex; align-items: center; gap: 4px;">
                          <button class="toggle" :class="{ on: mod.enabled }" @click="toggleAddon(mod)" />
                          <UTooltip v-if="mod.source === 'modrinth' && mod.latestVersionId" :text="`Update to ${mod.latestVersionNumber}`">
                            <button class="btn sm ghost icon-only" @click="updateAddon(mod)">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                            </button>
                          </UTooltip>
                          <a v-if="mod.slug" :href="`https://modrinth.com/mod/${mod.slug}`" target="_blank" class="btn sm ghost icon-only">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                          <button class="btn sm danger icon-only" @click="deleteAddon(mod.fileName)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- List View -->
                  <div v-else style="display: flex; flex-direction: column; gap: 6px; padding-bottom: 24px;">
                    <div
                      v-for="addon in addons"
                      :key="addon.fileName"
                      style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: var(--bg-1); border: 1px solid var(--line-1); border-radius: 8px;"
                    >
                      <div style="flex-shrink: 0;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--bg-3); border: 1px solid var(--line-1); display: grid; place-items: center; overflow: hidden;">
                          <img v-if="addon.icon" :src="addon.icon" style="width: 100%; height: 100%; object-fit: cover;">
                          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ink-4)"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        </div>
                      </div>
                      <div style="flex: 1; min-width: 0; display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: center;">
                        <div>
                          <div style="font-size: 13px; font-weight: 500; color: var(--ink-0); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 6px;">
                            {{ addon.title || addon.fileName }}
                            <UIcon v-if="addon.source === 'modrinth'" name="i-simple-icons-modrinth" class="w-3 h-3 text-[#1bd96a] shrink-0" />
                          </div>
                          <div style="font-size: 10px; font-family: 'Geist Mono', monospace; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ addon.fileName }}</div>
                        </div>
                        <span class="tag-mono" style="font-size: 10px;">{{ addon.versionId ? addon.versionId.slice(0, 8) : 'Local' }}</span>
                        <div style="display: flex; align-items: center; gap: 4px;">
                          <button class="toggle" :class="{ on: addon.enabled }" @click="toggleAddon(addon)" />
                          <UTooltip v-if="addon.source === 'modrinth' && addon.latestVersionId" :text="`Update to ${addon.latestVersionNumber}`">
                            <button class="btn sm ghost icon-only" @click="updateAddon(addon)">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                            </button>
                          </UTooltip>
                          <a v-if="addon.slug" :href="`https://modrinth.com/mod/${addon.slug}`" target="_blank" class="btn sm ghost icon-only">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                          <button class="btn sm danger icon-only" @click="deleteAddon(addon.fileName)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modrinth Modal -->
              <UModal
                v-model:open="showModrinthModal"
                fullscreen
                :ui="{ content: 'bg-white dark:bg-[var(--bg-2)]', ring: 'ring-1 ring-gray-200 dark:ring-gray-800' }"
                class=" "
              >
                <template #header>
                  <div class="flex items-center justify-between w-full gap-4 py-2">
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-[#1bd96a]/10 rounded-lg flex justify-center items-center">
                        <UIcon
                          name="i-simple-icons-modrinth"
                          class="w-6 h-6 text-[#1bd96a]"
                        />
                      </div>
                      <div>
                        <h2 class="text-lg font-bold text-black dark:text-white">
                          Browse {{ addonsFolder === 'mods' ? 'Mods' : 'Plugins' }}
                        </h2>
                        <p class="text-xs text-gray-500">
                          Powered by Modrinth
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-3 flex-1 max-w-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 rounded-xl">
                      <UInput
                        v-model="modrinthQuery"
                        icon="i-lucide-search"
                        placeholder="Search extensions..."
                        class="flex-1 border-none"
                        variant="none"
                        :ui="{ icon: { leading: { pointer: '' } } }"
                        autofocus
                        @keydown.enter="searchModrinth"
                      />
                      <div class="w-px h-6 bg-gray-200 dark:bg-gray-800" />
                      <USelectMenu
                        v-model="modrinthSort"
                        :items="sortOptions"
                        value-key="value"
                        label-key="label"
                        class="w-40"
                        variant="none"
                        @update:model-value="searchModrinth"
                      />
                    </div>

                    <UButton
                      icon="i-lucide-x"
                      color="neutral"
                      variant="ghost"
                      size="lg"
                      class="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl"
                      @click="showModrinthModal = false"
                    />
                  </div>
                </template>

                <template #body>
                  <div class="flex h-full bg-white dark:bg-gray-950 rounded-xl">
                    <!-- Categories Sidebar -->
                    <div class="w-64 border-r border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-gray-900/20 overflow-y-auto shrink-0 p-4 space-y-2 custom-scrollbar">
                      <div class="mb-4">
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-2">
                          Filters
                        </p>
                        <UButton
                          color="neutral"
                          variant="soft"
                          size="sm"
                          icon="i-lucide-filter-x"
                          class="w-full justify-start"
                          :disabled="!selectedCategory"
                          @click="selectedCategory = ''; searchModrinth()"
                        >
                          Reset Filters
                        </UButton>
                      </div>

                      <div>
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-2">
                          Categories
                        </p>
                        <div class="space-y-1">
                          <button
                            v-for="cat in filteredCategories"
                            :key="cat.name"
                            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all border border-transparent"
                            :class="selectedCategory === cat.name
                              ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400 border-primary-500/20 shadow-sm'
                              : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-gray-200'"
                            @click="selectedCategory = cat.name; searchModrinth()"
                          >
                            <span
                              class="w-4 h-4 shrink-0 opacity-80"
                              v-html="cat.icon"
                            />
                            <span class="capitalize truncate flex-1">{{ cat.name.replace(/-/g, ' ') }}</span>
                            <UIcon
                              v-if="selectedCategory === cat.name"
                              name="i-lucide-check"
                              class="w-3 h-3"
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Results Grid -->
                    <div class="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-950">
                      <div
                        v-if="searchingModrinth"
                        class="flex flex-col items-center justify-center h-[50vh]"
                      >
                        <UIcon
                          name="i-lucide-loader-2"
                          class="w-12 h-12 animate-spin text-primary-500 mb-4"
                        />
                        <p class="text-gray-400 animate-pulse">
                          Searching Modrinth library...
                        </p>
                      </div>

                      <div
                        v-else-if="modrinthResults.length === 0"
                        class="flex flex-col items-center justify-center h-[50vh] text-center text-gray-500"
                      >
                        <div class="p-6 bg-gray-100 dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 mb-4 shadow-xl">
                          <UIcon
                            name="i-lucide-search"
                            class="w-12 h-12 opacity-30"
                          />
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-300 mb-2">
                          No results found
                        </h3>
                        <p class="max-w-md mx-auto">
                          Try customizing your search terms or selecting a different category to browse.
                        </p>
                      </div>

                      <div
                        v-else
                        class="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-7xl mx-auto"
                      >
                        <div
                          v-for="hit in modrinthResults"
                          :key="hit.slug"
                          class="flex gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-500/30 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all hover:shadow-lg group"
                        >
                          <img
                            :src="hit.icon_url || 'https://cdn.modrinth.com/placeholder.svg'"
                            class="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 object-cover shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300"
                          >
                          <div class="flex-1 min-w-0 flex flex-col">
                            <div class="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <h4 class="font-bold text-lg text-black dark:text-white truncate group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                                  {{ hit.title }}
                                </h4>
                                <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                  <span>by {{ hit.author }}</span>
                                  <span class="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
                                  <span class="flex items-center gap-0.5"><UIcon
                                    name="i-lucide-download"
                                    class="w-3 h-3"
                                  /> {{ formatNumber(hit.downloads) }}</span>
                                </div>
                              </div>
                              <UBadge
                                v-if="installedSlugs.has(hit.slug)"
                                size="xs"
                                color="success"
                                variant="soft"
                                class="shadow-sm shadow-success-500/10"
                              >
                                <UIcon
                                  name="i-lucide-check"
                                  class="w-3 h-3 mr-1"
                                />
                                Installed
                              </UBadge>
                            </div>

                            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 flex-1 leading-relaxed">
                              {{ hit.description }}
                            </p>

                            <div class="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 dark:border-gray-800/50">
                              <div class="flex gap-1.5 flex-wrap">
                                <span
                                  v-for="cat in (hit.categories || []).slice(0, 3)"
                                  :key="cat"
                                  class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50"
                                >
                                  {{ cat }}
                                </span>
                              </div>
                              <UButton
                                v-if="!installedSlugs.has(hit.slug)"
                                size="sm"
                                color="primary"
                                variant="solid"
                                icon="i-lucide-download"
                                :loading="installingSlug === hit.slug"
                                :disabled="installingSlug !== null"
                                class="shrink-0 shadow-lg shadow-primary-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                @click="installFromModrinth(hit)"
                              >
                                Install
                              </UButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </UModal>
            </div>
          </template>

          <!-- Player Management -->
          <template #players>
            <div style="padding: 16px; overflow-y: auto;" class="custom-scrollbar">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">

                <!-- Online Players -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 14px; font-weight: 600; color: var(--ink-0);">Online Players</div>
                    <span class="pill" :class="serverStatus === 'online' ? 'ok' : ''">{{ onlinePlayers.length }} Online</span>
                  </div>
                  <div class="card" style="height: 400px; display: flex; flex-direction: column;">
                    <div class="card-head" style="padding: 10px 16px;">
                      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-3); font-weight: 600;">Player List</span>
                      <button class="btn ghost icon-only sm" :disabled="loadingPlayers" @click="fetchOnlinePlayers">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                      </button>
                    </div>
                    <div style="flex: 1; overflow-y: auto; padding: 8px;" class="custom-scrollbar">
                      <div v-if="serverStatus !== 'online'" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--ink-3); gap: 8px;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4;"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
                        <p style="font-size: 13px;">Server is offline</p>
                      </div>
                      <div v-else-if="onlinePlayers.length === 0" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--ink-3); gap: 8px;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <p style="font-size: 13px;">No players online</p>
                      </div>
                      <div v-for="player in onlinePlayers" v-else :key="player" class="player-row">
                        <img :src="`https://mc-heads.net/avatar/${player}/40`" style="width: 36px; height: 36px; border-radius: 8px; background: var(--bg-3);" :alt="player">
                        <span class="name">{{ player }}</span>
                        <div class="meta">
                          <UDropdownMenu :items="[[{ label: 'Operator', icon: 'i-lucide-star', click: () => quickOp(player) }],[{ label: 'Kick', icon: 'i-lucide-log-out', click: () => kickPlayer(player) }, { label: 'Ban', icon: 'i-lucide-ban', color: 'error', click: () => quickBan(player) }]]">
                            <button class="btn sm ghost icon-only">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                            </button>
                          </UDropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Whitelist -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 14px; font-weight: 600; color: var(--ink-0);">Whitelist</div>
                    <span class="pill">{{ whitelist.length }} Allowed</span>
                  </div>
                  <div class="card" style="height: 400px; display: flex; flex-direction: column;">
                    <div class="card-head" style="padding: 10px 12px;">
                      <UInput v-model="newWhitelistPlayer" placeholder="Add player…" size="sm" class="flex-1" @keydown.enter="addToWhitelist" />
                      <button class="btn sm" :disabled="!newWhitelistPlayer" @click="addToWhitelist">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    </div>
                    <div style="flex: 1; overflow-y: auto; padding: 8px;" class="custom-scrollbar">
                      <div v-if="whitelist.length === 0" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--ink-3); gap: 8px;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4;"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        <p style="font-size: 13px;">Whitelist is empty</p>
                      </div>
                      <div v-for="entry in whitelist" v-else :key="entry.uuid" class="player-row">
                        <img :src="`https://mc-heads.net/avatar/${entry.name}/40`" style="width: 36px; height: 36px; border-radius: 8px; background: var(--bg-3);" :alt="entry.name">
                        <div style="min-width: 0;">
                          <div class="name">{{ entry.name }}</div>
                          <div class="uuid">{{ entry.uuid.substring(0, 8) }}…</div>
                        </div>
                        <div class="meta">
                          <button class="btn sm danger icon-only" @click="removeFromWhitelist(entry.uuid)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Operators -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 14px; font-weight: 600; color: var(--ink-0);">Operators</div>
                    <span class="pill">{{ operators.length }} Admins</span>
                  </div>
                  <div class="card" style="height: 400px; display: flex; flex-direction: column;">
                    <div class="card-head" style="padding: 10px 12px;">
                      <UInput v-model="newOperator" placeholder="Add operator…" size="sm" class="flex-1" @keydown.enter="addOperator" />
                      <button class="btn sm warn" :disabled="!newOperator" @click="addOperator">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    </div>
                    <div style="flex: 1; overflow-y: auto; padding: 8px;" class="custom-scrollbar">
                      <div v-if="operators.length === 0" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--ink-3); gap: 8px;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        <p style="font-size: 13px;">No operators assigned</p>
                      </div>
                      <div v-for="entry in operators" v-else :key="entry.uuid" class="player-row">
                        <img :src="`https://mc-heads.net/avatar/${entry.name}/40`" style="width: 36px; height: 36px; border-radius: 8px; background: var(--bg-3);" :alt="entry.name">
                        <div style="min-width: 0;">
                          <div class="name">{{ entry.name }}</div>
                          <span class="pill warn" style="font-size: 10px; padding: 1px 6px;">Level {{ entry.level }}</span>
                        </div>
                        <div class="meta">
                          <button class="btn sm danger icon-only" @click="removeOperator(entry.uuid)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Bans -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 14px; font-weight: 600; color: var(--ink-0);">Bans</div>
                    <span class="pill bad">{{ bannedPlayers.length }} Banned</span>
                  </div>
                  <div class="card" style="height: 400px; display: flex; flex-direction: column;">
                    <div class="card-head" style="padding: 10px 12px; gap: 6px;">
                      <UInput v-model="newBannedPlayer" placeholder="Player…" size="sm" class="flex-1" @keydown.enter="banPlayer" />
                      <UInput v-model="banReason" placeholder="Reason" size="sm" class="flex-1" @keydown.enter="banPlayer" />
                      <button class="btn sm danger" :disabled="!newBannedPlayer" @click="banPlayer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                      </button>
                    </div>
                    <div style="flex: 1; overflow-y: auto; padding: 8px;" class="custom-scrollbar">
                      <div v-if="bannedPlayers.length === 0" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--ink-3); gap: 8px;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <p style="font-size: 13px;">No banned players</p>
                      </div>
                      <div v-for="entry in bannedPlayers" v-else :key="entry.uuid" class="player-row">
                        <img :src="`https://mc-heads.net/avatar/${entry.name}/40`" style="width: 36px; height: 36px; border-radius: 8px; background: var(--bg-3);" :alt="entry.name">
                        <div style="min-width: 0; flex: 1;">
                          <div class="name">{{ entry.name }}</div>
                          <div style="font-size: 11px; color: var(--bad); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="entry.reason">{{ entry.reason || 'No reason' }}</div>
                        </div>
                        <div class="meta">
                          <button class="btn sm ghost icon-only" title="Unban" @click="unbanPlayer(entry.uuid)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ok)"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.03"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </template>
      </UTabs>
    </div>
      <!-- EULA Modal -->
      <UModal v-model:open="showEulaModal" class=" ">
        <template #header>
          <div class="flex items-center gap-2 text-warning-500">
            <UIcon
              name="i-lucide-scroll-text"
              class="w-6 h-6"
            />
            <h3 class="font-bold text-lg text-white">
              Accept EULA
            </h3>
          </div>
        </template>

        <template #body>
          <div class="space-y-4">
            <p class="text-sm text-gray-300">
              By using this software, you agree to the <a
                href="https://aka.ms/MinecraftEULA"
                target="_blank"
                class="text-primary-500 hover:underline"
              >Minecraft End User License Agreement</a>.
            </p>
            <p class="text-xs text-gray-500">
              You must accept the EULA to start the server.
            </p>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showEulaModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              @click="acceptEula"
            >
              I Agree
            </UButton>
          </div>
        </template>
      </UModal>

      <!-- Properties Editor Modal -->
      <UModal v-model:open="showPropertiesEditor" class=" ">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-file-code"
              class="w-5 h-5 text-primary-500"
            />
            <h3 class="font-bold text-lg text-white">
              Edit server.properties
            </h3>
          </div>
        </template>

        <template #body>
          <div class="space-y-4">
            <p class="text-xs text-gray-500">
              Edit the raw server.properties file directly. Be careful with formatting.
            </p>
            <UTextarea
              v-model="propertiesEditorContent"
              :rows="20"
              class="font-mono w-full text-xs"
              placeholder="# server.properties content..."
            />
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showPropertiesEditor = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-save"
              @click="savePropertiesFromEditor"
            >
              Save Changes
            </UButton>
          </div>
        </template>
      </UModal>
  </div>
</template>

<script setup lang="ts">
import { readTextFile, writeTextFile, readDir, remove, exists, mkdir, writeFile, rename, copyFile, readFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { fetch } from '@tauri-apps/plugin-http'
import { Command, type Child } from '@tauri-apps/plugin-shell'
import { platform } from '@tauri-apps/plugin-os'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { join, documentDir } from '@tauri-apps/api/path'

import { invoke, convertFileSrc } from '@tauri-apps/api/core'
import { parseAnsiToHtml } from '~/utils/ansiParser'
import { installModpack, installMrpack } from '~/utils/modpack'

import { useJava } from '~/composables/useJava'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const serverProcessStore = useServerProcessStore()
const serversStore = useServersStore()
const tunnelStore = useTunnelStore()
const backupStore = useBackupStore()

// ===== BACKUP SYSTEM =====
import type { BackupInfo, BackupSettings } from '~/composables/useBackupStore'

const backupList = ref<BackupInfo[]>([])
const backupLoading = ref(false)
const backupCreating = ref(false)
const backupRestoring = ref(false)
const backupDeleting = ref(false)
const showRestoreModal = ref(false)
const showDeleteBackupModal = ref(false)
const selectedBackup = ref<BackupInfo | null>(null)
const availableBackupFolders = ref<string[]>([])
const backupSettings = reactive<BackupSettings>({
	enabled: false,
	interval_minutes: 30,
	max_backups: 5,
	custom_path: null,
	included_folders: ['world', 'world_nether', 'world_the_end']
})

const backupTotalSize = computed(() => {
	return backupList.value.reduce((sum, b) => sum + b.size_bytes, 0)
})

async function loadBackupList() {
	backupLoading.value = true
	try {
		const folder = serverFolderName.value
		backupList.value = await backupStore.loadBackups(folder)
	} catch (e) {
		console.error('Failed to load backups:', e)
	} finally {
		backupLoading.value = false
	}
}

async function loadBackupSettings() {
	try {
		const folder = serverFolderName.value
		const loaded = await backupStore.loadSettings(folder)
		Object.assign(backupSettings, loaded)
	} catch (e) {
		console.error('Failed to load backup settings:', e)
	}
}

async function loadAvailableBackupFolders() {
	try {
		const docDir = await documentDir()
		const fullPath = await join(docDir, 'VoidLink/servers', serverFolderName.value)
		availableBackupFolders.value = await backupStore.getAvailableFolders(fullPath)
	} catch (e) {
		console.error('Failed to load available folders:', e)
		availableBackupFolders.value = ['world', 'world_nether', 'world_the_end']
	}
}

async function saveBackupSettings() {
	try {
		const folder = serverFolderName.value
		await backupStore.saveSettings(folder, { ...backupSettings })
		toast.add({ title: 'Backup settings saved', color: 'success' })
	} catch (e) {
		console.error('Failed to save backup settings:', e)
		toast.add({ title: 'Failed to save settings', description: String(e), color: 'error' })
	}
}

function toggleBackupFolder(folder: string) {
	const idx = backupSettings.included_folders.indexOf(folder)
	if (idx === -1) {
		backupSettings.included_folders.push(folder)
	} else {
		backupSettings.included_folders.splice(idx, 1)
	}
	saveBackupSettings()
}

async function createManualBackup() {
	backupCreating.value = true
	try {
		const docDir = await documentDir()
		const fullPath = await join(docDir, 'VoidLink/servers', serverFolderName.value)
		await backupStore.createBackup(fullPath, serverFolderName.value, 'manual', backupSettings.included_folders)
		await loadBackupList()
		toast.add({ title: 'Backup created successfully', color: 'success' })
	} catch (e) {
		console.error('Failed to create backup:', e)
		toast.add({ title: 'Failed to create backup', description: String(e), color: 'error' })
	} finally {
		backupCreating.value = false
	}
}

function restoreBackupConfirm(backup: BackupInfo) {
	selectedBackup.value = backup
	showRestoreModal.value = true
}

async function performRestore() {
	if (!selectedBackup.value) return
	
	backupRestoring.value = true
	try {
		const docDir = await documentDir()
		const fullPath = await join(docDir, 'VoidLink/servers', serverFolderName.value)
		await backupStore.restoreBackup(fullPath, serverFolderName.value, selectedBackup.value.id, backupSettings.included_folders)
		await loadBackupList()
		showRestoreModal.value = false
		toast.add({ title: 'Backup restored successfully', description: 'A pre-restore backup was created automatically.', color: 'success' })
	} catch (e) {
		console.error('Failed to restore backup:', e)
		toast.add({ title: 'Failed to restore backup', description: String(e), color: 'error' })
	} finally {
		backupRestoring.value = false
	}
}

function deleteBackupConfirm(backup: BackupInfo) {
	selectedBackup.value = backup
	showDeleteBackupModal.value = true
}

async function performDelete() {
	if (!selectedBackup.value) return
	
	backupDeleting.value = true
	try {
		await backupStore.deleteBackup(serverFolderName.value, selectedBackup.value.id)
		await loadBackupList()
		showDeleteBackupModal.value = false
		toast.add({ title: 'Backup deleted', color: 'success' })
	} catch (e) {
		console.error('Failed to delete backup:', e)
		toast.add({ title: 'Failed to delete backup', description: String(e), color: 'error' })
	} finally {
		backupDeleting.value = false
	}
}

function formatBackupSize(bytes: number): string {
	return backupStore.formatBytes(bytes)
}

function formatBackupDate(dateStr: string): string {
	return backupStore.formatDate(dateStr)
}
// ===== END BACKUP SYSTEM =====

const viewMode = ref<'grid' | 'list'>('grid')

const serverId = route.params.id as string // actually folder name

const serverFolderName = computed(() => route.params.id as string)

const loading = ref(true)
const saving = ref(false)
const server = ref<any>(null)
const serverIconUrl = ref<string | null>(null)

function updateServerIconUrl(blob: Blob) {
  if (serverIconUrl.value) {
    URL.revokeObjectURL(serverIconUrl.value)
  }
  serverIconUrl.value = URL.createObjectURL(blob)
}

onUnmounted(() => {
  if (serverIconUrl.value) {
    URL.revokeObjectURL(serverIconUrl.value)
  }
})

// Settings
const serverName = ref('')
const javaSettings = reactive({
  memory: 4,
  path: 'java',
  flags: ''
})

// System RAM
const systemRamGB = ref(32) // Default fallback

// Properties
const rawProperties = ref('')
const parsedProperties = ref<Record<string, any>>({})
const propsSearch = ref('')

// Properties Editor Modal
const showPropertiesEditor = ref(false)
const propertiesEditorContent = ref('')

watch(showPropertiesEditor, (isOpen) => {
  if (isOpen) {
    // Load raw content when modal opens
    propertiesEditorContent.value = rawProperties.value
  }
})

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
  { code: 'f', color: '#FFFFFF', textColor: '#000', name: 'White' }
]

const mcStyleCodes = [
  { code: 'l', label: 'B', class: 'font-bold', name: 'Bold' },
  { code: 'o', label: 'I', class: 'italic', name: 'Italic' },
  { code: 'n', label: 'U', class: 'underline', name: 'Underline' },
  { code: 'm', label: 'S', class: 'line-through', name: 'Strikethrough' },
  { code: 'k', label: '?', class: '', name: 'Obfuscated' },
  { code: 'r', label: 'R', class: 'text-gray-400', name: 'Reset' }
]

// Modpack Update State
const showUpdateModal = ref(false)
const checkingUpdate = ref(false)
const isUpdating = ref(false)
const updateAvailable = ref(false)
const updateData = ref<any>(null)

const mcColorMap: Record<string, string> = {
  0: '#000000', 1: '#0000AA', 2: '#00AA00', 3: '#00AAAA',
  4: '#AA0000', 5: '#AA00AA', 6: '#FFAA00', 7: '#AAAAAA',
  8: '#555555', 9: '#5555FF', a: '#55FF55', b: '#55FFFF',
  c: '#FF5555', d: '#FF55FF', e: '#FFFF55', f: '#FFFFFF'
}

// Console log parsing
interface ParsedLogLine {
  time: string
  level: string
  message: string
}

function parseLogLine(line: string): ParsedLogLine | null {
  // 1. Clean line for pattern matching (remove ANSI and extra whitespace)
  // eslint-disable-next-line no-control-regex
  const cleanLine = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim()

  // Pattern 1: [HH:MM:SS LEVEL]: message
  const pattern1 = /^\[(\d{2}:\d{2}:\d{2})\s+(INFO|WARN|ERROR|DEBUG|FATAL)\]:\s*(.*)$/i
  let match = cleanLine.match(pattern1)

  if (match) {
    const time = match[1]
    const level = match[2].toUpperCase()
    // Extract message from original line to preserve colors
    // Find the first occurrence of "]:" which likely marks end of header
    const splitIdx = line.indexOf(']:')
    const message = splitIdx !== -1 ? line.substring(splitIdx + 2).replace(/^\s+/, '') : match[3]
    return { time, level, message }
  }

  // Pattern 2: [HH:MM:SS] [Thread/LEVEL]: message
  const pattern2 = /^\[(\d{2}:\d{2}:\d{2})\]\s+\[.*?\/(INFO|WARN|ERROR|DEBUG|FATAL)\]:\s*(.*)$/i
  match = cleanLine.match(pattern2)

  if (match) {
    const time = match[1]
    const level = match[2].toUpperCase()
    const splitIdx = line.indexOf(']:')
    const message = splitIdx !== -1 ? line.substring(splitIdx + 2).replace(/^\s+/, '') : match[3]
    return { time, level, message }
  }

  // Pattern 3: [HH:MM:SS] [Thread/LEVEL] [Context]: message
  const pattern3 = /^\[(\d{2}:\d{2}:\d{2})\]\s+\[.*?\/(INFO|WARN|ERROR|DEBUG|FATAL)\].*?:\s*(.*)$/i
  match = cleanLine.match(pattern3)

  if (match) {
    const time = match[1]
    const level = match[2].toUpperCase()
    const splitIdx = line.indexOf(']:') // Assumes standard formatting
    const message = splitIdx !== -1 ? line.substring(splitIdx + 2).replace(/^\s+/, '') : match[3]
    return { time, level, message }
  }

  // Pattern 4: [LEVEL] message
  const pattern4 = /^\[(INFO|WARN|ERROR|DEBUG|FATAL)\]\s*(.*)$/i
  match = cleanLine.match(pattern4)

  if (match) {
    const level = match[1].toUpperCase()
    const splitIdx = line.indexOf(']')
    const message = splitIdx !== -1 ? line.substring(splitIdx + 1).replace(/^\s+/, '') : match[2]
    return { time: '', level, message }
  }

  return null
}

function getLogLevelColor(level: string): 'primary' | 'success' | 'warning' | 'error' | 'neutral' {
  switch (level) {
    case 'INFO': return 'primary'
    case 'WARN': return 'warning'
    case 'ERROR': return 'error'
    case 'FATAL': return 'error'
    case 'DEBUG': return 'neutral'
    default: return 'neutral'
  }
}

function scrollToBottom() {
  const el = consoleRef.value
  if (el) {
    el.scrollTop = el.scrollHeight
  }
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
const installingSlug = ref<string | null>(null) // Currently installing addon slug

// Get set of installed slugs for quick lookup
const installedSlugs = computed(() => {
  const slugs = new Set<string>()
  Object.values(installedAddonsMeta.value).forEach((meta) => {
    if (meta.slug) slugs.add(meta.slug)
  })
  return slugs
})

// --- Player Management ---
interface WhitelistEntry {
  uuid: string
  name: string
}

interface OperatorEntry {
  uuid: string
  name: string
  level: number
  bypassesPlayerLimit: boolean
}

interface BannedPlayerEntry {
  uuid: string
  name: string
  created: string
  source: string
  expires: string
  reason: string
}

const onlinePlayers = ref<string[]>([])
const whitelist = ref<WhitelistEntry[]>([])
const operators = ref<OperatorEntry[]>([])
const bannedPlayers = ref<BannedPlayerEntry[]>([])
const loadingPlayers = ref(false)

// Track processed lines separately from consoleLines because we filter some out!
const lastLogLineCount = ref(0)

// Poll for online players (RCON fallback support)
async function fetchOnlinePlayers() {
  if (serverStatus.value !== 'online') {
    onlinePlayers.value = []
    // Reset log pointer when offline so next start works cleanly
    lastLogLineCount.value = 0
    return
  }

  // Fallback to RCON if no process or if specifically checking
  // We prefer RCON for parsing cleanly if available
  const rconPort = getPropertyValue('rcon.port') || '25575'
  const rconPassword = getPropertyValue('rcon.password') || 'voidlink'

  if (!serverProcess.value || getPropertyValue('enable-rcon') === 'true') {
    try {
      const res = await invoke<{ success: boolean, response: string }>('rcon_send_command', {
        host: '127.0.0.1',
        port: parseInt(rconPort),
        password: rconPassword,
        command: 'list'
      })

      if (res.success) {
        // Parse: "There are 1 of 20 players online: VoIdLiNk"
        // or "There are 0 of 20 players online: "
        const match = res.response.match(/online:(.*)/)
        if (match) {
          const names = match[1].split(',').map(n => n.trim()).filter(n => n)
          onlinePlayers.value = names
        }
      }
    } catch (e) {
      // RCON failed, ignore
    }
  }

  // If we have process, also send list to console just in case (optional, but keep console alive)
  if (serverProcess.value) {
    // We don't need to spam 'list' in console if we use RCON for the UI list.
  }
}

// Log Tailing for Live Console (when process handle lost)
async function tailLogs() {
  if (serverStatus.value !== 'online' || serverProcess.value) {
    // We only tail if online AND no process handle
    // If we have process handle, we get logs via stdout event
    // If offline, we reset pointer via fetchOnlinePlayers or here
    return
  }

  try {
    const folder = serverFolderName.value
    // Must use absolute path for Rust file reading if possible, or relative to app
    // But our utils.rs expects a path. Let's resolve the path fully.
    // We can construct it via documentDir
    const docs = await documentDir()
    const logPath = await join(docs, 'VoidLink', 'servers', folder, 'logs', 'latest.log')

    const result = await invoke<{ content: string, new_offset: number }>('read_log_tail', {
      path: logPath,
      offset: lastLogLineCount.value // REUSED VARIABLE NAME: Using 'lastLogLineCount' as 'lastByteOffset' to avoid big refactor
    })

    const newContent = result.content
    if (!newContent) {
      // No new content, check if we need to reset due to file shrink happens inside Rust?
      // Rust command returns new_offset=0 if file shrank.
    }

    // If offset reset to 0 (file shrank/rotated)
    if (result.new_offset < lastLogLineCount.value) {
      consoleLines.value.length = 0
      lastLogLineCount.value = 0
      // But we might have content from the new file start
    }

    if (newContent) {
      const lines = newContent.split('\n')
      for (const l of lines) {
        // Filter RCON spam
        if (l.trim() && !l.includes('Thread RCON Client /127.0.0.1')) {
          consoleLines.value.push(l)
        }
      }
    }

    // Update offset
    lastLogLineCount.value = result.new_offset
  } catch (e) {
    // failed to read log, maybe locked or file not found
  }
}

let playerPollInterval: any = null
let logTailInterval: any = null

onMounted(() => {
  playerPollInterval = setInterval(fetchOnlinePlayers, 120000)
  logTailInterval = setInterval(tailLogs, 2000) // Poll logs every 2s
  fetchOnlinePlayers()
})

onUnmounted(() => {
  if (playerPollInterval) clearInterval(playerPollInterval)
  if (logTailInterval) clearInterval(logTailInterval)
})

// Input fields for adding new entries
const newWhitelistPlayer = ref('')
const newOperator = ref('')
const newBannedPlayer = ref('')
const banReason = ref('')

// ...

async function toggleAddon(addon: AddonUI) {
  const folder = serverFolderName.value
  const oldName = addon.fileName
  // If currently enabled (ends with .jar), disable it (append .disabled)
  // If currently disabled (.disabled), enable it (remove .disabled)
  // But easier: check addon.enabled flag derived from extension.

  const newName = addon.enabled ? `${oldName}.disabled` : oldName.replace(/\.disabled$/, '')

  const oldPath = `VoidLink/servers/${folder}/${addonsFolder.value}/${oldName}`
  const newPath = `VoidLink/servers/${folder}/${addonsFolder.value}/${newName}`

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

// Modrinth browser state
const showModrinthBrowser = ref(true)

// Format large numbers nicely (e.g. 1000000 -> 1M)
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return num.toString()
}

// Update installFromModrinth to save versionId

const modrinthQuery = ref('')
const modrinthResults = ref<any[]>([])
const searchingModrinth = ref(false)
const showModrinthModal = ref(false)
const selectedCategory = ref('')
const modrinthSort = ref('relevance')
const modrinthCategories = ref<{ name: string, icon: string, project_type: string }[]>([])
const loadingCategories = ref(false)

const sortOptions = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Downloads', value: 'downloads' },
  { label: 'Follows', value: 'follows' },
  { label: 'Newest', value: 'newest' },
  { label: 'Updated', value: 'updated' }
]

// Filtered categories for current project type (mod or plugin)
const filteredCategories = computed(() => {
  // Modrinth uses 'mod' for both mods and plugins
  // Also include categories with no specific project_type
  return modrinthCategories.value.filter(c =>
    c.project_type === 'mod' || c.project_type === 'project' || !c.project_type
  )
})

async function loadModrinthCategories() {
  if (modrinthCategories.value.length > 0) {
    return
  }
  loadingCategories.value = true
  try {
    const res = await fetch('https://api.modrinth.com/v2/tag/category')
    const data = await res.json()
    modrinthCategories.value = data
  } catch (e) {
    console.error('[Categories] Failed to load:', e)
  } finally {
    loadingCategories.value = false
  }
}

// Load categories and initial results when modal opens
watch(showModrinthModal, (isOpen) => {
  if (isOpen) {
    loadModrinthCategories()
    searchModrinth()
  }
})

// Use composable for server state persistence
const serverStore = useServerProcessStore()
const storeServerId = computed(() => serverFolderName.value)
const serverState = computed(() => serverStore.getServer(storeServerId.value))
const { scanJava, getJavaForVersion, validateJavaPath, installations } = useJava()

// These are reactive references to the store - use store methods for persistence
const serverStatus = computed({
  get: () => serverState.value.status,
  set: (val) => { serverStore.setStatus(storeServerId.value, val) }
})
const serverProcess = computed({
  get: () => serverState.value.process,
  set: (val) => { serverStore.setProcess(storeServerId.value, val) }
})

// Direct reference to console lines array - mutations like .push() work
const consoleLines = computed(() => serverState.value.consoleLines)
const consoleRef = ref<HTMLElement | null>(null)
const consoleInput = ref('')

// Send command to server - uses stdin if available, fallback to RCON
async function sendCommand() {
  const cmd = consoleInput.value.trim()
  if (!cmd) return

  consoleLines.value.push(`> ${cmd}`)
  consoleInput.value = ''

  // Try using Child stdin first
  if (serverProcess.value) {
    try {
      await serverProcess.value.write(cmd + '\n')
      return
    } catch (e) {
      console.error('Failed to write to stdin:', e)
    }
  }

  // Fallback to RCON
  const rconPort = getPropertyValue('rcon.port') || '25575'
  const rconPassword = getPropertyValue('rcon.password') || 'voidlink'

  try {
    const result = await invoke<{ success: boolean, response: string }>('rcon_send_command', {
      host: '127.0.0.1',
      port: parseInt(rconPort),
      password: rconPassword,
      command: cmd
    })
    if (result.response) {
      consoleLines.value.push(result.response)
    }
  } catch (e) {
    consoleLines.value.push(`[RCON Error] ${e}`)
  }
}

// Load logs from file (for recovered servers after F5)
async function loadLogsFromFile() {
  try {
    const folder = serverFolderName.value
    const logPath = `VoidLink/servers/${folder}/logs/latest.log`

    if (!await exists(logPath, { baseDir: BaseDirectory.Document })) {
      return
    }

    const content = await readTextFile(logPath, { baseDir: BaseDirectory.Document })
    const lines = content.split('\n').slice(-200) // Last 200 lines

    // Clear and add log lines
    serverState.value.consoleLines.length = 0
    for (const line of lines) {
      if (line.trim()) {
        serverState.value.consoleLines.push(line)
      }
    }
  } catch (e) {
    console.error('Failed to load logs from file:', e)
  }
}

// Auto-load logs if server is recovered (no Child handle but online)
watch(() => serverStatus.value, async (status) => {
  if (status === 'online' && !serverProcess.value && consoleLines.value.length === 0) {
    await loadLogsFromFile()
  }
}, { immediate: true })

watch(() => consoleLines.value.length, async () => {
  await nextTick()
  if (consoleRef.value) {
    consoleRef.value.scrollTop = consoleRef.value.scrollHeight
  }
})
const showEulaModal = ref(false)

const statusColor = computed(() => {
  switch (serverStatus.value) {
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
  if (t === 'modpack') return 'mods' // Modpacks typically use mods
  return null
})

async function saveAddonsMeta() {
  try {
    const folder = serverFolderName.value
    const path = `VoidLink/servers/${folder}/addons.json`
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
    const path = `VoidLink/servers/${folder}/${addonsFolder.value}`
    const metaPath = `VoidLink/servers/${folder}/addons.json`

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
      .map((e) => {
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
      const targetPath = `VoidLink/servers/${serverFolderName.value}/${addonsFolder.value}/${file.name}`
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

    const res = await fetch(`https://api.modrinth.com/v2/search?query=${encodeURIComponent(modrinthQuery.value)}&facets=${facetsStr}&index=${modrinthSort.value}&limit=30`)
    const data = await res.json()
    modrinthResults.value = data.hits || []
  } catch (e) {
    console.error('Modrinth search failed', e)
  } finally {
    searchingModrinth.value = false
  }
}

async function installFromModrinth(project: any) {
  installingSlug.value = project.slug
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

      // Download required dependencies
      const dependencies = validVersion.dependencies || []
      const requiredDeps = dependencies.filter((d: any) => d.dependency_type === 'required')

      for (const dep of requiredDeps) {
        // Skip if already installed
        if (dep.project_id && installedSlugs.value.has(dep.project_id)) continue

        try {
          // Get dependency project info
          const projectRes = await fetch(`https://api.modrinth.com/v2/project/${dep.project_id}`)
          const depProject = await projectRes.json()

          // Skip if already installed by slug
          if (depProject.slug && installedSlugs.value.has(depProject.slug)) continue

          // Get version (use specific version_id if provided, otherwise get latest compatible)
          let depVersion
          if (dep.version_id) {
            const versionRes = await fetch(`https://api.modrinth.com/v2/version/${dep.version_id}`)
            depVersion = await versionRes.json()
          } else {
            const depVersionsRes = await fetch(`https://api.modrinth.com/v2/project/${dep.project_id}/version?${params.toString()}`)
            const depVersions = await depVersionsRes.json()
            if (depVersions && depVersions.length > 0) {
              depVersion = depVersions[0]
            }
          }

          if (depVersion) {
            const depFile = depVersion.files.find((f: any) => f.primary) || depVersion.files[0]
            if (depFile) {
              await downloadAddon(depFile.url, depFile.filename)

              // Save dependency metadata
              installedAddonsMeta.value[depFile.filename] = {
                title: depProject.title,
                icon: depProject.icon_url,
                slug: depProject.slug
              }
            }
          }
        } catch (depError) {
          console.warn('Failed to install dependency:', dep.project_id, depError)
        }
      }

      await saveAddonsMeta()
      await loadAddons()
    }
  } catch (e) {
    console.error('Install failed', e)
  } finally {
    installingSlug.value = null
  }
}

async function downloadAddon(url: string, fileName: string) {
  const folder = serverFolderName.value
  const targetPath = `VoidLink/servers/${folder}/${addonsFolder.value}/${fileName}`

  const res = await fetch(url)
  const buffer = await res.arrayBuffer()

  await writeFile(targetPath, new Uint8Array(buffer), { baseDir: BaseDirectory.Document })
  // Note: loadAddons is called by caller usually, or we can leave it here if we want immediate feedback for simple downloads.
  // But to avoid double refresh with meta, caller handles it.
}

async function deleteAddon(fileName: string) {
  try {
    const folder = serverFolderName.value
    const path = `VoidLink/servers/${folder}/${addonsFolder.value}/${fileName}`
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

// --- Player Management Logic ---

async function loadPlayerLists() {
  loadingPlayers.value = true
  try {
    const folder = serverFolderName.value

    // Load whitelist.json
    try {
      const whitelistPath = `VoidLink/servers/${folder}/whitelist.json`
      if (await exists(whitelistPath, { baseDir: BaseDirectory.Document })) {
        const content = await readTextFile(whitelistPath, { baseDir: BaseDirectory.Document })
        whitelist.value = JSON.parse(content)
      } else {
        whitelist.value = []
      }
    } catch (e) {
      console.error('Failed to load whitelist', e)
      whitelist.value = []
    }

    // Load ops.json
    try {
      const opsPath = `VoidLink/servers/${folder}/ops.json`
      if (await exists(opsPath, { baseDir: BaseDirectory.Document })) {
        const content = await readTextFile(opsPath, { baseDir: BaseDirectory.Document })
        operators.value = JSON.parse(content)
      } else {
        operators.value = []
      }
    } catch (e) {
      console.error('Failed to load operators', e)
      operators.value = []
    }

    // Load banned-players.json
    try {
      const bannedPath = `VoidLink/servers/${folder}/banned-players.json`
      if (await exists(bannedPath, { baseDir: BaseDirectory.Document })) {
        const content = await readTextFile(bannedPath, { baseDir: BaseDirectory.Document })
        bannedPlayers.value = JSON.parse(content)
      } else {
        bannedPlayers.value = []
      }
    } catch (e) {
      console.error('Failed to load banned players', e)
      bannedPlayers.value = []
    }
  } catch (e) {
    console.error('Failed to load player lists', e)
  } finally {
    loadingPlayers.value = false
  }
}

async function saveWhitelist() {
  try {
    const folder = serverFolderName.value
    const path = `VoidLink/servers/${folder}/whitelist.json`
    await writeTextFile(path, JSON.stringify(whitelist.value, null, 2), { baseDir: BaseDirectory.Document })
  } catch (e) {
    console.error('Failed to save whitelist', e)
  }
}

async function saveOperators() {
  try {
    const folder = serverFolderName.value
    const path = `VoidLink/servers/${folder}/ops.json`
    await writeTextFile(path, JSON.stringify(operators.value, null, 2), { baseDir: BaseDirectory.Document })
  } catch (e) {
    console.error('Failed to save operators', e)
  }
}

async function saveBannedPlayers() {
  try {
    const folder = serverFolderName.value
    const path = `VoidLink/servers/${folder}/banned-players.json`
    await writeTextFile(path, JSON.stringify(bannedPlayers.value, null, 2), { baseDir: BaseDirectory.Document })
  } catch (e) {
    console.error('Failed to save banned players', e)
  }
}

async function fetchPlayerUUID(playerName: string): Promise<{ uuid: string, name: string } | null> {
  try {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${playerName}`)
    if (!res.ok) return null
    const data = await res.json()
    const id = data.id
    const uuid = `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
    return { uuid, name: data.name }
  } catch (e) {
    console.error('Failed to fetch UUID', e)
    return null
  }
}

async function addToWhitelist() {
  if (!newWhitelistPlayer.value.trim()) return

  const playerData = await fetchPlayerUUID(newWhitelistPlayer.value.trim())
  if (!playerData) return

  if (whitelist.value.some(e => e.uuid === playerData.uuid)) {
    newWhitelistPlayer.value = ''
    return
  }

  whitelist.value.push({ uuid: playerData.uuid, name: playerData.name })
  await saveWhitelist()
  newWhitelistPlayer.value = ''

  if (serverStatus.value === 'online' && serverProcess.value) {
    await serverProcess.value.write(`whitelist add ${playerData.name}\n`)
  }
}

async function removeFromWhitelist(uuid: string) {
  const entry = whitelist.value.find(e => e.uuid === uuid)
  whitelist.value = whitelist.value.filter(e => e.uuid !== uuid)
  await saveWhitelist()

  if (serverStatus.value === 'online' && serverProcess.value && entry) {
    await serverProcess.value.write(`whitelist remove ${entry.name}\n`)
  }
}

async function addOperator() {
  if (!newOperator.value.trim()) return

  const playerData = await fetchPlayerUUID(newOperator.value.trim())
  if (!playerData) return

  if (operators.value.some(e => e.uuid === playerData.uuid)) {
    newOperator.value = ''
    return
  }

  operators.value.push({ uuid: playerData.uuid, name: playerData.name, level: 4, bypassesPlayerLimit: false })
  await saveOperators()
  newOperator.value = ''

  if (serverStatus.value === 'online' && serverProcess.value) {
    await serverProcess.value.write(`op ${playerData.name}\n`)
  }
}

async function removeOperator(uuid: string) {
  const entry = operators.value.find(e => e.uuid === uuid)
  operators.value = operators.value.filter(e => e.uuid !== uuid)
  await saveOperators()

  if (serverStatus.value === 'online' && serverProcess.value && entry) {
    await serverProcess.value.write(`deop ${entry.name}\n`)
  }
}

async function banPlayer() {
  if (!newBannedPlayer.value.trim()) return

  const playerData = await fetchPlayerUUID(newBannedPlayer.value.trim())
  if (!playerData) return

  if (bannedPlayers.value.some(e => e.uuid === playerData.uuid)) {
    newBannedPlayer.value = ''
    banReason.value = ''
    return
  }

  bannedPlayers.value.push({
    uuid: playerData.uuid,
    name: playerData.name,
    created: new Date().toISOString(),
    source: 'VoidLink',
    expires: 'forever',
    reason: banReason.value || 'Banned by administrator'
  })
  await saveBannedPlayers()

  if (serverStatus.value === 'online' && serverProcess.value) {
    await serverProcess.value.write(`ban ${playerData.name} ${banReason.value || 'Banned by administrator'}\n`)
  }

  newBannedPlayer.value = ''
  banReason.value = ''
}

async function unbanPlayer(uuid: string) {
  const entry = bannedPlayers.value.find(e => e.uuid === uuid)
  bannedPlayers.value = bannedPlayers.value.filter(e => e.uuid !== uuid)
  await saveBannedPlayers()

  if (serverStatus.value === 'online' && serverProcess.value && entry) {
    await serverProcess.value.write(`pardon ${entry.name}\n`)
  }
}

// Quick actions for online players
async function kickPlayer(playerName: string) {
  if (serverStatus.value !== 'online' || !serverProcess.value) return
  await serverProcess.value.write(`kick ${playerName}\n`)
  // Refresh player list after kick
  setTimeout(() => fetchOnlinePlayers(), 500)
}

async function quickBan(playerName: string) {
  if (serverStatus.value !== 'online' || !serverProcess.value) return
  await serverProcess.value.write(`ban ${playerName} Banned via VoidLink\n`)
  // Refresh lists
  setTimeout(() => {
    fetchOnlinePlayers()
    loadPlayerLists()
  }, 500)
}

async function quickOp(playerName: string) {
  if (serverStatus.value !== 'online' || !serverProcess.value) return
  await serverProcess.value.write(`op ${playerName}\n`)
  // Refresh operators list
  setTimeout(() => loadPlayerLists(), 500)
}

async function quickWhitelist(playerName: string) {
  if (serverStatus.value !== 'online' || !serverProcess.value) return
  await serverProcess.value.write(`whitelist add ${playerName}\n`)
  // Refresh whitelist
  setTimeout(() => loadPlayerLists(), 500)
}

async function openServerFolder() {
  try {
    const folder = serverFolderName.value
    const relative = `VoidLink/servers/${folder}`
    const docDir = await documentDir()
    const fullPath = await join(docDir, relative)

    const os = await platform()
    if (os === 'windows') {
      const command = Command.create('run-bat', ['/C', 'start .'], { cwd: fullPath })
      await command.spawn()
    } else if (os === 'macos') {
      const command = Command.create('run-sh', ['-c', `open "${fullPath}"`])
      await command.spawn()
    } else {
      const command = Command.create('run-sh', ['-c', `xdg-open "${fullPath}"`])
      await command.spawn()
    }
  } catch (e) {
    console.error('Failed to open folder', e)
    consoleLines.value.push(`Failed to open folder: ${e}`)
  }
}

const tabs = computed(() => {
  const allTabs = [
    { label: 'Performance', icon: 'i-lucide-activity', value: 'performance', slot: 'performance' as const },
    { label: 'Console', icon: 'i-lucide-terminal', value: 'console', slot: 'console' as const },
    { label: 'Settings', icon: 'i-lucide-settings', value: 'settings', slot: 'settings' as const },
    { label: 'Mods/Plugins', icon: 'i-lucide-package', value: 'addons', slot: 'addons' as const },
    { label: 'Players', icon: 'i-lucide-users', value: 'players', slot: 'players' as const },
    { label: 'Backups', icon: 'i-lucide-archive', value: 'backups', slot: 'backups' as const },
    { label: 'Crash Reports', icon: 'i-lucide-file-warning', value: 'crash-reports', slot: 'crash-reports' as const }
  ]

  if (!addonsFolder.value) {
    return allTabs.filter(t => t.value !== 'mods')
  }

  return allTabs
})

const selectedTab = ref('performance')

watch(selectedTab, async () => {
  const tab = selectedTab.value
  if (!tab) return

  // Scroll console to bottom when switching to console tab
  if (tab === 'console') {
    await nextTick()
    if (consoleRef.value) {
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight
    }
  }

  if (tab === 'players' && whitelist.value.length === 0 && operators.value.length === 0 && bannedPlayers.value.length === 0) {
    loadPlayerLists()
    fetchOnlinePlayers()
  }
  if (tab === 'mods' && !Object.keys(addons.value).length) {
    loadAddons()
  }
  if (tab === 'crash-reports') {
    loadCrashReports()
  }
  if (tab === 'backups' && backupList.value.length === 0) {
    loadBackupList()
    loadBackupSettings()
    loadAvailableBackupFolders()
  }
})

// --- Initialization ---

let statsInterval: any | null = null

onMounted(async () => {
  selectedTab.value = 'performance' // Ensure Console is selected by default
  await loadData()
  loadAddons() // Load addons after server data is loaded

  // Start stats polling
  statsInterval = setInterval(() => {
    if (serverStatus.value === 'online' || serverStatus.value === 'starting') {
      serverProcessStore.refreshProcessInfo(serverId as string)
    }
  }, 2000)
})

onUnmounted(() => {
  if (statsInterval) clearInterval(statsInterval)
})

async function changeServerIcon() {
  try {
    const selected = await openDialog({
      multiple: false,
      filters: [{
        name: 'Image',
        extensions: ['png', 'jpg', 'jpeg']
      }]
    })

    if (Array.isArray(selected) || !selected) return

    const folder = serverFolderName.value
    // Destination: VoidLink/servers/<id>/server-logo.png
    const iconRelPath = `VoidLink/servers/${folder}/server-logo.png`

    await copyFile(selected, iconRelPath, { toPathBaseDir: BaseDirectory.Document })

    // Update state
    const bytes = await readFile(iconRelPath, { baseDir: BaseDirectory.Document })
    const blob = new Blob([bytes], { type: 'image/png' })
    updateServerIconUrl(blob)

    console.log('Icon updated')
  } catch (e) {
    console.error('Failed to change icon', e)
    toast.add({ title: 'Failed to update icon', description: String(e), color: 'error' })
  }
}

async function loadData() {
  loading.value = true
  try {
    const folder = serverFolderName.value // e.g., "myserver-xyz789"

    // 1. Load server.json
    try {
      // Using plain path string construction because join from fs plugin was deprecated/moved
      const metaPath = `VoidLink/servers/${folder}/server.json`
      const metaContent = await readTextFile(metaPath, { baseDir: BaseDirectory.Document })
      server.value = JSON.parse(metaContent)
      serverName.value = server.value.name || ''

      // Load global settings for defaults
      let globalSettings = { memory: 4, path: 'java', flags: '' }
      try {
        const globalContent = await readTextFile('VoidLink/settings.json', { baseDir: BaseDirectory.Document })
        const gData = JSON.parse(globalContent)
        if (gData) {
          globalSettings = { ...globalSettings, ...gData, memory: gData.defaultMemory, flags: gData.defaultFlags }
        }
      } catch (e) { /* ignore */ }

      // Load saved settings if exist, else use globals
      if (server.value.javaSettings) {
        javaSettings.memory = server.value.javaSettings.memory ?? globalSettings.memory
        javaSettings.path = server.value.javaSettings.path ?? (globalSettings.path || 'java')
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
      const propsPath = `VoidLink/servers/${folder}/server.properties`
      const propsContent = await readTextFile(propsPath, { baseDir: BaseDirectory.Document })
      rawProperties.value = propsContent
      parsedProperties.value = parseProperties(propsContent)
    } catch (e) {
      console.log('No server.properties found (maybe not started yet?)')
      // Populate with defaults if empty so user can edit before start
      parsedProperties.value = getDefaultProperties()
    }

    // 3. Get system RAM for slider max
    try {
      const sysInfo = await invoke<{ total_memory_bytes: number }>('get_system_info')
      systemRamGB.value = Math.floor(sysInfo.total_memory_bytes / (1024 * 1024 * 1024))
    } catch (e) {
      console.log('Failed to check sys info', e)
    }

    // 4. Load Custom Icon
    try {
      const iconPath = `VoidLink/servers/${folder}/server-logo.png`
      if (await exists(iconPath, { baseDir: BaseDirectory.Document })) {
        const bytes = await readFile(iconPath, { baseDir: BaseDirectory.Document })
        const blob = new Blob([bytes], { type: 'image/png' })
        updateServerIconUrl(blob)
      } else {
        if (serverIconUrl.value) URL.revokeObjectURL(serverIconUrl.value)
        serverIconUrl.value = null
      }
    } catch (e) {
      console.error('Failed to load server icon', e)
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
  content.split('\n').forEach((line) => {
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
    'motd': 'A Minecraft Server',
    'enable-rcon': 'true',
    'rcon.port': '25575',
    'broadcast-rcon-to-ops': 'false',
    'rcon.password': 'voidlink'
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
  'enable-rcon': { type: 'boolean', group: 'Network' },
  'rcon.port': { type: 'number', group: 'Network' },
  'rcon.password': { type: 'text', group: 'Network' },
  'view-distance': { type: 'number', group: 'Performance' },
  'simulation-distance': { type: 'number', group: 'Performance' },

  'motd': { type: 'text', group: 'General' },
  'level-name': { type: 'text', group: 'General' },
  'level-seed': { type: 'text', group: 'General' }
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
  Object.keys(groups).forEach((k) => {
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
  const strVal = String(value)
  parsedProperties.value[key] = strVal
}

function updateAccessProperty(key: string, value: boolean) {
  updateProperty(key, value)
  if (key === 'white-list' && value === false) {
    updateProperty('enforce-whitelist', false)
  }
}

// --- Saving ---

async function saveAllSettings() {
  saving.value = true
  try {
    const folder = serverFolderName.value

    // 1. Save server.json (Name & Java Settings)
    server.value.javaSettings = { ...javaSettings }
    server.value.name = serverName.value
    const metaPath = `VoidLink/servers/${folder}/server.json`
    await writeTextFile(metaPath, JSON.stringify(server.value, null, 2), { baseDir: BaseDirectory.Document })

    // 2. Save server.properties
    let content = '#Minecraft server properties\n#Generated by VoidLink\n'
    Object.entries(parsedProperties.value).forEach(([key, val]) => {
      content += `${key}=${val}\n`
    })
    const propsPath = `VoidLink/servers/${folder}/server.properties`
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

async function savePropertiesFromEditor() {
  try {
    const folder = serverFolderName.value
    const propsPath = `VoidLink/servers/${folder}/server.properties`

    // Save raw content
    await writeTextFile(propsPath, propertiesEditorContent.value, { baseDir: BaseDirectory.Document })

    // Update local state
    rawProperties.value = propertiesEditorContent.value

    // Re-parse properties
    const lines = propertiesEditorContent.value.split('\n')
    const parsed: Record<string, string> = {}
    for (const line of lines) {
      if (line.startsWith('#') || !line.includes('=')) continue
      const [key, ...rest] = line.split('=')
      parsed[key.trim()] = rest.join('=').trim()
    }
    parsedProperties.value = parsed

    // Close modal
    showPropertiesEditor.value = false

    console.log('Properties saved from editor')
  } catch (e) {
    console.error('Failed to save properties from editor', e)
  }
}

// --- Modpack Updates ---

async function checkModpackUpdate() {
  if (!server.value?.modpack?.id || server.value.modpack.id === 'custom') return

  checkingUpdate.value = true
  try {
    const res = await fetch(`https://api.modrinth.com/v2/project/${server.value.modpack.id}/version`)
    const versions = await res.json()

    if (versions.length > 0) {
      const latest = versions.find((v: any) => v.version_type === 'release') || versions[0]

      // Check if version is different from current
      // Assuming server.value.modpack.versionId matches modrinth version ID
      if (latest.id !== server.value.modpack.versionId) {
        updateAvailable.value = true
        updateData.value = latest
        showUpdateModal.value = true
      } else {
        console.log('Modpack is up to date')
        // Optional: toast logic here
      }
    }
  } catch (e) {
    console.error('Failed to check updates', e)
  } finally {
    checkingUpdate.value = false
  }
}

async function performModpackUpdate() {
  if (!updateData.value) return

  isUpdating.value = true
  try {
    // 1. Stop server if running
    if (serverStatus.value !== 'offline' && serverProcess.value) {
      await stopServer()
      // Wait for stop
      let retries = 0
      while (serverStatus.value !== 'offline' && retries < 20) {
        await new Promise(r => setTimeout(r, 500))
        retries++
      }
    }

    const folder = serverFolderName.value
    const relativePath = `VoidLink/servers/${folder}`
    const fullServerPath = await join(await documentDir(), relativePath)

    // 2. Clean mods and config folders
    // Note: This is destructive but standard for modpack updates
    const modsPath = await join(fullServerPath, 'mods')
    if (await exists(modsPath, { baseDir: BaseDirectory.Document })) {
      await remove(modsPath, { baseDir: BaseDirectory.Document, recursive: true })
    }

    const configPath = await join(fullServerPath, 'config')
    if (await exists(configPath, { baseDir: BaseDirectory.Document })) {
      await remove(configPath, { baseDir: BaseDirectory.Document, recursive: true })
    }

    // 3. Install new version
    // Find primary file
    const file = updateData.value.files.find((f: any) => f.primary) || updateData.value.files[0]
    if (!file) throw new Error('No file found for update version')

    // Determine loader (fallback to fabric if not set, or keep existing)
    const loader = server.value.modpack.loader || 'fabric'

    const result = await installModpack(file.url, relativePath, (msg) => {
      console.log('Update progress:', msg)
    })

    // 4. Update metadata
    server.value.modpack.versionId = updateData.value.id
    if (updateData.value.name) server.value.modpack.versionName = updateData.value.name
    server.value.modpack.updated = new Date().toISOString()

    if (result && result.files) {
      server.value.files = result.files
      server.value.dependencies = result.dependencies

      // Save addons.json
      if (result.metadata && Object.keys(result.metadata).length > 0) {
        const addonsPath = await join(fullServerPath, 'addons.json')
        await writeTextFile(addonsPath, JSON.stringify(result.metadata, null, 2), { baseDir: BaseDirectory.Document })
      }
    }

    await saveAllSettings()

    showUpdateModal.value = false
    updateAvailable.value = false

    // Refresh UI/Data via save logic
  } catch (e) {
    console.error('Failed to update modpack', e)
  } finally {
    isUpdating.value = false
  }
}

// --- Crash Reports ---
interface CrashReport {
  name: string
  path: string
  created: number
  content?: string
}

const crashReports = ref<CrashReport[]>([])
const loadingReports = ref(false)
const showReportModal = ref(false)
const viewingReport = ref<CrashReport | null>(null)
const reportContent = ref('')

async function loadCrashReports() {
  loadingReports.value = true
  try {
    const folder = serverFolderName.value
    const docDir = await documentDir()
    const fullServerPath = await join(docDir, 'VoidLink', 'servers', folder)

    crashReports.value = await invoke('list_crash_reports_cmd', { serverPath: fullServerPath })
  } catch (e) {
    console.error('Failed to load crash reports', e)
  } finally {
    loadingReports.value = false
  }
}

async function openCrashReport(report: CrashReport) {
  viewingReport.value = report
  reportContent.value = 'Loading...'
  showReportModal.value = true

  try {
    reportContent.value = await invoke('read_crash_report_cmd', { path: report.path })
  } catch (e) {
    reportContent.value = `Failed to read report: ${e}`
  }
}

// --- Status Logic ---
const statusBgClass = computed(() => {
  switch (serverStatus.value) {
    case 'online': return 'bg-success-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
    case 'starting': return 'bg-warning-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
    case 'stopping': return 'bg-warning-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
    default: return 'bg-neutral-500'
  }
})

function copyId() {
  if (server.value?.id) {
    navigator.clipboard.writeText(server.value.id)
      .then(() => console.log('Copied ID'))
      .catch(e => console.error('Copy failed', e))
  }
}

// --- Server Process Management Functions ---

async function startServer() {
  if (serverStatus.value !== 'offline') return

  // 1. Check EULA
  const folder = serverFolderName.value
  const eulaPath = `VoidLink/servers/${folder}/eula.txt`

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

  // --- Voice Chat Auto-Config ---
  try {
    if (!tunnelStore.tunnels.length) {
      await tunnelStore.fetchTunnels()
    }

    const voiceTunnel = tunnelStore.activeTunnels.find(t =>
      t.ports.some(p => p.protocol === 'udp' && p.label.toLowerCase().includes('voice'))
    )

    if (voiceTunnel) {
      const voicePort = voiceTunnel.ports.find(p => p.protocol === 'udp' && p.label.toLowerCase().includes('voice'))
      if (voicePort) {
        // Determine path based on server type
        const type = server.value?.type || 'fabric'
        const isPluginServer = ['paper', 'purpur', 'spigot', 'bukkit', 'velocity', 'folia'].includes(type)
        const configBase = isPluginServer ? 'plugins/voicechat' : 'config/voicechat'

        const configPath = `VoidLink/servers/${folder}/${configBase}/voicechat-server.properties`
        if (await exists(configPath, { baseDir: BaseDirectory.Document })) {
          let content = await readTextFile(configPath, { baseDir: BaseDirectory.Document })

          // Update port
          if (content.match(/^port=/m)) {
            content = content.replace(/^port=.*$/m, `port=${voicePort.public_port}`)
          } else {
            content += `\nport=${voicePort.public_port}`
          }

          // Update voice_host
          // voiceTunnel.full_address is usually sub.domain.com
          if (content.match(/^voice_host=/m)) {
            content = content.replace(/^voice_host=.*$/m, `voice_host=${voiceTunnel.full_address}`)
          } else {
            content += `\nvoice_host=${voiceTunnel.full_address}`
          }

          await writeTextFile(configPath, content, { baseDir: BaseDirectory.Document })
          consoleLines.value.push(`[Auto-Config] Updated Voice Chat config: Port ${voicePort.public_port}, Host ${voiceTunnel.full_address}`)
        }
      }
    }
  } catch (e) {
    console.warn('Voice Chat auto-config failed', e)
  }
  // ------------------------------

  serverStatus.value = 'starting'
  consoleLines.value.length = 0
  consoleLines.value.push('Starting server...')

  try {
    const folder = serverFolderName.value
    const serverPath = `VoidLink/servers/${folder}`
    const fullServerPath = await join(await documentDir(), 'VoidLink', 'servers', folder)

    // Detect platform
    const isWindows = navigator.userAgent.includes('Windows')

    // Load global settings for Java installations
    let javaInstallations: any = {}
    try {
      const settingsContent = await readTextFile('VoidLink/settings.json', { baseDir: BaseDirectory.Document })
      const globalSettings = JSON.parse(settingsContent)
      javaInstallations = globalSettings.javaInstallations || {}
    } catch (e) {
      console.log('No global settings, using default java')
    }

    // Auto-select Java path based on MC version
    // If path is default 'java' or empty, try auto-detection
    let javaPath = javaSettings.path

    if (!javaPath || javaPath === 'java') {
      // Load global settings for Java installations (manual configs)
      let javaInstallations: any = {}
      try {
        const settingsContent = await readTextFile('VoidLink/settings.json', { baseDir: BaseDirectory.Document })
        const globalSettings = JSON.parse(settingsContent)
        javaInstallations = globalSettings.javaInstallations || {}
      } catch (e) {
        console.log('No global settings found')
      }

      // Scan system for auto-detected Javas
      await scanJava()

      // Merge manually configured Javas from Settings into installations
      const manualJavas: any[] = []
      if (javaInstallations.java8) {
        const validation = await validateJavaPath(javaInstallations.java8)
        if (validation.is_valid) {
          manualJavas.push({ path: javaInstallations.java8, major: 8, version: validation.version, is_valid: true })
        }
      }
      if (javaInstallations.java11) {
        const validation = await validateJavaPath(javaInstallations.java11)
        if (validation.is_valid) {
          manualJavas.push({ path: javaInstallations.java11, major: 11, version: validation.version, is_valid: true })
        }
      }
      if (javaInstallations.java17) {
        const validation = await validateJavaPath(javaInstallations.java17)
        if (validation.is_valid) {
          manualJavas.push({ path: javaInstallations.java17, major: 17, version: validation.version, is_valid: true })
        }
      }
      if (javaInstallations.java21) {
        const validation = await validateJavaPath(javaInstallations.java21)
        if (validation.is_valid) {
          manualJavas.push({ path: javaInstallations.java21, major: 21, version: validation.version, is_valid: true })
        }
      }
      if (javaInstallations.java25) {
        const validation = await validateJavaPath(javaInstallations.java25)
        if (validation.is_valid) {
          manualJavas.push({ path: javaInstallations.java25, major: 25, version: validation.version, is_valid: true })
        }
      }

      // Merge: remove duplicates, prefer manual configs
      const mergedInstallations = [...manualJavas]
      for (const detected of installations.value) {
        if (!mergedInstallations.some(m => m.path === detected.path)) {
          mergedInstallations.push(detected)
        }
      }

      // 1. Determine Required Java Version from MC version
      // LEGACY FORMAT: 1.X.Y (e.g., 1.18.2, 1.21.11)
      // NEW FORMAT: YY.X (e.g., 25.10, 26.1, 26.1-snapshot-2)
      //
      // Legacy rules:
      //   MC < 1.17 -> Java 8 (max 8)
      //   MC 1.17 - 1.20.4 -> Java 17 (max 17)
      //   MC >= 1.20.5 -> Java 21+ (no max)
      //
      // New format (25.X+): All require Java 21+

      const v = server.value.version || ''
      let requiredMajor = 8
      let maxMajor = 8 // Strict by default

      // Parse MC version
      if (v) {
        // Remove snapshot/pre-release suffix for parsing
        const cleanVersion = v.split('-')[0] // "26.1-snapshot-2" -> "26.1"
        const parts = cleanVersion.split('.').map(Number) // [26, 1] or [1, 21, 11]

        if (parts.length >= 1) {
          const firstNum = parts[0]

          // Detect new format: first number >= 25 (year 2025+)
          if (firstNum >= 25) {
            // NEW FORMAT: 25.X, 26.X, etc.
            const secondNum = parts[1] || 0

            if (firstNum >= 27 || (firstNum === 26 && secondNum >= 1)) {
              // MC 26.1+ requires Java 25
              requiredMajor = 25
              maxMajor = 999
              consoleLines.value.push(`Detected new MC version format: ${v} -> Java 25+`)
            } else {
              // MC 25.X, 26.0 -> Java 21
              requiredMajor = 21
              maxMajor = 999
              consoleLines.value.push(`Detected new MC version format: ${v} -> Java 21+`)
            }
          } else if (firstNum === 1) {
            // LEGACY FORMAT: 1.X.Y
            const minor = parts[1] || 0
            const patch = parts[2] || 0

            if (minor < 17) {
              requiredMajor = 8
              maxMajor = 8
            } else if (minor >= 17 && (minor < 20 || (minor === 20 && patch < 5))) {
              requiredMajor = 17
              maxMajor = 17
            } else {
              // 1.20.5+ or 1.21+
              requiredMajor = 21
              maxMajor = 999
            }
            consoleLines.value.push(`Detected legacy MC version: ${v} -> Java ${requiredMajor} (max ${maxMajor === 999 ? 'any' : maxMajor})`)
          } else {
            // Unknown format - assume newest Java
            consoleLines.value.push(`Warning: Unknown MC version format: ${v}. Assuming Java 21+`)
            requiredMajor = 21
            maxMajor = 999
          }
        }
      }

      // DEBUG: Log what Java installations were found
      consoleLines.value.push(`DEBUG: Found ${mergedInstallations.length} Java installation(s) (system + manual)`)
      mergedInstallations.forEach((j) => {
        consoleLines.value.push(`  - Java ${j.major} at ${j.path} (valid: ${j.is_valid})`)
      })

      const bestJava = getJavaForVersion(mergedInstallations, requiredMajor, maxMajor)
      if (bestJava) {
        javaPath = bestJava.path
        consoleLines.value.push(`Auto-detected Java ${bestJava.major} (${bestJava.version}) at ${javaPath}`)
      } else {
        consoleLines.value.push(`Warning: No optimal Java found for MC ${v}. Requires Java ${requiredMajor} (max ${maxMajor === 999 ? 'any' : maxMajor}). Using system default.`)
        javaPath = 'java'
      }
    } else {
      // Validating custom path
      const validation = await validateJavaPath(javaPath)
      if (!validation.is_valid) {
        consoleLines.value.push(`Warning: Configured Java path is invalid: ${validation.error || 'Unknown error'}`)
        // Fallback? Or fail? Let's just warn and try anyway or fail.
      } else {
        consoleLines.value.push(`Using Configured Java: ${validation.version} (${validation.arch})`)
      }
    }

    consoleLines.value.push(`Selected Java Path: ${javaPath}`)

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
    javaArgs.push('-jar', 'server.jar', 'nogui')

    // Generate start script for manual use
    const fullJavaCmd = `"${javaPath}" ${javaArgs.join(' ')}`
    const scriptContent = isWindows
      ? `@echo off\ncd /d "${fullServerPath}"\n${fullJavaCmd}\npause\n`
      : `#!/bin/bash\ncd "${fullServerPath}"\n${fullJavaCmd}\n`
    const scriptPath = `${serverPath}/${isWindows ? 'start.bat' : 'start.sh'}`
    await writeTextFile(scriptPath, scriptContent, { baseDir: BaseDirectory.Document })
    consoleLines.value.push(`Generated ${isWindows ? 'start.bat' : 'start.sh'}`)

    consoleLines.value.push(`Executing: "${javaPath}" ${javaArgs.join(' ')}`)

    // Use run-bat (Windows) or run-sh (Unix) to execute explicit java path
    // Because 'run-java' forces system java
    let cmd: Command
    if (isWindows) {
      // cmd /C path/to/java args...
      // Pass arguments separately. run-bat maps to `cmd` and args are passed as-is (except for /C)
      // Tauri will quote arguments that contain spaces automatically.
      cmd = Command.create('run-bat', ['/C', javaPath, ...javaArgs], { cwd: fullServerPath })
    } else {
      // sh arguments
      cmd = Command.create('run-sh', ['-c', `"${javaPath}" ${javaArgs.join(' ')}`], { cwd: fullServerPath })
    }

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
      // Filter RCON spam
      if (line.includes('Thread RCON Client /127.0.0.1')) return

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
  // Try using Child handle first, fallback to persisted PID
  const pid = serverStore.getPid(storeServerId.value)

  if (serverProcess.value) {
    await serverProcess.value.kill()
    consoleLines.value.push('Server killed by user.')
  } else if (pid) {
    // No Child handle (e.g., after F5 refresh) - use Rust kill command
    await invoke('kill_process', { pid })
    consoleLines.value.push('Server killed by user (via PID).')
  }

  serverStatus.value = 'offline'
}

async function acceptEula() {
  try {
    const folder = serverFolderName.value
    const eulaPath = `VoidLink/servers/${folder}/eula.txt`
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

    const path = `VoidLink/servers/${folder}`
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
</script>

<style scoped>
  @media (prefers-color-scheme: dark) {
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

  }

  @media (prefers-color-scheme: light) {
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #dcebff;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #9bb2d6;
      border-radius: 4px;
    }

  }

</style>
