// Shell: titlebar, primary rail (server list), secondary nav (context tabs).

const { useState, useEffect, useRef, useMemo } = React;

const Titlebar = ({ title }) => (
  <div className="titlebar">
    <div className="brand">
      <img src="assets/voidlink-logo.png" alt="" />
      <span>VoidLink</span>
      <span style={{color:'var(--ink-4)'}}>·</span>
      <span>{title}</span>
    </div>
    <div className="win-btns">
      <button className="win-btn" title="Minimize"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" /></svg></button>
      <button className="win-btn" title="Maximize"><svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" stroke="currentColor" fill="none" /></svg></button>
      <button className="win-btn close" title="Close"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" /></svg></button>
    </div>
  </div>
);

// Primary rail — Discord-style server list
const Rail = ({ servers, currentRoute, onNav, onSelectServer, onCreateServer }) => {
  const isHomeActive = currentRoute.type === 'dashboard' || currentRoute.type === 'activity' || currentRoute.type === 'marketplace';
  const isSettingsActive = currentRoute.type === 'settings';
  const isCreateActive = currentRoute.type === 'create';

  return (
    <div className="rail">
      <div className="rail-logo" title="VoidLink">
        <img src="assets/voidlink-logo.png" alt="VoidLink" />
      </div>

      <button
        className={`rail-item ${isHomeActive ? 'active' : ''}`}
        onClick={() => onNav({type:'dashboard'})}
        title="Dashboard"
      >
        <span className="pill" />
        <Icon d={I.grid} size={18} />
      </button>

      <div className="rail-divider" />

      {servers.map(s => {
        const isActive = currentRoute.type === 'server' && currentRoute.serverId === s.id;
        return (
          <button
            key={s.id}
            className={`rail-item ${s.online ? 'online' : ''} ${isActive ? 'active' : ''}`}
            onClick={() => onSelectServer(s.id)}
            title={s.name}
            style={isActive ? {} : { color: s.online ? s.color : 'var(--ink-2)' }}
          >
            <span className="pill" />
            <span className="glyph">{s.glyph}</span>
            <span className="status-dot" />
          </button>
        );
      })}

      <button
        className={`rail-add ${isCreateActive ? '' : ''}`}
        onClick={onCreateServer}
        title="Create server"
      >
        <Icon d={I.plus} size={18} />
      </button>

      <div className="rail-spacer" />

      <div className="rail-bottom">
        <button
          className={`rail-item ${currentRoute.type==='marketplace' ? 'active' : ''}`}
          onClick={() => onNav({type:'marketplace'})}
          title="Marketplace"
        ><span className="pill" /><Icon d={I.store} size={16} /></button>
        <button
          className={`rail-item ${currentRoute.type==='activity' ? 'active' : ''}`}
          onClick={() => onNav({type:'activity'})}
          title="Activity"
        ><span className="pill" /><Icon d={I.pulse} size={16} /></button>
        <button
          className={`rail-item ${isSettingsActive ? 'active' : ''}`}
          onClick={() => onNav({type:'settings'})}
          title="Global settings"
        ><span className="pill" /><Icon d={I.settings} size={16} /></button>
      </div>
    </div>
  );
};

