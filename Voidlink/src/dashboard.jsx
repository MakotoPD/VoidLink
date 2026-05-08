// Dashboard, Activity, Marketplace, Account & Plan, Port Forwarding pages.

const { useState: useStateD, useEffect: useEffectD, useMemo: useMemoD } = React;

// Sparkline
const Spark = ({ data, color = 'currentColor', w = 100, h = 36 }) => {
  if (!data || !data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const pts2 = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polygon points={pts2} fill={color} opacity="0.12" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
};

const Stat = ({ label, value, unit, trend, sparkData, sparkColor, icon }) => (
  <div className="stat">
    <div className="stat-label">
      {icon && <Icon d={icon} size={12} />}
      {label}
    </div>
    <div className="stat-value">{value}{unit && <span className="unit">{unit}</span>}</div>
    {trend && (
      <div className="stat-trend">
        {trend.delta && <span className={`delta ${trend.dir}`}>{trend.dir === 'up' ? '↑' : '↓'} {trend.delta}</span>}
        <span>{trend.label}</span>
      </div>
    )}
    {sparkData && <Spark data={sparkData} color={sparkColor || 'var(--accent)'} />}
  </div>
);

// Server card on dashboard
const DashServerCard = ({ server, onClick }) => (
  <div className="server-card" onClick={onClick}>
    <div className="sc-head">
      <div className="sc-icon" style={{
        background: `linear-gradient(135deg, ${server.color}33, ${server.color}11)`,
        border: `1px solid ${server.color}40`, color: server.color,
      }}>{server.glyph}</div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', gap: 8}}>
          <h4 className="sc-name">{server.name}</h4>
          <span className={`pill ${server.online ? 'ok' : 'bad'}`}><span className="dot" />{server.online ? 'Running' : 'Offline'}</span>
        </div>
        <div className="sc-meta">
          <span className="text-mono">{server.engine} · v{server.version}</span>
          {server.online && <span>• up {server.uptime}</span>}
        </div>
      </div>
      <button className="btn ghost icon-only sm" onClick={(e) => { e.stopPropagation(); }} title="More">
        <Icon d={I.more} size={14} />
      </button>
    </div>

    <div className="sc-stats">
      <div className="sc-stat"><div className="l">CPU</div><div className="v">{server.online ? server.cpu.toFixed(1) + '%' : '—'}</div></div>
      <div className="sc-stat"><div className="l">RAM</div><div className="v">{server.online ? `${(server.ram/1024).toFixed(1)}/${(server.ramMax/1024).toFixed(0)}G` : '—'}</div></div>
      <div className="sc-stat"><div className="l">Players</div><div className="v">{server.online ? `${server.players}/${server.maxPlayers}` : '—'}</div></div>
    </div>

    <div className="sc-addr">
      <span className="l">{server.publicAddress ? 'Public' : 'Local'}</span>
      <span className="v">{server.publicAddress || server.address}</span>
    </div>
  </div>
);

const Dashboard = ({ servers, onSelectServer, onCreate }) => {
  const onlineCount = servers.filter(s => s.online).length;
  const totalCpu = servers.reduce((a,s) => a + (s.online ? s.cpu : 0), 0);
  const totalRam = servers.reduce((a,s) => a + (s.online ? s.ram : 0), 0);
  const totalPlayers = servers.reduce((a,s) => a + (s.online ? s.players : 0), 0);
  const totalMaxPlayers = servers.reduce((a,s) => a + s.maxPlayers, 0);
  const sysRam = 64 * 1024;

  // Generate fake spark data
  const cpuSpark = useMemoD(() => Array.from({length: 30}, (_,i) => 20 + 15 * Math.sin(i/3) + Math.random() * 10), []);
  const ramSpark = useMemoD(() => Array.from({length: 30}, (_,i) => 30 + 8 * Math.sin(i/4) + Math.random() * 5), []);
  const playersSpark = useMemoD(() => Array.from({length: 30}, (_,i) => 4 + 3 * Math.sin(i/2) + Math.random() * 2), []);

  return (
    <div className="main-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow">Workspace</div>
          <h1 className="page-title" style={{marginTop: 6}}>
            Good afternoon, <span className="accent-italic">commander</span>
          </h1>
          <div className="page-sub">
            {onlineCount > 0
              ? `${onlineCount} of ${servers.length} servers running · ${totalPlayers} player${totalPlayers===1?'':'s'} online`
              : `${servers.length} server${servers.length===1?'':'s'} configured · all offline`}
          </div>
        </div>
        <div style={{display:'flex', gap: 8}}>
          <button className="btn ghost"><Icon d={I.command} size={14} />Search<span className="tag-mono" style={{marginLeft:6}}>⌘K</span></button>
          <button className="btn primary" onClick={onCreate}><Icon d={I.plus} size={14} />New Server</button>
        </div>
      </div>

      <div className="grid-4 mb-24">
        <Stat
          label="Active Servers"
          value={onlineCount}
          unit={` / ${servers.length}`}
          trend={{ label: 'past 24h', delta: '+1', dir: 'up' }}
          icon={I.servers}
        />
        <Stat
          label="Total CPU"
          value={totalCpu.toFixed(1)}
          unit="%"
          sparkData={cpuSpark}
          sparkColor="var(--accent)"
          trend={{ label: 'avg last hour', delta: totalCpu > 30 ? 'busy' : 'idle', dir: totalCpu > 30 ? 'up' : 'down' }}
          icon={I.cpu}
        />
        <Stat
          label="Total RAM"
          value={(totalRam/1024).toFixed(1)}
          unit={` GB / ${(sysRam/1024).toFixed(0)}`}
          sparkData={ramSpark}
          sparkColor="var(--purple)"
          trend={{ label: `${((totalRam/sysRam)*100).toFixed(0)}% allocated` }}
          icon={I.ram}
        />
        <Stat
          label="Players Online"
          value={totalPlayers}
          unit={` / ${totalMaxPlayers}`}
          sparkData={playersSpark}
          sparkColor="var(--ok)"
          trend={{ label: 'peak 12 today', delta: '+3', dir: 'up' }}
          icon={I.users}
        />
      </div>

      <div style={{display:'grid', gridTemplateColumns: '2fr 1fr', gap: 24}}>
        <div>
          <div className="between mb-12">
            <h3 className="section-title"><Icon d={I.servers} size={14} />Your Servers</h3>
            <div style={{display:'flex', gap: 6}}>
              <button className="btn ghost sm"><Icon d={I.filter} size={12} />Filter</button>
              <button className="btn ghost sm"><Icon d={I.grid} size={12} /></button>
            </div>
          </div>
          <div className="grid-2">
            {servers.map(s => <DashServerCard key={s.id} server={s} onClick={() => onSelectServer(s.id)} />)}
            <div className="server-card" style={{borderStyle:'dashed', alignItems:'center', justifyContent:'center', minHeight: 230, cursor:'pointer'}} onClick={onCreate}>
              <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap: 12, color:'var(--ink-2)'}}>
                <div style={{width: 44, height: 44, borderRadius: 12, background:'var(--bg-3)', border:'1px solid var(--line-2)', display:'grid', placeItems:'center'}}>
                  <Icon d={I.plus} size={20} />
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{color:'var(--ink-0)', fontWeight: 500, fontSize: 14}}>New Server</div>
                  <div style={{fontSize: 12, marginTop: 2}}>Vanilla, Paper, Modpack…</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="section-title mb-12"><Icon d={I.pulse} size={14} />Live Activity</h3>
          <div className="card">
            {ACTIVITY_FEED.slice(0, 8).map((a, i) => (
              <div key={i} style={{display:'flex', alignItems:'flex-start', gap: 12, padding:'12px 16px', borderBottom: i < 7 ? '1px solid var(--line-1)' : 'none'}}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: a.kind==='warn'||a.kind==='crash' ? 'var(--bad-soft)' : a.kind==='backup' ? 'var(--purple-soft)' : a.kind==='join' ? 'var(--ok-soft)' : 'var(--bg-3)',
                  color: a.kind==='warn'||a.kind==='crash' ? 'var(--bad)' : a.kind==='backup' ? 'var(--purple)' : a.kind==='join' ? 'var(--ok)' : 'var(--ink-2)',
                  display:'grid', placeItems:'center',
                }}>
                  <Icon d={I[a.icon] || I.info} size={13} />
                </div>
                <div style={{flex:1, minWidth: 0}}>
                  <div style={{fontSize: 12, color:'var(--ink-0)', lineHeight: 1.4}}>{a.text}</div>
                  <div style={{fontSize: 11, color:'var(--ink-3)', marginTop: 2, fontFamily:'Geist Mono, monospace'}}>
                    {a.time} · {a.server}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="section-title mb-12 mt-24"><Icon d={I.network} size={14} />System</h3>
          <div className="card card-pad">
            <div style={{display:'flex', flexDirection:'column', gap: 12}}>
              <div className="between">
                <span className="text-dim" style={{fontSize: 12}}>Java</span>
                <span className="text-mono" style={{fontSize: 12}}>21.0.10 · Temurin</span>
              </div>
              <div className="between">
                <span className="text-dim" style={{fontSize: 12}}>System RAM</span>
                <span className="text-mono" style={{fontSize: 12}}>64 GB</span>
              </div>
              <div className="between">
                <span className="text-dim" style={{fontSize: 12}}>Disk free</span>
                <span className="text-mono" style={{fontSize: 12}}>284 GB</span>
              </div>
              <div className="between">
                <span className="text-dim" style={{fontSize: 12}}>Network</span>
                <span className="pill ok" style={{fontSize:10}}><span className="dot" />Online</span>
              </div>
              <div className="between">
                <span className="text-dim" style={{fontSize: 12}}>Plan</span>
                <span className="pill accent" style={{fontSize:10}}><Icon d={I.crown} size={10} />Pro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity feed (cross-server)
const ActivityFeed = () => {
  const [filter, setFilter] = useStateD('all');
  const filtered = filter === 'all' ? ACTIVITY_FEED : ACTIVITY_FEED.filter(a => a.kind === filter);
  return (
    <div className="main-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow">Workspace</div>
          <h1 className="page-title" style={{marginTop: 6}}>Activity</h1>
          <div className="page-sub">Cross-server events, joins, warnings, backups.</div>
        </div>
        <div style={{display:'flex', gap: 6}}>
          {[['all','All'],['join','Joins'],['warn','Warnings'],['backup','Backups'],['crash','Crashes'],['system','System']].map(([k, l]) => (
            <button key={k} className={`btn ${filter===k?'':'ghost'} sm`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card">
        {filtered.map((a, i) => (
          <div key={i} style={{display:'flex', alignItems:'center', gap: 16, padding:'14px 22px', borderBottom: i < filtered.length - 1 ? '1px solid var(--line-1)' : 'none'}}>
            <span className="text-mono text-faint" style={{minWidth: 110, fontSize: 11}}>{a.time}</span>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: a.kind==='warn'||a.kind==='crash' ? 'var(--bad-soft)' : a.kind==='backup' ? 'var(--purple-soft)' : a.kind==='join' ? 'var(--ok-soft)' : 'var(--bg-3)',
              color: a.kind==='warn'||a.kind==='crash' ? 'var(--bad)' : a.kind==='backup' ? 'var(--purple)' : a.kind==='join' ? 'var(--ok)' : 'var(--ink-2)',
              display:'grid', placeItems:'center', flexShrink: 0,
            }}><Icon d={I[a.icon] || I.info} size={14} /></div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize: 13, color:'var(--ink-0)'}}>{a.text}</div>
              <div className="text-faint text-mono" style={{fontSize: 11, marginTop: 2}}>{a.server}</div>
            </div>
            <span className={`pill ${a.kind==='warn'||a.kind==='crash' ? 'bad' : a.kind==='join' ? 'ok' : a.kind==='backup' ? 'purple' : ''}`}>{a.kind}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Marketplace — browse plugins/mods
const Marketplace = ({ onInstall }) => {
  const [q, setQ] = useStateD('');
  const [tab, setTab] = useStateD('all');
  const filtered = MARKETPLACE.filter(m =>
    (tab==='all' || m.tag.toLowerCase()===tab) &&
    (m.name.toLowerCase().includes(q.toLowerCase()) || m.desc.toLowerCase().includes(q.toLowerCase()))
  );
  const cats = ['all','utility','permissions','security','integration','building','map','api','compatibility'];
  return (
    <div className="main-inner wide">
      <div className="page-head">
        <div>
          <div className="eyebrow">Discover</div>
          <h1 className="page-title" style={{marginTop: 6}}>Marketplace</h1>
          <div className="page-sub">Search plugins, mods, modpacks. Install with one click.</div>
        </div>
      </div>

      <div style={{display:'flex', gap: 12, marginBottom: 20, alignItems:'center'}}>
        <div style={{flex:1, position:'relative'}}>
          <Icon d={I.search} size={14} style={{position:'absolute', left: 12, top: 11, color:'var(--ink-3)'}} />
          <input className="input" placeholder="Search by name, author, or description…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft: 34}} />
        </div>
        <button className="btn ghost"><Icon d={I.upload} size={14} />Upload .jar</button>
      </div>

      <div className="tabs" style={{marginBottom: 22}}>
        {cats.map(c => (
          <button key={c} className={`tab ${tab===c?'active':''}`} onClick={() => setTab(c)} style={{textTransform:'capitalize'}}>{c}</button>
        ))}
      </div>

      <div className="grid-3">
        {filtered.map(m => (
          <div key={m.id} className="plugin-card">
            <div className="pc-head">
              <div className="pc-icon" style={{background: `${m.color}22`, color: m.color, border:`1px solid ${m.color}44`}}>{m.name[0]}</div>
              <div style={{flex:1, minWidth:0}}>
                <h4 className="pc-name">{m.name}</h4>
                <div className="pc-author">by {m.author}</div>
              </div>
              <span className="pill">{m.tag}</span>
            </div>
            <div className="pc-desc">{m.desc}</div>
            <div className="pc-foot">
              <span className="text-mono text-faint" style={{fontSize: 11, display:'flex', alignItems:'center', gap: 4}}>
                <Icon d={I.download} size={11} />{m.downloads}
              </span>
              <span className="text-mono text-faint" style={{fontSize: 11, display:'flex', alignItems:'center', gap: 4}}>
                <Icon d={I.star} size={11} />{m.rating}
              </span>
              <button className="btn primary sm" style={{marginLeft:'auto'}} onClick={() => onInstall && onInstall(m)}>
                <Icon d={I.download} size={12} />Install
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Port Forwarding + Subscription
const PortForwarding = ({ onUpgrade }) => {
  const [signedIn, setSignedIn] = useStateD(true);
  const [enabled, setEnabled] = useStateD(true);

  return (
    <div className="main-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow">Connectivity</div>
          <h1 className="page-title" style={{marginTop: 6}}>Port <span className="accent-italic">Forwarding</span></h1>
          <div className="page-sub">Expose your local servers to the internet without router setup.</div>
        </div>
        <span className="pill ok" style={{fontSize:11}}><span className="dot" />Tunnel active</span>
      </div>

      {!signedIn ? (
        <div className="card card-pad" style={{textAlign:'center', padding: 60}}>
          <Icon d={I.network} size={32} style={{color:'var(--ink-3)', marginBottom: 16}} />
          <h3 style={{margin:0}}>Sign in to enable port forwarding</h3>
          <p className="text-dim" style={{marginTop: 6, maxWidth: 420, marginLeft:'auto', marginRight:'auto'}}>
            VoidLink uses our managed tunnel to give your servers public addresses. No router config needed.
          </p>
          <button className="btn primary" style={{marginTop: 18}} onClick={() => setSignedIn(true)}>
            <Icon d={I.user} size={14} />Sign in to VoidLink
          </button>
        </div>
      ) : (
        <>
          <div className="grid-3 mb-24">
            <Stat label="Active Tunnels" value="2" unit=" / 3" icon={I.network} trend={{label: 'free port available'}} />
            <Stat label="Plan" value="Pro" icon={I.crown} trend={{label: '3 ports · unmetered'}} />
            <Stat label="Bandwidth" value="142" unit=" GB" icon={I.activity} trend={{label: 'this month · unlimited'}} />
          </div>

          <h3 className="section-title mb-12"><Icon d={I.network} size={14} />Active Forwards</h3>
          <div className="card mb-24">
            {[
              { name: 'Vault SMP', local: '192.168.50.6:25565', public: 'play.voidlink.io:25565', status: 'forwarded', color: '#38bdf8' },
              { name: 'creative-lab', local: '192.168.50.6:25566', public: 'lab.voidlink.io:25566', status: 'forwarded', color: '#a78bfa' },
            ].map((f, i, arr) => (
              <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 80px', gap: 16, padding:'16px 22px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-1)' : 'none', alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap: 10}}>
                  <span style={{width: 8, height: 8, borderRadius:'50%', background: f.color, boxShadow: `0 0 8px ${f.color}`}} />
                  <span style={{fontWeight: 500}}>{f.name}</span>
                </div>
                <div className="text-mono text-dim" style={{fontSize: 12}}>
                  <div className="text-faint" style={{fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase'}}>Local</div>
                  {f.local}
                </div>
                <div className="text-mono" style={{fontSize: 12}}>
                  <div className="text-faint" style={{fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase'}}>Public</div>
                  <span style={{color:'var(--accent)'}}>{f.public}</span>
                </div>
                <div style={{display:'flex', gap: 4, justifyContent:'flex-end'}}>
                  <button className="btn ghost icon-only sm"><Icon d={I.copy} size={12} /></button>
                  <button className="btn ghost icon-only sm"><Icon d={I.x} size={12} /></button>
                </div>
              </div>
            ))}
          </div>

          <h3 className="section-title mb-12"><Icon d={I.crown} size={14} />Subscription Plans</h3>
          <div className="grid-3">
            <div className="tier-card">
              <div className="tier-name">Free</div>
              <div className="tier-price">$0<span className="per"> /mo</span></div>
              <ul className="tier-list">
                <li><Icon d={I.check} size={14} />1 forwarded port</li>
                <li><Icon d={I.check} size={14} />20 GB / mo bandwidth</li>
                <li><Icon d={I.check} size={14} />Random subdomain</li>
                <li><Icon d={I.x} size={14} style={{color:'var(--ink-4)'}} />No custom domain</li>
              </ul>
            </div>
            <div className="tier-card featured">
              <div style={{position:'absolute', top:14, right:14}}><span className="pill accent" style={{fontSize:10}}><Icon d={I.crown} size={10} />Current</span></div>
              <div className="tier-name">Pro</div>
              <div className="tier-price">$8<span className="per"> /mo</span></div>
              <ul className="tier-list">
                <li><Icon d={I.check} size={14} />3 forwarded ports</li>
                <li><Icon d={I.check} size={14} />Unmetered bandwidth</li>
                <li><Icon d={I.check} size={14} />Custom subdomain (*.voidlink.io)</li>
                <li><Icon d={I.check} size={14} />Priority routing</li>
              </ul>
            </div>
            <div className="tier-card">
              <div className="tier-name">Network</div>
              <div className="tier-price">$24<span className="per"> /mo</span></div>
              <ul className="tier-list">
                <li><Icon d={I.check} size={14} />10 forwarded ports</li>
                <li><Icon d={I.check} size={14} />Bring your own domain</li>
                <li><Icon d={I.check} size={14} />Geo-routed PoPs</li>
                <li><Icon d={I.check} size={14} />DDoS protection</li>
              </ul>
              <button className="btn primary" style={{width:'100%', justifyContent:'center', marginTop: 16}} onClick={onUpgrade}>Upgrade</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

window.Dashboard = Dashboard;
window.ActivityFeed = ActivityFeed;
window.Marketplace = Marketplace;
window.PortForwarding = PortForwarding;
window.Spark = Spark;
window.Stat = Stat;
