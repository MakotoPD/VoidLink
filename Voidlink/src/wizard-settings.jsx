// Server hero (header above tabs), Create Server Wizard, Global Settings, App router.

const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA } = React;

// Server hero — banner with status and actions
const ServerHero = ({ server, onToggle, onAction }) => {
  const accent = server.color;
  return (
    <div className="server-hero" style={{
      background: `radial-gradient(ellipse 80% 100% at 0% 0%, ${accent}22 0%, transparent 60%), linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)`,
      borderColor: `${accent}33`,
    }}>
      <div className="hero-inner">
        <div className="hero-icon" style={{background: `${accent}22`, border:`1px solid ${accent}55`, color: accent}}>
          {server.glyph}
        </div>
        <div style={{flex:1, minWidth: 0}}>
          <div className="row gap-8" style={{marginBottom: 6}}>
            <span className={`pill ${server.online ? 'ok' : ''}`} style={{fontSize: 10}}>
              <span className="dot" />{server.online ? 'Running' : 'Stopped'}
            </span>
            <span className="text-faint text-mono" style={{fontSize: 11}}>{server.engine} · v{server.version} · {server.gamemode}</span>
          </div>
          <h1 className="hero-name">{server.name}</h1>
          <div className="hero-meta">
            <span className="row gap-6"><Icon d={I.network} size={12} />{server.publicAddress || server.address}</span>
            <span className="row gap-6"><Icon d={I.users} size={12} />{server.online ? `${server.players}/${server.maxPlayers}` : `0/${server.maxPlayers}`} players</span>
            <span className="row gap-6"><Icon d={I.bolt} size={12} />{server.online ? `${server.tps.toFixed(2)} TPS` : 'idle'}</span>
            {server.online && <span className="row gap-6"><Icon d={I.activity} size={12} />up {server.uptime}</span>}
          </div>
        </div>
        <div className="hero-actions">
          {server.online ? (
            <>
              <button className="btn warn" onClick={onToggle}><Icon d={I.pause} size={14} />Stop</button>
              <button className="btn ghost"><Icon d={I.refresh} size={14} />Restart</button>
            </>
          ) : (
            <button className="btn success" onClick={onToggle}><Icon d={I.play} size={14} />Start Server</button>
          )}
          <button className="btn ghost icon-only"><Icon d={I.copy} size={14} /></button>
          <button className="btn ghost icon-only"><Icon d={I.more} size={14} /></button>
        </div>
      </div>
    </div>
  );
};

// === Create Server Wizard ===
const ENGINES = [
  { id:'paper', name:'Paper', desc:'Most popular. Plugin-friendly fork of Spigot. Best perf for SMPs.', tag:'Plugins', color:'#f97316', popular: true },
  { id:'vanilla', name:'Vanilla', desc:'Pure Mojang server. No plugins, no surprises.', tag:'Pure', color:'#94a3b8' },
  { id:'fabric', name:'Fabric', desc:'Lightweight modding. Fast updates after MC releases.', tag:'Mods', color:'#a78bfa' },
  { id:'forge', name:'Forge', desc:'Most modpacks built on Forge. Great mod ecosystem.', tag:'Mods', color:'#10b981' },
  { id:'neoforge', name:'NeoForge', desc:'Modern Forge fork. Active development.', tag:'Mods', color:'#22d3ee' },
  { id:'purpur', name:'Purpur', desc:'Paper fork with extra config knobs and patches.', tag:'Plugins', color:'#c084fc' },
  { id:'modpack', name:'Modpack', desc:'Install a packaged set of mods (CurseForge / Modrinth).', tag:'Curated', color:'#f59e0b' },
  { id:'bedrock', name:'Bedrock', desc:'Cross-platform Pocketmine server.', tag:'Bedrock', color:'#06b6d4' },
];

const VERSIONS = ['1.21.4','1.21.3','1.21.1','1.20.6','1.20.4','1.20.1','1.19.4','1.19.2','1.18.2','1.16.5'];