// Secondary panel — content depends on route
const SecondaryPanel = ({ route, server, onTab, currentTab }) => {
  if (route.type === 'server' && server) {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: I.activity },
      { id: 'console', label: 'Console', icon: I.terminal },
      { id: 'players', label: 'Players', icon: I.users, count: server.online ? server.players : 0 },
      { id: 'plugins', label: 'Plugins & Mods', icon: I.package, count: 8 },
      { id: 'worldmap', label: 'World Map', icon: I.map },
      { id: 'files', label: 'Files', icon: I.folder },
      { id: 'backups', label: 'Backups', icon: I.archive, count: 6 },
      { id: 'schedules', label: 'Schedules', icon: I.calendar, count: 5 },
      { id: 'crashes', label: 'Crash Reports', icon: I.bug, count: server.crashCount },
      { id: 'settings', label: 'Settings', icon: I.settings },
    ];
    return (
      <div className="secondary">
        <div className="secondary-head">
          <div className="eyebrow">{server.engine} · {server.version}</div>
          <h3>{server.name}</h3>
          <div className="meta">
            <span className={`pill ${server.online ? 'ok' : 'bad'}`}><span className="dot" />{server.online ? 'Online' : 'Offline'}</span>
            <span className="pill">{server.publicAddress || server.address}</span>
          </div>
        </div>
        <div className="secondary-list">
          {tabs.map(t => (
            <button key={t.id} className={`nav-item ${currentTab===t.id?'active':''}`} onClick={() => onTab(t.id)}>
              <Icon d={t.icon} size={15} />
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && <span className="count">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (route.type === 'dashboard' || route.type === 'activity' || route.type === 'marketplace') {
    return (
      <div className="secondary">
        <div className="secondary-head">
          <div className="eyebrow">Workspace</div>
          <h3>Home</h3>
        </div>
        <div className="secondary-list">
          <button className={`nav-item ${route.type==='dashboard'?'active':''}`} onClick={() => onTab('dashboard')}>
            <Icon d={I.grid} size={15} /><span>Overview</span>
          </button>
          <button className={`nav-item ${route.type==='activity'?'active':''}`} onClick={() => onTab('activity')}>
            <Icon d={I.pulse} size={15} /><span>Activity</span>
          </button>
          <button className={`nav-item ${route.type==='marketplace'?'active':''}`} onClick={() => onTab('marketplace')}>
            <Icon d={I.store} size={15} /><span>Marketplace</span>
          </button>
          <div className="secondary-section">Tools</div>
          <button className="nav-item" onClick={() => onTab('portforward')}>
            <Icon d={I.network} size={15} /><span>Port Forwarding</span>
            <span className="pill accent" style={{marginLeft:'auto', fontSize:9}}><span className="dot" />NEW</span>
          </button>
          <button className="nav-item" onClick={() => onTab('account')}>
            <Icon d={I.user} size={15} /><span>Account & Plan</span>
          </button>
          <div className="secondary-section">Resources</div>
          <button className="nav-item" onClick={() => onTab('docs')}>
            <Icon d={I.log} size={15} /><span>Documentation</span>
            <Icon d={I.external} size={12} />
          </button>
          <button className="nav-item" onClick={() => onTab('community')}>
            <Icon d={I.users} size={15} /><span>Community</span>
            <Icon d={I.external} size={12} />
          </button>
        </div>
      </div>
    );
  }

  if (route.type === 'settings') {
    const tabs = [
      { id: 'general', label: 'General', icon: I.settings },
      { id: 'java', label: 'Java Runtimes', icon: I.cube },
      { id: 'storage', label: 'Storage & Paths', icon: I.folder },
      { id: 'network', label: 'Network', icon: I.network },
      { id: 'notifications', label: 'Notifications', icon: I.bell },
      { id: 'shortcuts', label: 'Shortcuts', icon: I.command },
      { id: 'about', label: 'About', icon: I.info },
    ];
    return (
      <div className="secondary">
        <div className="secondary-head">
          <div className="eyebrow">Application</div>
          <h3>Settings</h3>
        </div>
        <div className="secondary-list">
          {tabs.map(t => (
            <button key={t.id} className={`nav-item ${currentTab===t.id?'active':''}`} onClick={() => onTab(t.id)}>
              <Icon d={t.icon} size={15} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (route.type === 'create') {
    return (
      <div className="secondary">
        <div className="secondary-head">
          <div className="eyebrow">New Server</div>
          <h3>Create</h3>
          <div className="meta">
            <span className="pill accent"><span className="dot" />Step {route.step || 1} of 5</span>
          </div>
        </div>
        <div className="secondary-list">
          {['Engine','Version','World','Settings','Launch'].map((label, i) => {
            const step = i + 1;
            const cur = route.step || 1;
            const done = step < cur;
            return (
              <div key={label} className={`nav-item ${step===cur?'active':''}`} style={{cursor:'default'}}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: step===cur ? 'var(--accent)' : (done ? 'var(--ok)' : 'var(--bg-3)'),
                  color: step===cur ? 'var(--accent-ink)' : (done ? '#052016' : 'var(--ink-3)'),
                  display: 'grid', placeItems: 'center',
                  fontSize: 10, fontWeight: 600, flexShrink: 0,
                  fontFamily: 'Geist Mono, monospace',
                }}>{done ? '✓' : step}</span>
                <span style={{color: step===cur ? 'var(--ink-0)' : (done ? 'var(--ink-1)' : 'var(--ink-3)')}}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return <div className="secondary" />;
};

// Command palette
const CommandPalette = ({ open, onClose, servers, onAction }) => {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 60); }
  }, [open]);

  const items = useMemo(() => {
    const all = [
      ...servers.map(s => ({ id: s.id, kind: 'Server', label: s.name, hint: `${s.engine} · ${s.version}`, action: () => onAction({type:'server', serverId: s.id}) })),
      { id: 'dashboard', kind: 'Page', label: 'Dashboard', hint: 'Overview of all servers', action: () => onAction({type:'dashboard'}) },
      { id: 'activity', kind: 'Page', label: 'Activity Feed', hint: 'Cross-server events', action: () => onAction({type:'activity'}) },
      { id: 'marketplace', kind: 'Page', label: 'Marketplace', hint: 'Browse plugins & mods', action: () => onAction({type:'marketplace'}) },
      { id: 'settings', kind: 'Page', label: 'Global Settings', hint: 'Application preferences', action: () => onAction({type:'settings'}) },
      { id: 'create', kind: 'Action', label: 'Create new server', hint: 'Start the wizard', action: () => onAction({type:'create', step:1}) },
      { id: 'portforward', kind: 'Tool', label: 'Port Forwarding', hint: 'Manage public access', action: () => onAction({type:'portforward'}) },
    ];
    if (!q) return all;
    return all.filter(i => i.label.toLowerCase().includes(q.toLowerCase()) || i.hint.toLowerCase().includes(q.toLowerCase()));
  }, [q, servers, onAction]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{width: 'min(620px, 100% - 80px)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid var(--line-1)'}}>
          <Icon d={I.search} size={16} />
          <input
            ref={inputRef}
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search servers, pages, actions…"
            style={{flex:1, background:'transparent', border:0, outline:0, color:'var(--ink-0)', fontSize: 14, fontFamily:'inherit'}}
            onKeyDown={e => { if(e.key==='Escape') onClose(); if(e.key==='Enter' && items[0]) { items[0].action(); onClose(); }}}
          />
          <span className="tag-mono">ESC</span>
        </div>
        <div style={{maxHeight: 380, overflowY: 'auto', padding: 6}}>
          {items.length === 0 && <div style={{padding:24, textAlign:'center', color:'var(--ink-3)', fontSize:13}}>No matches</div>}
          {items.map(item => (
            <button key={item.kind+item.id} className="nav-item" onClick={() => { item.action(); onClose(); }} style={{borderRadius:8}}>
              <span className="tag-mono" style={{minWidth:60}}>{item.kind}</span>
              <span style={{color:'var(--ink-0)', fontWeight:500}}>{item.label}</span>
              <span style={{marginLeft:'auto', color:'var(--ink-3)', fontSize:12}}>{item.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Server hero header (used inside server view)
const ServerHero = ({ server, onToggle, onAction }) => {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between', gap: 16,
      paddingBottom: 22, marginBottom: 24, borderBottom: '1px solid var(--line-1)',
    }}>
      <div style={{display:'flex', alignItems:'center', gap: 16}}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: `linear-gradient(135deg, ${server.color}33, ${server.color}11)`,
          border: `1px solid ${server.color}40`,
          display:'grid', placeItems:'center', flexShrink: 0,
          fontFamily:'Geist Mono, monospace', fontWeight: 600, fontSize: 22, color: server.color,
          position:'relative',
        }}>
          {server.glyph}
          <span style={{
            position:'absolute', right:-3, bottom:-3, width: 14, height: 14, borderRadius:'50%',
            background: server.online ? 'var(--ok)' : 'var(--ink-3)',
            border: '3px solid var(--bg-1)',
            boxShadow: server.online ? '0 0 8px var(--ok)' : 'none',
          }} />
        </div>
        <div>
          <h1 style={{margin:0, fontSize: 26, fontWeight: 600, letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap: 12}}>
            {server.name}
            <span className={`pill ${server.online ? 'ok' : 'bad'}`}>
              <span className="dot" />{server.online ? 'Running' : 'Offline'}
            </span>
          </h1>
          <div style={{marginTop: 6, display:'flex', alignItems:'center', gap: 10, color:'var(--ink-2)', fontSize: 13, flexWrap:'wrap'}}>
            <span className="pill"><Icon d={I.cube} size={11} />{server.engine}</span>
            <span className="pill text-mono">v{server.version}</span>
            <span className="text-mono text-faint" style={{fontSize:11}}>{server.hash}</span>
            {server.online && <span className="text-faint">• up {server.uptime}</span>}
          </div>
        </div>
      </div>
      <div style={{display:'flex', alignItems:'center', gap: 8}}>
        <button className="btn ghost icon-only" onClick={() => onAction('open-folder')} title="Open folder">
          <Icon d={I.folder} size={16} />
        </button>
        <button className="btn ghost icon-only" onClick={() => onAction('restart')} title="Restart" disabled={!server.online}>
          <Icon d={I.refresh} size={16} />
        </button>
        {server.online ? (
          <button className="btn danger" onClick={onToggle}>
            <Icon d={I.stop} size={14} />Stop Server
          </button>
        ) : (
          <button className="btn success" onClick={onToggle}>
            <Icon d={I.play} size={14} />Start Server
          </button>
        )}
      </div>
    </div>
  );
};

window.Titlebar = Titlebar;
window.Rail = Rail;
window.SecondaryPanel = SecondaryPanel;
window.CommandPalette = CommandPalette;
window.ServerHero = ServerHero;