const CreateWizard = ({ onCancel, onCreate }) => {
  const [step, setStep] = useStateA(0);
  const [engine, setEngine] = useStateA('paper');
  const [version, setVersion] = useStateA('1.21.4');
  const [name, setName] = useStateA('');
  const [seed, setSeed] = useStateA('');
  const [gamemode, setGamemode] = useStateA('survival');
  const [difficulty, setDifficulty] = useStateA('normal');
  const [maxPlayers, setMaxPlayers] = useStateA(20);
  const [pvp, setPvp] = useStateA(true);
  const [hardcore, setHardcore] = useStateA(false);
  const [whitelist, setWhitelist] = useStateA(true);
  const [ram, setRam] = useStateA(4096);
  const [autoStart, setAutoStart] = useStateA(false);
  const [exposeNet, setExposeNet] = useStateA(false);
  const [eulaOk, setEulaOk] = useStateA(false);
  const steps = ['Engine','Version','World','Network','Review'];
  const selectedEngine = ENGINES.find(e => e.id === engine);

  const next = () => setStep(s => Math.min(steps.length - 1, s + 1));
  const prev = () => setStep(s => Math.max(0, s - 1));
  const canNext = (() => {
    if (step === 0) return !!engine;
    if (step === 1) return !!version;
    if (step === 2) return name.trim().length > 0;
    if (step === 4) return eulaOk;
    return true;
  })();

  return (
    <div className="main-inner">
      <div className="row gap-12 mb-16">
        <button className="btn ghost icon-only sm" onClick={onCancel}><Icon d={I.arrowLeft} size={14} /></button>
        <div>
          <div className="eyebrow">New Server</div>
          <h1 className="page-title" style={{marginTop: 4}}>Create a <span className="accent-italic">Minecraft</span> server</h1>
        </div>
      </div>

      {/* Step nav */}
      <div className="wizard-steps">
        {steps.map((s, i) => (
          <div key={s} className={`wz-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} onClick={() => i < step && setStep(i)}>
            <div className="wz-num">{i < step ? <Icon d={I.check} size={12} /> : i + 1}</div>
            <span>{s}</span>
            {i < steps.length - 1 && <div className="wz-line" />}
          </div>
        ))}
      </div>

      <div className="wizard-body">
        {step === 0 && (
          <>
            <h3 className="section-title mb-12">Pick an engine</h3>
            <div className="text-dim mb-24" style={{fontSize: 13}}>Each engine has different mod/plugin support. You can change this later, but only via reinstall.</div>
            <div className="grid-3">
              {ENGINES.map(e => (
                <div key={e.id} className={`engine-card ${engine === e.id ? 'sel' : ''}`} onClick={() => setEngine(e.id)} style={{borderColor: engine===e.id ? e.color : 'var(--line-1)'}}>
                  {e.popular && <span className="badge-popular">Popular</span>}
                  <div className="eng-icon" style={{background: `${e.color}22`, color: e.color, border:`1px solid ${e.color}44`}}>
                    {e.name[0]}
                  </div>
                  <h4>{e.name}</h4>
                  <p className="text-dim" style={{fontSize: 12, lineHeight: 1.5, marginTop: 6}}>{e.desc}</p>
                  <span className="pill mt-12" style={{fontSize: 10}}>{e.tag}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="section-title mb-12">Choose Minecraft version</h3>
            <div className="text-dim mb-24" style={{fontSize: 13}}>For <strong style={{color:'var(--ink-0)'}}>{selectedEngine.name}</strong>. Latest is recommended unless you need compatibility with a specific modpack.</div>
            <div className="grid-4">
              {VERSIONS.map((v, i) => (
                <div key={v} className={`version-card ${version === v ? 'sel' : ''}`} onClick={() => setVersion(v)}>
                  {i === 0 && <span className="badge-popular" style={{background:'var(--ok-soft)', color:'var(--ok)'}}>Latest</span>}
                  <div className="vc-version">{v}</div>
                  <div className="vc-info">
                    <span>Released</span>
                    <span className="text-mono">{['Mar 26','Dec 19','Oct 8','Aug 7','Apr 29','Jun 7','Mar 16','Aug 5','Mar 1','Jan 14'][i]}</span>
                  </div>
                  <div className="vc-info">
                    <span>Build</span>
                    <span className="text-mono">#{523 - i*40}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="section-title mb-12">World & Gameplay</h3>
            <div className="text-dim mb-24" style={{fontSize: 13}}>Name your server, set the rules of your world.</div>
            <div className="grid-2">
              <div className="col gap-16">
                <div className="field">
                  <label>Server name</label>
                  <input className="input" placeholder="My Awesome Server" value={name} onChange={e=>setName(e.target.value)} autoFocus />
                  <span className="hint">Shown to players in the multiplayer list.</span>
                </div>
                <div className="field">
                  <label>World seed (optional)</label>
                  <div style={{display:'flex', gap: 8}}>
                    <input className="input mono" placeholder="Leave blank for random" value={seed} onChange={e=>setSeed(e.target.value)} />
                    <button className="btn ghost" onClick={() => setSeed(String(Math.floor(Math.random() * 9e18)))}><Icon d={I.refresh} size={14} /></button>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field"><label>Gamemode</label>
                    <select className="select" value={gamemode} onChange={e=>setGamemode(e.target.value)}>
                      <option value="survival">Survival</option><option value="creative">Creative</option><option value="adventure">Adventure</option>
                    </select>
                  </div>
                  <div className="field"><label>Difficulty</label>
                    <select className="select" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
                      <option>peaceful</option><option>easy</option><option>normal</option><option>hard</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Max players</label>
                  <div style={{display:'flex', gap: 8, alignItems:'center'}}>
                    <input type="range" min="1" max="100" value={maxPlayers} onChange={e=>setMaxPlayers(+e.target.value)} style={{flex:1, accentColor:'var(--accent)'}} />
                    <input className="input mono" type="number" value={maxPlayers} onChange={e=>setMaxPlayers(+e.target.value)} style={{width: 80}} />
                  </div>
                </div>
              </div>

              <div className="col gap-12">
                {[
                  ['PvP','Players can attack each other', pvp, setPvp],
                  ['Hardcore', 'Death = permanent ban from world', hardcore, setHardcore],
                  ['Whitelist', 'Only approved players can join', whitelist, setWhitelist],
                ].map(([l, d, v, s], i) => (
                  <div key={i} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'var(--bg-2)', border:'1px solid var(--line-1)', borderRadius: 10}}>
                    <div>
                      <div style={{fontSize: 13, fontWeight: 500}}>{l}</div>
                      <div className="text-faint" style={{fontSize: 11, marginTop: 2}}>{d}</div>
                    </div>
                    <div className={`toggle ${v?'on':''}`} onClick={() => s(!v)} />
                  </div>
                ))}

                <div className="card card-pad" style={{background:'var(--accent-soft)', borderColor:'var(--accent-line)'}}>
                  <div className="row gap-8 mb-8" style={{color:'var(--accent)', fontWeight: 500, fontSize: 13}}>
                    <Icon d={I.info} size={14} />Tip
                  </div>
                  <div className="text-dim" style={{fontSize: 12, lineHeight: 1.6}}>
                    Hardcore + whitelist makes a great long-running SMP. Death stakes feel real but griefers can't ruin it.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="section-title mb-12">Network & Resources</h3>
            <div className="text-dim mb-24" style={{fontSize: 13}}>Allocate RAM and decide how to expose the server.</div>

            <div className="card card-pad mb-16">
              <div className="between mb-12">
                <div>
                  <h4 style={{margin: 0, fontSize: 14}}>RAM allocation</h4>
                  <div className="text-faint" style={{fontSize: 12, marginTop: 2}}>Reserved for the JVM heap. System has 64 GB total.</div>
                </div>
                <div className="text-mono" style={{fontSize: 28, fontWeight: 600, color:'var(--accent)'}}>{(ram/1024).toFixed(0)} GB</div>
              </div>
              <input type="range" min="1024" max={32*1024} step="1024" value={ram} onChange={e=>setRam(+e.target.value)} style={{width:'100%', accentColor:'var(--accent)'}} />
              <div className="between text-mono text-faint" style={{fontSize: 11, marginTop: 6}}>
                <span>1 GB · vanilla small</span>
                <span>4–8 GB · plugins / SMP</span>
                <span>16+ GB · modpack</span>
              </div>
            </div>

            <h4 style={{fontSize: 13, color:'var(--ink-1)', marginBottom: 8}}>Connection</h4>
            <div className="grid-2 mb-16">
              <div
                className={`engine-card ${!exposeNet ? 'sel' : ''}`}
                onClick={() => setExposeNet(false)}
                style={{cursor:'pointer', padding: 18}}
              >
                <Icon d={I.lock} size={22} style={{color: !exposeNet ? 'var(--accent)' : 'var(--ink-3)', marginBottom: 10}} />
                <h4 style={{fontSize: 14}}>Local only</h4>
                <p className="text-dim" style={{fontSize: 12, lineHeight: 1.5, marginTop: 6}}>LAN play only. Friends on the same network can join.</p>
              </div>
              <div
                className={`engine-card ${exposeNet ? 'sel' : ''}`}
                onClick={() => setExposeNet(true)}
                style={{cursor:'pointer', padding: 18, position:'relative'}}
              >
                <span className="badge-popular" style={{background:'var(--accent-soft)', color:'var(--accent)'}}>Recommended</span>
                <Icon d={I.network} size={22} style={{color: exposeNet ? 'var(--accent)' : 'var(--ink-3)', marginBottom: 10}} />
                <h4 style={{fontSize: 14}}>Public via VoidLink Tunnel</h4>
                <p className="text-dim" style={{fontSize: 12, lineHeight: 1.5, marginTop: 6}}>Get a public address (xyz.voidlink.io). No router setup.</p>
              </div>
            </div>

            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'var(--bg-2)', border:'1px solid var(--line-1)', borderRadius: 10}}>
              <div>
                <div style={{fontSize: 13, fontWeight: 500}}>Auto-start with VoidLink</div>
                <div className="text-faint" style={{fontSize: 11, marginTop: 2}}>Start this server when the app launches.</div>
              </div>
              <div className={`toggle ${autoStart?'on':''}`} onClick={() => setAutoStart(!autoStart)} />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3 className="section-title mb-12">Review and create</h3>
            <div className="text-dim mb-24" style={{fontSize: 13}}>Confirm your settings. The server will be created in <span className="text-mono">~/voidlink/servers/{name || 'new-server'}</span>.</div>

            <div className="grid-2">
              <div className="card card-pad col gap-12">
                <div className="row gap-12">
                  <div style={{width: 48, height: 48, borderRadius: 12, background: `${selectedEngine.color}22`, color: selectedEngine.color, border:`1px solid ${selectedEngine.color}55`, display:'grid', placeItems:'center', fontSize: 20, fontWeight: 600}}>{selectedEngine.name[0]}</div>
                  <div>
                    <div style={{fontSize: 16, fontWeight: 600}}>{name || 'My Server'}</div>
                    <div className="text-mono text-faint" style={{fontSize: 12, marginTop: 2}}>{selectedEngine.name} · v{version}</div>
                  </div>
                </div>
                <hr style={{border: 'none', borderTop: '1px solid var(--line-1)', margin:'4px 0'}} />
                {[
                  ['Gamemode', gamemode],
                  ['Difficulty', difficulty],
                  ['Max players', maxPlayers],
                  ['PvP', pvp ? 'enabled' : 'disabled'],
                  ['Hardcore', hardcore ? 'enabled' : 'disabled'],
                  ['Whitelist', whitelist ? 'enabled' : 'disabled'],
                  ['World seed', seed || 'random'],
                  ['RAM', `${(ram/1024).toFixed(0)} GB`],
                  ['Network', exposeNet ? 'public via tunnel' : 'local only'],
                  ['Auto-start', autoStart ? 'yes' : 'no'],
                ].map(([k, v]) => (
                  <div key={k} className="between" style={{fontSize: 13}}>
                    <span className="text-dim">{k}</span>
                    <span className="text-mono" style={{color:'var(--ink-0)'}}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="col gap-16">
                <div className="card card-pad">
                  <h4 style={{margin: 0, fontSize: 14, marginBottom: 12}}>What happens next</h4>
                  <ol style={{paddingLeft: 18, color:'var(--ink-1)', fontSize: 13, lineHeight: 1.8, margin: 0}}>
                    <li>Download the <strong>{selectedEngine.name} {version}</strong> jar (~38 MB)</li>
                    <li>Generate <span className="text-mono">server.properties</span> with your settings</li>
                    <li>Generate the world (this takes 30–60s)</li>
                    {exposeNet && <li>Allocate a public tunnel address</li>}
                    <li>{autoStart ? 'Start the server' : 'Stop and wait for you to start'}</li>
                  </ol>
                </div>
                <div className="card card-pad" style={{background: 'var(--warn-soft)', borderColor:'rgba(245,158,11,0.25)'}}>
                  <label style={{display:'flex', alignItems:'flex-start', gap: 12, cursor:'pointer'}}>
                    <input type="checkbox" checked={eulaOk} onChange={e=>setEulaOk(e.target.checked)} style={{marginTop: 2, accentColor:'var(--accent)'}} />
                    <div>
                      <div style={{fontSize: 13, fontWeight: 500, color: 'var(--warn)'}}>I accept the Minecraft EULA</div>
                      <div className="text-dim" style={{fontSize: 12, marginTop: 4, lineHeight: 1.6}}>
                        Required by Mojang. <span style={{color:'var(--accent)'}}>Read the EULA →</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="wizard-foot">
        <button className="btn ghost" onClick={step === 0 ? onCancel : prev}>{step === 0 ? 'Cancel' : <><Icon d={I.arrowLeft} size={14} />Back</>}</button>
        <div className="text-faint" style={{fontSize: 12}}>Step {step + 1} of {steps.length}</div>
        {step < steps.length - 1 ? (
          <button className="btn primary" onClick={next} disabled={!canNext}>Continue<Icon d={I.arrowRight} size={14} /></button>
        ) : (
          <button className="btn success" onClick={() => onCreate({
            engine, version, name: name || 'New Server', seed, gamemode, difficulty, maxPlayers, pvp, hardcore, whitelist, ram, autoStart, exposeNet,
          })} disabled={!canNext}><Icon d={I.check} size={14} />Create Server</button>
        )}
      </div>
    </div>
  );
};

// === Global Settings ===
const GlobalSettings = () => {
  const [tab, setTab] = useStateA('general');
  return (
    <div className="main-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow">Preferences</div>
          <h1 className="page-title" style={{marginTop: 6}}>Settings</h1>
          <div className="page-sub">VoidLink app preferences. Server settings live on each server's page.</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'200px 1fr', gap: 32}}>
        <div className="settings-nav">
          {[
            ['general','General', I.settings],
            ['account','Account & Plan', I.user],
            ['java','Java', I.cpu],
            ['network','Network', I.network],
            ['notify','Notifications', I.bell],
            ['shortcuts','Shortcuts', I.command],
            ['about','About', I.info],
          ].map(([k, l, ic]) => (
            <button key={k} className={`s-nav ${tab===k?'active':''}`} onClick={() => setTab(k)}>
              <Icon d={ic} size={14} /><span>{l}</span>
            </button>
          ))}
        </div>

        <div className="col gap-20">
          {tab === 'general' && <>
            <div className="card">
              <div className="card-head"><h4><Icon d={I.settings} size={14} />Appearance</h4></div>
              <div className="card-pad col gap-16">
                <div className="field">
                  <label>Theme</label>
                  <div style={{display:'flex', gap: 10}}>
                    {[['dark','Dark', '#0d1117'],['midnight','Midnight', '#020617'],['light','Light', '#fafaf9']].map(([k, l, c]) => (
                      <div key={k} style={{flex:1, padding: 14, border: `1px solid ${k==='dark'?'var(--accent)':'var(--line-1)'}`, borderRadius: 10, cursor:'pointer', background: k==='dark' ? 'var(--accent-soft)' : 'transparent'}}>
                        <div style={{height: 60, borderRadius: 6, background: c, marginBottom: 8, border:'1px solid var(--line-1)'}}></div>
                        <div style={{fontSize: 13, fontWeight: 500}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Sidebar density</label>
                  <select className="select" defaultValue="comfortable"><option>comfortable</option><option>compact</option><option>spacious</option></select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h4><Icon d={I.folder} size={14} />Storage</h4></div>
              <div className="card-pad col gap-16">
                <div className="field">
                  <label>Data directory</label>
                  <div style={{display:'flex', gap: 8}}>
                    <input className="input mono" defaultValue="~/voidlink" readOnly />
                    <button className="btn ghost"><Icon d={I.folder} size={14} />Browse</button>
                  </div>
                  <span className="hint">All servers, backups and configs are stored here. 284 GB free.</span>
                </div>
                <div className="field">
                  <label>Default RAM for new servers</label>
                  <select className="select" defaultValue="4"><option value="2">2 GB</option><option value="4">4 GB</option><option value="6">6 GB</option><option value="8">8 GB</option></select>
                </div>
              </div>
            </div>
          </>}

          {tab === 'account' && <>
            <div className="card card-pad">
              <div className="row gap-16">
                <div style={{width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #a78bfa)', display:'grid', placeItems:'center', fontSize: 24, fontWeight: 600, color: 'white'}}>Y</div>
                <div style={{flex:1}}>
                  <h3 style={{margin: 0, fontSize: 18}}>commander</h3>
                  <div className="text-mono text-dim" style={{fontSize: 13, marginTop: 4}}>commander@voidlink.io</div>
                  <div className="row gap-8" style={{marginTop: 8}}>
                    <span className="pill accent"><Icon d={I.crown} size={11} />Pro plan</span>
                    <span className="text-faint" style={{fontSize: 12}}>since Mar 2026</span>
                  </div>
                </div>
                <button className="btn ghost"><Icon d={I.edit} size={14} />Edit</button>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h4><Icon d={I.crown} size={14} />Pro · $8/mo</h4><button className="btn ghost sm">Manage subscription</button></div>
              <div className="card-pad col gap-12">
                <div className="between">
                  <span className="text-dim" style={{fontSize: 13}}>Tunnels used</span>
                  <span className="text-mono">2 / 3</span>
                </div>
                <div style={{height: 6, background:'var(--bg-3)', borderRadius: 999, overflow:'hidden'}}>
                  <div style={{height:'100%', width:'66%', background:'var(--accent)', borderRadius: 999}} />
                </div>
                <div className="between" style={{marginTop: 4}}>
                  <span className="text-dim" style={{fontSize: 13}}>Bandwidth this month</span>
                  <span className="text-mono">142 GB · unlimited</span>
                </div>
                <div className="between">
                  <span className="text-dim" style={{fontSize: 13}}>Next charge</span>
                  <span className="text-mono">$8.00 on Jun 4, 2026</span>
                </div>
                <hr style={{border:'none', borderTop:'1px solid var(--line-1)', margin: '8px 0'}} />
                <div className="row gap-8">
                  <button className="btn primary"><Icon d={I.crown} size={14} />Upgrade to Network</button>
                  <button className="btn ghost"><Icon d={I.download} size={14} />Download invoices</button>
                  <button className="btn ghost" style={{marginLeft:'auto', color:'var(--bad)'}}>Cancel plan</button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h4><Icon d={I.shield} size={14} />Security</h4></div>
              <div className="card-pad col gap-12">
                <div className="between">
                  <div><div style={{fontSize: 13, fontWeight: 500}}>Two-factor auth</div><div className="text-faint" style={{fontSize: 11, marginTop: 2}}>Currently using authenticator app</div></div>
                  <span className="pill ok" style={{fontSize: 10}}><span className="dot" />enabled</span>
                </div>
                <div className="between">
                  <div><div style={{fontSize: 13, fontWeight: 500}}>API tokens</div><div className="text-faint" style={{fontSize: 11, marginTop: 2}}>1 active token · last used 2 days ago</div></div>
                  <button className="btn ghost sm">Manage</button>
                </div>
              </div>
            </div>
          </>}

          {tab === 'java' && <div className="card">
            <div className="card-head"><h4><Icon d={I.cpu} size={14} />Java Runtimes</h4><button className="btn primary sm"><Icon d={I.plus} size={12} />Install Runtime</button></div>
            <div>
              {[
                {ver:'Java 21', vendor:'Temurin', path:'/Library/Java/JavaVirtualMachines/temurin-21.jdk', current: true},
                {ver:'Java 17', vendor:'Temurin', path:'/Library/Java/JavaVirtualMachines/temurin-17.jdk'},
                {ver:'Java 8',  vendor:'Zulu', path:'/Library/Java/JavaVirtualMachines/zulu-8.jdk'},
              ].map((j, i, arr) => (
                <div key={j.ver} style={{display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 14, padding:'14px 22px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-1)' : 'none', alignItems:'center'}}>
                  <div style={{width: 36, height: 36, borderRadius: 8, background: 'var(--bg-3)', display:'grid', placeItems:'center', fontFamily:'Geist Mono, monospace', fontWeight: 600, color:'var(--accent)'}}>{j.ver.split(' ')[1]}</div>
                  <div>
                    <div style={{fontSize: 13, fontWeight: 500}}>{j.ver} {j.current && <span className="pill ok" style={{fontSize: 10, marginLeft: 8}}><span className="dot"/>active</span>}</div>
                    <div className="text-mono text-faint" style={{fontSize: 11, marginTop: 2}}>{j.vendor} · {j.path}</div>
                  </div>
                  <div className="row gap-4">
                    {!j.current && <button className="btn ghost sm">Use</button>}
                    <button className="btn ghost icon-only sm"><Icon d={I.trash} size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>}

          {tab === 'network' && <div className="card card-pad col gap-16">
            <div className="field"><label>Outbound proxy</label><input className="input" placeholder="None" /></div>
            <div className="field"><label>Tunnel region</label><select className="select" defaultValue="auto"><option value="auto">Automatic (lowest latency)</option><option>US East</option><option>US West</option><option>EU West</option><option>AP Southeast</option></select></div>
          </div>}

          {tab === 'notify' && <div className="card card-pad col gap-12">
            {[
              ['Server crashes', 'Show OS notification when a server crashes', true],
              ['Player joins', 'Notify when a player joins any server', false],
              ['Backup completed', 'Confirm successful backups', true],
              ['Plugin updates', 'New versions available for installed plugins', true],
              ['Marketplace digest', 'Weekly summary of trending plugins', false],
            ].map(([l, d, v], i) => (
              <div key={i} className="between" style={{padding:'10px 0', borderBottom: i < 4 ? '1px solid var(--line-1)' : 'none'}}>
                <div><div style={{fontSize: 13, fontWeight: 500}}>{l}</div><div className="text-faint" style={{fontSize: 11, marginTop: 2}}>{d}</div></div>
                <div className={`toggle ${v?'on':''}`} />
              </div>
            ))}
          </div>}

          {tab === 'shortcuts' && <div className="card">
            {[
              ['Open command palette', '⌘K'],
              ['New server', '⌘N'],
              ['Toggle sidebar', '⌘B'],
              ['Focus console', '⌘L'],
              ['Start/stop selected server', '⌘↵'],
              ['Search', '⌘/'],
            ].map(([l, k], i, a) => (
              <div key={l} className="between" style={{padding:'14px 22px', borderBottom: i < a.length - 1 ? '1px solid var(--line-1)' : 'none'}}>
                <span style={{fontSize: 13}}>{l}</span>
                <kbd style={{fontFamily:'Geist Mono, monospace', fontSize: 12, padding:'4px 8px', background:'var(--bg-3)', border:'1px solid var(--line-1)', borderRadius: 6}}>{k}</kbd>
              </div>
            ))}
          </div>}

          {tab === 'about' && <div className="card card-pad" style={{textAlign:'center'}}>
            <div style={{display:'inline-flex', alignItems:'center', justifyContent:'center', width: 64, height: 64, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), var(--purple))', marginBottom: 16}}>
              <Logo size={32} mono />
            </div>
            <h2 style={{margin: 0, fontFamily:'Instrument Serif, serif', fontWeight: 400, fontSize: 28}}>VoidLink</h2>
            <div className="text-mono text-faint" style={{marginTop: 4, fontSize: 12}}>v1.4.2 · build 8821 · darwin-arm64</div>
            <p className="text-dim" style={{maxWidth: 360, margin: '20px auto', fontSize: 13, lineHeight: 1.6}}>
              A native Minecraft server manager for friends. No webhost, no router config, no fuss.
            </p>
            <div className="row gap-8" style={{justifyContent:'center'}}>
              <button className="btn ghost"><Icon d={I.refresh} size={14} />Check for updates</button>
              <button className="btn ghost"><Icon d={I.external} size={14} />Release notes</button>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
};

window.ServerHero = ServerHero;
window.CreateWizard = CreateWizard;
window.GlobalSettings = GlobalSettings;
