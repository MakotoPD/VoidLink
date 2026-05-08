// Server view — all tabs.

const { useState: useStateS, useEffect: useEffectS, useMemo: useMemoS, useRef: useRefS } = React;

// Player head — pixel art generated from seed
const PlayerHead = ({ seed = 1, size = 32 }) => {
  // Deterministic pseudo-random from seed
  const rand = (n) => { let x = Math.sin(seed * 9999 + n) * 10000; return x - Math.floor(x); };
  const skinHue = Math.floor(rand(1) * 30) + 15; // skin range
  const hairHue = Math.floor(rand(2) * 360);
  const shirtHue = Math.floor(rand(3) * 360);
  const skin = `oklch(0.78 0.05 ${skinHue})`;
  const skinDark = `oklch(0.62 0.06 ${skinHue})`;
  const hair = `oklch(0.35 0.08 ${hairHue})`;
  const shirt = `oklch(0.55 0.15 ${shirtHue})`;
  const eye = '#0b1014';
  const px = size / 8;
  // 8x8 face grid (top half = head)
  const grid = [
    ['h','h','h','h','h','h','h','h'],
    ['h','s','s','s','s','s','s','h'],
    ['s','s','s','s','s','s','s','s'],
    ['s','s','e','s','s','e','s','s'],
    ['s','s','s','s','s','s','s','s'],
    ['s','s','d','s','s','d','s','s'],
    ['s','s','s','m','m','s','s','s'],
    ['t','t','t','t','t','t','t','t'],
  ];
  const palette = { h: hair, s: skin, e: eye, d: skinDark, m: skinDark, t: shirt };
  return (
    <div style={{
      width: size, height: size, display:'grid',
      gridTemplateColumns: `repeat(8, ${px}px)`,
      gridTemplateRows: `repeat(8, ${px}px)`,
      borderRadius: 5,
      overflow: 'hidden',
      flexShrink: 0,
      imageRendering: 'pixelated',
      border: '1px solid var(--line-1)',
    }}>
      {grid.flat().map((c, i) => (
        <div key={i} style={{background: palette[c]}} />
      ))}
    </div>
  );
};

// === Overview tab ===
const OverviewTab = ({ server }) => {
  const [tick, setTick] = useStateS(0);
  useEffectS(() => {
    if (!server.online) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [server.online]);

  // Live-ish data
  const cpuData = useMemoS(() => Array.from({length: 60}, (_, i) => {
    if (!server.online) return 0;
    return Math.max(0, server.cpu + 10 * Math.sin((i+tick)/4) + (Math.random()-0.5) * 8);
  }), [server.online, server.cpu, tick]);
  const ramData = useMemoS(() => Array.from({length: 60}, (_, i) => {
    if (!server.online) return 0;
    return server.ram + 200 * Math.sin((i+tick)/6) + (Math.random()-0.5) * 100;
  }), [server.online, server.ram, tick]);

  const tps = server.online ? Math.max(15, Math.min(20, server.tps + (Math.random()-0.5) * 0.05)) : 20.0;
  const tpsColor = tps >= 19.5 ? 'var(--ok)' : tps >= 18 ? 'var(--warn)' : 'var(--bad)';

  return (
    <>
      <div className="grid-4 mb-24">
        <Stat
          label="CPU Usage"
          value={server.online ? cpuData[cpuData.length-1].toFixed(1) : '—'}
          unit={server.online ? '%' : ''}
          sparkData={server.online ? cpuData : null}
          sparkColor="var(--accent)"
          icon={I.cpu}
          trend={{label: server.online ? `core utilization` : 'offline'}}
        />
        <Stat
          label="Memory"
          value={server.online ? (server.ram / 1024).toFixed(1) : '—'}
          unit={server.online ? ` GB / ${(server.ramMax/1024).toFixed(0)}` : ''}
          sparkData={server.online ? ramData : null}
          sparkColor="var(--purple)"
          icon={I.ram}
          trend={{label: server.online ? `${((server.ram/server.ramMax)*100).toFixed(0)}% of ${(server.ramMax/1024).toFixed(0)} GB` : 'offline'}}
        />
        <Stat
          label="TPS"
          value={tps.toFixed(2)}
          unit=" / 20"
          icon={I.bolt}
          trend={{label: server.online ? (tps >= 19.5 ? 'healthy' : tps >= 18 ? 'mild stutter' : 'lagging') : 'idle', dir: tps >= 19.5 ? 'up' : 'down'}}
        />
        <Stat
          label="Players"
          value={server.online ? server.players : 0}
          unit={` / ${server.maxPlayers}`}
          icon={I.users}
          trend={{label: server.online ? `peak 12 today` : 'offline'}}
        />
      </div>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap: 20}}>
        <div className="card">
          <div className="card-head">
            <h4><Icon d={I.activity} size={14} />Performance · last 60s</h4>
            <div style={{display:'flex', gap: 14, alignItems:'center'}}>
              <span style={{display:'flex', alignItems:'center', gap: 6, fontSize: 11}}><span style={{width:10, height:2, background:'var(--accent)', borderRadius: 1}}/>CPU %</span>
              <span style={{display:'flex', alignItems:'center', gap: 6, fontSize: 11}}><span style={{width:10, height:2, background:'var(--purple)', borderRadius: 1}}/>RAM MB</span>
              <span className="pill" style={{fontSize:10}}><span className="dot" style={{background:'var(--ok)'}}/>Live</span>
            </div>
          </div>
          <div style={{padding: 16}}>
            <ChartLines cpuData={cpuData} ramData={ramData} ramMax={server.ramMax} online={server.online} />
          </div>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap: 16}}>
          <div className="card">
            <div className="card-head"><h4><Icon d={I.network} size={14} />Connection</h4></div>
            <div className="card-pad" style={{display:'flex', flexDirection:'column', gap: 12}}>
              <div className="between">
                <span className="text-dim" style={{fontSize: 12}}>Local address</span>
                <span className="text-mono" style={{fontSize: 12}}>{server.address}</span>
              </div>
              <div className="between">
                <span className="text-dim" style={{fontSize: 12}}>Public address</span>
                {server.publicAddress
                  ? <span className="text-mono" style={{fontSize: 12, color:'var(--accent)'}}>{server.publicAddress}</span>
                  : <span className="pill bad" style={{fontSize:10}}><span className="dot"/>not exposed</span>}
              </div>
              <div className="between">
                <span className="text-dim" style={{fontSize: 12}}>Port forward</span>
                <span className={`pill ${server.portStatus==='forwarded'?'ok':'bad'}`} style={{fontSize:10}}>
                  <span className="dot"/>{server.portStatus==='forwarded'?'tunneled':'closed'}
                </span>
              </div>
              <div className="between">
                <span className="text-dim" style={{fontSize: 12}}>Online mode</span>
                <span className={`pill ${server.onlineMode?'ok':'warn'}`} style={{fontSize:10}}>
                  <span className="dot"/>{server.onlineMode?'verified':'cracked'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h4><Icon d={I.info} size={14} />World</h4></div>
            <div className="card-pad" style={{display:'flex', flexDirection:'column', gap: 12}}>
              <div className="between"><span className="text-dim" style={{fontSize:12}}>Gamemode</span><span className="pill" style={{fontSize:10}}>{server.gamemode}</span></div>
              <div className="between"><span className="text-dim" style={{fontSize:12}}>Difficulty</span><span className="pill" style={{fontSize:10}}>{server.difficulty}</span></div>
              <div className="between"><span className="text-dim" style={{fontSize:12}}>World size</span><span className="text-mono" style={{fontSize:12}}>1.9 GB</span></div>
              <div className="between"><span className="text-dim" style={{fontSize:12}}>Last backup</span><span className="text-mono" style={{fontSize:12}}>Today, 03:00</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Chart for performance — two-line live chart
const ChartLines = ({ cpuData, ramData, ramMax, online }) => {
  const w = 800, h = 220, pad = { l: 36, r: 36, t: 12, b: 24 };
  const innerW = w - pad.l - pad.r, innerH = h - pad.t - pad.b;
  const buildPath = (data, max) => {
    if (!data.length) return '';
    return data.map((v, i) => {
      const x = pad.l + (i / (data.length - 1)) * innerW;
      const y = pad.t + innerH - (Math.min(v, max) / max) * innerH;
      return `${i===0?'M':'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };
  const cpuPath = buildPath(cpuData, 100);
  const ramPath = buildPath(ramData, ramMax);
  const cpuArea = cpuPath ? cpuPath + ` L ${pad.l + innerW} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z` : '';

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block'}}>
      <defs>
        <linearGradient id="cpufill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={pad.l} x2={pad.l+innerW} y1={pad.t + innerH * p} y2={pad.t + innerH * p} stroke="var(--line-1)" strokeDasharray={p===0||p===1?'':'2,4'} />
      ))}
      {/* y-axis labels */}
      {[0, 25, 50, 75, 100].map((v, i) => (
        <text key={v} x={pad.l - 8} y={pad.t + innerH * (1 - v/100) + 3} fontFamily="Geist Mono, monospace" fontSize="9" fill="var(--ink-3)" textAnchor="end">{v}%</text>
      ))}
      {[0, ramMax * 0.25, ramMax * 0.5, ramMax * 0.75, ramMax].map((v, i) => (
        <text key={v} x={pad.l + innerW + 8} y={pad.t + innerH * (1 - v/ramMax) + 3} fontFamily="Geist Mono, monospace" fontSize="9" fill="var(--ink-3)" textAnchor="start">{(v/1024).toFixed(1)}G</text>
      ))}
      {/* x-axis labels */}
      {[60, 45, 30, 15, 0].map((v, i) => (
        <text key={i} x={pad.l + innerW * (i/4)} y={pad.t + innerH + 16} fontFamily="Geist Mono, monospace" fontSize="9" fill="var(--ink-3)" textAnchor="middle">-{v}s</text>
      ))}
      {online && cpuArea && <path d={cpuArea} fill="url(#cpufill)" />}
      {online && cpuPath && <path d={cpuPath} fill="none" stroke="var(--accent)" strokeWidth="1.5" />}
      {online && ramPath && <path d={ramPath} fill="none" stroke="var(--purple)" strokeWidth="1.5" />}
      {!online && (
        <text x={w/2} y={h/2} fontSize="13" fill="var(--ink-3)" textAnchor="middle" fontFamily="Geist, sans-serif">Server is offline — no live data</text>
      )}
    </svg>
  );
};

// === Console tab ===
const ConsoleTab = ({ server }) => {
  const [logs, setLogs] = useStateS(server.online ? MOCK_LOGS : []);
  const [cmd, setCmd] = useStateS('');
  const [history, setHistory] = useStateS([]);
  const [histIdx, setHistIdx] = useStateS(-1);
  const [autoscroll, setAutoscroll] = useStateS(true);
  const bodyRef = useRefS(null);

  // Live tail
  useEffectS(() => {
    if (!server.online) return;
    const id = setInterval(() => {
      setLogs(prev => {
        const filler = [
          ['12:0' + (Math.floor(Math.random()*9)) + ':' + (10+Math.floor(Math.random()*50)), 'INFO', `<chat> <<player>>${['oracle','Kelpie_77','pixelmage','low_orbit'][Math.floor(Math.random()*4)]}<</player>>: ${['nice','brb','kk','wait','found it','on my way'][Math.floor(Math.random()*6)]}`],
          [new Date().toTimeString().slice(0,8), 'DEBUG', `[Spark] tick avg ${(19.7 + Math.random()*0.3).toFixed(2)}`],
        ][Math.floor(Math.random()*2)];
        return [...prev.slice(-200), filler];
      });
    }, 3500);
    return () => clearInterval(id);
  }, [server.online]);

  useEffectS(() => {
    if (autoscroll && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs, autoscroll]);

  const send = () => {
    if (!cmd.trim()) return;
    const time = new Date().toTimeString().slice(0,8);
    setLogs(prev => [...prev, [time, 'INFO', `> ${cmd}`]]);
    setHistory(h => [cmd, ...h].slice(0, 30));
    // mock response
    setTimeout(() => {
      const lower = cmd.toLowerCase().trim();
      let resp = `Unknown command. Type "help" for help.`;
      if (lower === 'help') resp = `Available commands: help, list, save-all, stop, ban, kick, op, deop, time set, weather, gamemode`;
      else if (lower === 'list') resp = `There are ${server.players} of a max of ${server.maxPlayers} players online: Kelpie_77, oracle, pixelmage, tinyboat, bramble, low_orbit, noctilucent`;
      else if (lower.startsWith('save-all')) resp = `Saved the game`;
      else if (lower.startsWith('time set')) resp = `Set the time to ${cmd.split(' ')[2] || 'day'}`;
      setLogs(prev => [...prev, [new Date().toTimeString().slice(0,8), 'INFO', resp]]);
    }, 200);
    setCmd('');
    setHistIdx(-1);
  };

  const renderMsg = (msg) => {
    return msg
      .replace(/<<player>>(.*?)<<\/player>>/g, '<span class="hl-player">$1</span>')
      .replace(/<<coord>>(.*?)<<\/coord>>/g, '<span class="hl-coord">$1</span>');
  };

  return (
    <>
      <div className="between mb-12">
        <h3 className="section-title"><Icon d={I.terminal} size={14} />Live Console</h3>
        <div style={{display:'flex', gap: 8}}>
          <button className="btn ghost sm" onClick={() => setLogs([])}><Icon d={I.trash} size={12} />Clear</button>
          <button className="btn ghost sm"><Icon d={I.download} size={12} />Export</button>
          <button className={`btn ${autoscroll ? '' : 'ghost'} sm`} onClick={() => setAutoscroll(a => !a)}>
            <span style={{width: 6, height: 6, borderRadius:'50%', background: autoscroll ? 'var(--ok)' : 'var(--ink-3)'}} />
            Auto-scroll
          </button>
        </div>
      </div>

      <div className="console">
        <div className="console-body" ref={bodyRef}>
          {logs.length === 0 && (
            <div style={{color:'var(--ink-3)', fontStyle:'italic', padding: '12px 0'}}>
              {server.online ? 'Awaiting log output…' : 'Server is offline. Output will appear here when started.'}
            </div>
          )}
          {logs.map((l, i) => (
            <div key={i} className="log-line">
              <span className="t">{l[0]}</span>
              <span className={`lvl ${l[1]}`}>{l[1]}</span>
              <span className="msg" dangerouslySetInnerHTML={{__html: renderMsg(l[2])}} />
            </div>
          ))}
        </div>
        <div className="console-input">
          <span className="prompt">{'>'}</span>
          <input
            value={cmd}
            onChange={e => setCmd(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { send(); }
              else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const ni = Math.min(history.length - 1, histIdx + 1);
                if (ni >= 0) { setHistIdx(ni); setCmd(history[ni]); }
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const ni = Math.max(-1, histIdx - 1);
                setHistIdx(ni);
                setCmd(ni >= 0 ? history[ni] : '');
              }
            }}
            placeholder={server.online ? 'Type a command, or /help…' : 'Server offline · start to send commands'}
            disabled={!server.online}
          />
          <button onClick={send} disabled={!server.online}>Send <Icon d={I.send} size={11} style={{marginLeft:4}} /></button>
        </div>
      </div>

      <div className="mt-16" style={{display:'flex', gap: 6, flexWrap:'wrap'}}>
        <span className="text-faint" style={{fontSize: 11, padding: '6px 0'}}>Quick:</span>
        {['list','save-all flush','time set day','weather clear','reload confirm','op'].map(q => (
          <button key={q} className="pill" style={{cursor:'pointer'}} onClick={() => { setCmd(q); }}>
            <span style={{color:'var(--accent)'}}>/</span>{q}
          </button>
        ))}
      </div>
    </>
  );
};

// === Players tab ===
const PlayersTab = ({ server }) => {
  const players = server.online ? MOCK_PLAYERS.slice(0, server.players) : [];
  const [tab, setTab] = useStateS('online');
  const [whitelist, setWhitelist] = useStateS(['Kelpie_77','oracle','pixelmage','tinyboat','bramble']);
  const [ops, setOps] = useStateS(['Kelpie_77','oracle']);
  const [banned, setBanned] = useStateS([{name:'griefer123', reason:'Block griefing in spawn', date:'May 02'}]);
  const [add, setAdd] = useStateS('');

  return (
    <>
      <div className="tabs">
        <button className={`tab ${tab==='online'?'active':''}`} onClick={()=>setTab('online')}><Icon d={I.users} size={14} />Online <span className="count">{players.length}</span></button>
        <button className={`tab ${tab==='whitelist'?'active':''}`} onClick={()=>setTab('whitelist')}><Icon d={I.shield} size={14} />Whitelist <span className="count">{whitelist.length}</span></button>
        <button className={`tab ${tab==='ops'?'active':''}`} onClick={()=>setTab('ops')}><Icon d={I.crown} size={14} />Operators <span className="count">{ops.length}</span></button>
        <button className={`tab ${tab==='banned'?'active':''}`} onClick={()=>setTab('banned')}><Icon d={I.kick} size={14} />Bans <span className="count">{banned.length}</span></button>
      </div>

      {tab === 'online' && (
        <div className="card">
          <div className="card-head">
            <h4><Icon d={I.users} size={14} />Online Players <span className="pill ok" style={{marginLeft:6, fontSize:10}}><span className="dot"/>{players.length} online</span></h4>
            <div style={{display:'flex', gap: 6}}>
              <button className="btn ghost sm"><Icon d={I.refresh} size={12} /></button>
              <button className="btn ghost sm"><Icon d={I.bell} size={12} />Broadcast</button>
            </div>
          </div>
          {players.length === 0 ? (
            <div className="empty-state">
              <Icon d={I.users} size={32} />
              <h5>No one online</h5>
              <p>{server.online ? 'Waiting for players to join.' : 'Start the server first.'}</p>
            </div>
          ) : (
            <div style={{padding: 8}}>
              {players.map(p => (
                <div key={p.uuid} className="player-row">
                  <PlayerHead seed={p.skinSeed} size={36} />
                  <div>
                    <div className="name">{p.name} {p.op && <Icon d={I.crown} size={10} style={{color:'var(--warn)', marginLeft: 4, display:'inline'}} />}</div>
                    <div className="uuid">{p.uuid} · joined {p.joined}</div>
                  </div>
                  <div className="meta">
                    <span className="pill" style={{fontSize:10, textTransform:'capitalize'}}>{p.dim}</span>
                    <span className="text-mono text-faint" style={{fontSize:11}}>{p.pos.x},{p.pos.y},{p.pos.z}</span>
                    <span className={`ping`} style={{color: p.ping < 50 ? 'var(--ok)' : p.ping < 100 ? 'var(--warn)' : 'var(--bad)'}}>{p.ping}ms</span>
                    <button className="btn ghost icon-only sm" title="Teleport to"><Icon d={I.pin} size={12} /></button>
                    <button className="btn ghost icon-only sm" title="Op/De-op"><Icon d={I.crown} size={12} /></button>
                    <button className="btn ghost icon-only sm" title="Kick"><Icon d={I.kick} size={12} /></button>
                    <button className="btn ghost icon-only sm" title="Ban"><Icon d={I.flag} size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'whitelist' && (
        <div className="card">
          <div className="card-head">
            <h4><Icon d={I.shield} size={14} />Whitelist</h4>
            <div className="row gap-8">
              <span className="text-dim" style={{fontSize:12}}>Enforce whitelist</span>
              <div className={`toggle ${server.whitelist?'on':''}`} />
            </div>
          </div>
          <div className="card-pad">
            <div style={{display:'flex', gap: 8, marginBottom: 14}}>
              <input className="input" placeholder="Add player by username…" value={add} onChange={e=>setAdd(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&add){setWhitelist(w=>[...w,add]);setAdd('');}}} />
              <button className="btn primary" onClick={()=>{if(add){setWhitelist(w=>[...w,add]);setAdd('');}}}><Icon d={I.plus} size={12} />Add</button>
            </div>
            <div style={{display:'flex', flexWrap:'wrap', gap: 8}}>
              {whitelist.map((n, i) => (
                <div key={n} style={{display:'flex', alignItems:'center', gap: 8, padding:'6px 8px 6px 6px', background:'var(--bg-3)', border:'1px solid var(--line-1)', borderRadius: 999}}>
                  <PlayerHead seed={i+1} size={20} />
                  <span style={{fontSize: 12}}>{n}</span>
                  <button className="btn ghost icon-only sm" style={{padding:2}} onClick={()=>setWhitelist(w=>w.filter(x=>x!==n))}><Icon d={I.x} size={10} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'ops' && (
        <div className="card">
          <div className="card-head">
            <h4><Icon d={I.crown} size={14} />Operators</h4>
            <span className="text-dim" style={{fontSize:12}}>{ops.length} admin{ops.length===1?'':'s'}</span>
          </div>
          <div className="card-pad">
            {ops.map((n, i) => (
              <div key={n} className="player-row">
                <PlayerHead seed={i+1} size={32} />
                <div>
                  <div className="name">{n} <Icon d={I.crown} size={11} style={{color:'var(--warn)', display:'inline', marginLeft: 4}} /></div>
                  <div className="uuid">Level 4 · all permissions</div>
                </div>
                <div className="meta">
                  <select className="select" style={{width: 100, padding:'4px 8px', fontSize: 12}} defaultValue="4">
                    <option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option><option value="4">Level 4</option>
                  </select>
                  <button className="btn ghost icon-only sm" onClick={()=>setOps(o=>o.filter(x=>x!==n))}><Icon d={I.x} size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'banned' && (
        <div className="card">
          <div className="card-head">
            <h4><Icon d={I.flag} size={14} />Banned Players</h4>
            <button className="btn ghost sm"><Icon d={I.plus} size={12} />Add Ban</button>
          </div>
          {banned.length === 0 ? <div className="empty-state"><Icon d={I.flag} size={32} /><h5>No bans</h5><p>This server has a clean record.</p></div> : (
            <div className="card-pad">
              {banned.map((b, i) => (
                <div key={i} className="player-row">
                  <PlayerHead seed={99+i} size={32} />
                  <div>
                    <div className="name">{b.name}</div>
                    <div className="uuid">{b.reason} · {b.date}</div>
                  </div>
                  <div className="meta">
                    <button className="btn ghost sm" onClick={()=>setBanned(bs=>bs.filter((_,j)=>j!==i))}><Icon d={I.unlock} size={12} />Unban</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

// === Plugins tab ===
const PluginsTab = ({ server, onBrowse }) => {
  const [view, setView] = useStateS('grid');
  const [list, setList] = useStateS(MOCK_PLUGINS);
  const [q, setQ] = useStateS('');
  const filtered = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="between mb-16">
        <div>
          <h3 className="section-title"><Icon d={I.package} size={14} />Installed</h3>
          <div className="text-dim" style={{fontSize: 12, marginTop: 4}}>{list.length} plugins · {list.filter(p=>p.enabled).length} enabled</div>
        </div>
        <div style={{display:'flex', gap: 8}}>
          <div style={{display:'flex', alignItems:'center', gap: 4, background:'var(--bg-2)', border:'1px solid var(--line-1)', padding: 2, borderRadius: 8}}>
            <button className={`btn ${view==='grid'?'':'ghost'} icon-only sm`} onClick={()=>setView('grid')} style={{borderRadius: 6}}><Icon d={I.grid} size={14} /></button>
            <button className={`btn ${view==='list'?'':'ghost'} icon-only sm`} onClick={()=>setView('list')} style={{borderRadius: 6}}><Icon d={I.list} size={14} /></button>
          </div>
          <button className="btn ghost"><Icon d={I.upload} size={14} />Upload .jar</button>
          <button className="btn primary" onClick={onBrowse}><Icon d={I.store} size={14} />Marketplace</button>
        </div>
      </div>

      <div style={{position:'relative', marginBottom: 16}}>
        <Icon d={I.search} size={14} style={{position:'absolute', left: 12, top: 11, color:'var(--ink-3)'}} />
        <input className="input" placeholder="Filter plugins…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft: 34}} />
      </div>

      {view === 'grid' ? (
        <div className="grid-3">
          {filtered.map(p => (
            <div key={p.id} className="plugin-card">
              <div className="pc-head">
                <div className="pc-icon" style={{background: `${p.color}22`, color: p.color, border:`1px solid ${p.color}44`}}>{p.name.slice(0,2)}</div>
                <div style={{flex:1, minWidth:0}}>
                  <h4 className="pc-name">{p.name}</h4>
                  <div className="pc-author">v{p.version} · {p.author}</div>
                </div>
                <span className="pill">{p.tag}</span>
              </div>
              <div className="pc-desc">{p.desc}</div>
              <div className="pc-foot">
                <span className="text-faint text-mono" style={{fontSize:11}}>{p.size}</span>
                {p.deps.length > 0 && <span className="text-faint" style={{fontSize:11}}>• needs {p.deps.join(', ')}</span>}
                <div style={{marginLeft:'auto', display:'flex', gap: 4, alignItems:'center'}}>
                  <div className={`toggle ${p.enabled?'on':''}`} onClick={() => setList(l => l.map(x => x.id===p.id ? {...x, enabled: !x.enabled} : x))} />
                  <button className="btn ghost icon-only sm"><Icon d={I.settings} size={12} /></button>
                  <button className="btn ghost icon-only sm"><Icon d={I.trash} size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          {filtered.map((p, i) => (
            <div key={p.id} style={{display:'flex', alignItems:'center', gap: 14, padding:'14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid var(--line-1)' : 'none'}}>
              <div className="pc-icon" style={{background: `${p.color}22`, color: p.color, border:`1px solid ${p.color}44`, width: 32, height: 32, borderRadius: 6, display:'grid', placeItems:'center', fontFamily:'Geist Mono, monospace', fontWeight: 600}}>{p.name.slice(0,2)}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:500}}>{p.name} <span className="text-faint text-mono" style={{fontSize: 11, marginLeft: 6}}>v{p.version}</span></div>
                <div className="text-dim" style={{fontSize: 12, marginTop: 1}}>{p.desc}</div>
              </div>
              <span className="pill">{p.tag}</span>
              <span className="text-faint text-mono" style={{fontSize: 11, minWidth: 60}}>{p.size}</span>
              <div className={`toggle ${p.enabled?'on':''}`} onClick={() => setList(l => l.map(x => x.id===p.id ? {...x, enabled: !x.enabled} : x))} />
              <button className="btn ghost icon-only sm"><Icon d={I.more} size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// === World Map tab ===
const WorldMapTab = ({ server }) => {
  const hasMapPlugin = MOCK_PLUGINS.find(p => p.id === 'dynmap')?.enabled;
  if (!hasMapPlugin || !server.online) {
    return (
      <div className="card card-pad" style={{textAlign:'center', padding: 60}}>
        <Icon d={I.map} size={32} style={{color:'var(--ink-3)', marginBottom: 16}} />
        <h3 style={{margin:0}}>{!server.online ? 'World map needs a running server' : 'No map plugin detected'}</h3>
        <p className="text-dim" style={{marginTop: 6, maxWidth: 460, marginLeft:'auto', marginRight:'auto'}}>
          {!server.online ? 'Start your server to render the world map.' : 'Install Dynmap or BlueMap to enable the live world map view.'}
        </p>
        <div style={{display:'flex', gap: 8, justifyContent:'center', marginTop: 18}}>
          {!server.online && <button className="btn success"><Icon d={I.play} size={14} />Start Server</button>}
          {server.online && <button className="btn primary"><Icon d={I.store} size={14} />Browse Map Plugins</button>}
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="between mb-16">
        <div>
          <h3 className="section-title"><Icon d={I.map} size={14} />World Map <span className="pill" style={{marginLeft:6, fontSize:10}}>Dynmap 3.7.10</span></h3>
          <div className="text-dim" style={{fontSize: 12, marginTop: 4}}>Live render · 7 players visible</div>
        </div>
        <div style={{display:'flex', gap: 6}}>
          {['overworld','nether','end'].map((d, i) => (
            <button key={d} className={`btn ${i===0?'':'ghost'} sm`} style={{textTransform:'capitalize'}}>{d}</button>
          ))}
          <button className="btn ghost sm"><Icon d={I.expand} size={12} />Fullscreen</button>
          <button className="btn ghost sm"><Icon d={I.external} size={12} />Open in browser</button>
        </div>
      </div>

      <div className="worldmap-canvas">
        {/* placeholder map: gradient + grid + player markers */}
        <svg width="100%" height="100%" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" style={{position:'absolute', inset: 0}}>
          <defs>
            <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--line-1)" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="island1" cx="0.4" cy="0.5" r="0.3">
              <stop offset="0%" stopColor="#34d39933" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="island2" cx="0.7" cy="0.6" r="0.2">
              <stop offset="0%" stopColor="#f59e0b33" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="800" height="520" fill="url(#mapgrid)" />
          {/* fake biome blobs */}
          <ellipse cx="280" cy="260" rx="180" ry="120" fill="url(#island1)" />
          <ellipse cx="540" cy="320" rx="120" ry="90" fill="url(#island2)" />
          <ellipse cx="120" cy="120" rx="60" ry="50" fill="#38bdf822" />
          <ellipse cx="680" cy="160" rx="80" ry="60" fill="#a78bfa22" />
          {/* "rivers" */}
          <path d="M 100 400 Q 250 380 350 320 T 600 240 T 750 180" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.4" />
          {/* spawn marker */}
          <circle cx="400" cy="260" r="5" fill="var(--accent)" />
          <circle cx="400" cy="260" r="14" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.5">
            <animate attributeName="r" values="14;26;14" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <text x="400" y="248" fontSize="9" fill="var(--accent)" textAnchor="middle" fontFamily="Geist Mono, monospace">SPAWN</text>
          {/* player dots */}
          {[
            {x: 412, y: 240, name:'Kelpie_77'},
            {x: 350, y: 280, name:'oracle'},
            {x: 240, y: 200, name:'tinyboat'},
            {x: 580, y: 320, name:'pixelmage'},
            {x: 480, y: 180, name:'bramble'},
            {x: 660, y: 380, name:'low_orbit'},
            {x: 120, y: 420, name:'noctilucent'},
          ].map((p,i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#34d399" />
              <circle cx={p.x} cy={p.y} r="8" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.3" />
              <text x={p.x + 10} y={p.y + 3} fontSize="9" fill="var(--ink-1)" fontFamily="Geist, sans-serif">{p.name}</text>
            </g>
          ))}
        </svg>

        <div style={{position:'absolute', top: 12, left: 12, display:'flex', gap: 4}}>
          <button className="btn ghost icon-only sm" style={{background:'var(--bg-2)'}}><Icon d={I.plus} size={12} /></button>
          <button className="btn ghost icon-only sm" style={{background:'var(--bg-2)'}}><Icon d={I.minus} size={12} /></button>
        </div>
        <div style={{position:'absolute', bottom: 12, left: 12, padding:'8px 12px', background:'var(--bg-2)', border:'1px solid var(--line-1)', borderRadius: 8, display:'flex', gap: 16, fontSize: 11, fontFamily:'Geist Mono, monospace'}}>
          <span><span style={{color:'var(--ink-3)'}}>X</span> 412</span>
          <span><span style={{color:'var(--ink-3)'}}>Z</span> -1284</span>
          <span><span style={{color:'var(--ink-3)'}}>Zoom</span> 4×</span>
        </div>
        <div style={{position:'absolute', bottom: 12, right: 12, display:'flex', gap: 12, fontSize: 11, padding:'8px 12px', background:'var(--bg-2)', border:'1px solid var(--line-1)', borderRadius: 8}}>
          <span style={{display:'flex', alignItems:'center', gap: 6}}><span style={{width:8, height:8, borderRadius:'50%', background:'var(--ok)'}}/>Players (7)</span>
          <span style={{display:'flex', alignItems:'center', gap: 6}}><span style={{width:8, height:8, borderRadius:'50%', background:'var(--accent)'}}/>Spawn</span>
        </div>
      </div>
    </>
  );
};

// === Files tab ===
const FilesTab = ({ server }) => {
  const [path, setPath] = useStateS('/');
  return (
    <>
      <div className="between mb-12">
        <div className="row gap-8">
          <button className="btn ghost icon-only sm"><Icon d={I.arrowLeft} size={14} /></button>
          <button className="btn ghost icon-only sm"><Icon d={I.arrowRight} size={14} /></button>
          <button className="btn ghost icon-only sm"><Icon d={I.refresh} size={14} /></button>
          <div style={{padding:'6px 10px', background:'var(--bg-2)', border:'1px solid var(--line-1)', borderRadius: 6, fontFamily:'Geist Mono, monospace', fontSize: 12, color:'var(--ink-1)', minWidth: 280}}>
            <span style={{color:'var(--ink-3)'}}>~/voidlink/servers/{server.name}</span>{path}
          </div>
        </div>
        <div style={{display:'flex', gap: 6}}>
          <button className="btn ghost sm"><Icon d={I.upload} size={12} />Upload</button>
          <button className="btn ghost sm"><Icon d={I.plus} size={12} />New</button>
          <button className="btn primary sm"><Icon d={I.external} size={12} />Open in OS</button>
        </div>
      </div>

      <div className="card">
        <div style={{display:'grid', gridTemplateColumns:'1fr 100px 140px 80px', padding:'10px 18px', borderBottom:'1px solid var(--line-1)', fontSize: 11, color:'var(--ink-3)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight: 500}}>
          <span>Name</span><span>Size</span><span>Modified</span><span></span>
        </div>
        {FILES.map((f, i) => (
          <div key={f.name} style={{display:'grid', gridTemplateColumns:'1fr 100px 140px 80px', padding:'10px 18px', borderBottom: i < FILES.length - 1 ? '1px solid var(--line-1)' : 'none', alignItems:'center', cursor:'pointer'}} className="file-row">
            <div style={{display:'flex', alignItems:'center', gap: 10}}>
              <Icon d={f.type==='dir' ? I.folder : I.log} size={14} style={{color: f.type==='dir' ? 'var(--accent)' : 'var(--ink-3)'}} />
              <span style={{fontFamily:'Geist Mono, monospace', fontSize: 13, color: f.type==='dir' ? 'var(--ink-0)' : 'var(--ink-1)'}}>{f.name}{f.type==='dir' ? '/' : ''}</span>
            </div>
            <span className="text-mono text-dim" style={{fontSize: 11}}>{f.size}</span>
            <span className="text-dim" style={{fontSize: 11}}>{f.modified}</span>
            <div style={{display:'flex', gap: 2, justifyContent:'flex-end'}}>
              <button className="btn ghost icon-only sm" style={{padding:4}}><Icon d={I.edit} size={12} /></button>
              <button className="btn ghost icon-only sm" style={{padding:4}}><Icon d={I.download} size={12} /></button>
              <button className="btn ghost icon-only sm" style={{padding:4}}><Icon d={I.more} size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// === Backups tab ===
const BackupsTab = ({ server }) => {
  return (
    <>
      <div className="between mb-16">
        <div>
          <h3 className="section-title"><Icon d={I.archive} size={14} />Backups</h3>
          <div className="text-dim" style={{fontSize: 12, marginTop: 4}}>{BACKUPS.length} backups · 13.8 GB total</div>
        </div>
        <div style={{display:'flex', gap: 8}}>
          <button className="btn ghost"><Icon d={I.settings} size={14} />Schedule</button>
          <button className="btn primary"><Icon d={I.plus} size={14} />Create Backup</button>
        </div>
      </div>

      <div className="grid-3 mb-24">
        <Stat label="Total Backups" value={BACKUPS.length} icon={I.archive} trend={{label: 'oldest 7 days ago'}} />
        <Stat label="Storage Used" value="13.8" unit=" GB" icon={I.folder} trend={{label: '74% of 18.5 GB cap'}} />
        <Stat label="Auto-Backup" value="Daily" icon={I.refresh} trend={{label: 'next in 15h 41m'}} />
      </div>

      <div className="card">
        <div className="card-head">
          <h4><Icon d={I.history} size={14} />History</h4>
          <span className="text-dim" style={{fontSize: 12}}>Sorted by date</span>
        </div>
        <div>
          {BACKUPS.map((b, i) => (
            <div key={b.id} style={{display:'grid', gridTemplateColumns:'auto 1fr 1fr 80px 200px', gap: 16, padding:'14px 22px', borderBottom: i < BACKUPS.length - 1 ? '1px solid var(--line-1)' : 'none', alignItems:'center'}}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: b.type==='auto' ? 'var(--accent-soft)' : 'var(--purple-soft)',
                color: b.type==='auto' ? 'var(--accent)' : 'var(--purple)',
                display:'grid', placeItems:'center',
              }}><Icon d={b.type==='auto' ? I.refresh : I.pin} size={14} /></div>
              <div>
                <div style={{fontFamily:'Geist Mono, monospace', fontSize: 13, color:'var(--ink-0)'}}>{b.name}</div>
                <div className="text-faint" style={{fontSize: 11, marginTop: 2}}>{b.includes.length} folders · {b.duration}</div>
              </div>
              <div className="text-dim" style={{fontSize: 12}}>{b.date}</div>
              <span className="text-mono text-dim" style={{fontSize: 12}}>{b.size}</span>
              <div style={{display:'flex', gap: 4, justifyContent:'flex-end'}}>
                <button className="btn ghost sm"><Icon d={I.refresh} size={12} />Restore</button>
                <button className="btn ghost icon-only sm"><Icon d={I.download} size={12} /></button>
                <button className="btn ghost icon-only sm"><Icon d={I.trash} size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// === Schedules tab ===
const SchedulesTab = ({ server }) => {
  const [list, setList] = useStateS(SCHEDULES);
  return (
    <>
      <div className="between mb-16">
        <div>
          <h3 className="section-title"><Icon d={I.calendar} size={14} />Scheduled Tasks</h3>
          <div className="text-dim" style={{fontSize: 12, marginTop: 4}}>{list.filter(s => s.enabled).length} active · {list.length} total</div>
        </div>
        <button className="btn primary"><Icon d={I.plus} size={14} />New Task</button>
      </div>

      <div className="card">
        <div style={{display:'grid', gridTemplateColumns:'auto 1.6fr 1.4fr 1fr 1fr 100px', padding:'10px 22px', borderBottom:'1px solid var(--line-1)', fontSize: 11, color:'var(--ink-3)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight: 500, gap: 16}}>
          <span></span><span>Name</span><span>Action</span><span>Last Run</span><span>Next Run</span><span></span>
        </div>
        {list.map((s, i) => (
          <div key={s.id} style={{display:'grid', gridTemplateColumns:'auto 1.6fr 1.4fr 1fr 1fr 100px', padding:'14px 22px', borderBottom: i < list.length - 1 ? '1px solid var(--line-1)' : 'none', alignItems:'center', gap: 16, opacity: s.enabled ? 1 : 0.55}}>
            <div className={`toggle ${s.enabled?'on':''}`} onClick={() => setList(l => l.map(x => x.id===s.id ? {...x, enabled: !x.enabled} : x))} />
            <div>
              <div style={{fontWeight: 500, fontSize: 13}}>{s.name}</div>
              <div className="text-faint text-mono" style={{fontSize: 11, marginTop: 2}}>{s.cron}</div>
            </div>
            <div className="text-mono" style={{fontSize: 12, color:'var(--ink-1)'}}>{s.action}</div>
            <div className="text-dim" style={{fontSize: 12}}>{s.last}</div>
            <div className="text-dim" style={{fontSize: 12}}>{s.next}</div>
            <div style={{display:'flex', gap: 2, justifyContent:'flex-end'}}>
              <button className="btn ghost icon-only sm"><Icon d={I.play} size={12} /></button>
              <button className="btn ghost icon-only sm"><Icon d={I.edit} size={12} /></button>
              <button className="btn ghost icon-only sm"><Icon d={I.trash} size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// === Crashes tab ===
const CrashesTab = ({ server }) => {
  const [open, setOpen] = useStateS(server.crashCount > 0 ? CRASHES[0] : null);
  if (server.crashCount === 0) {
    return (
      <div className="card card-pad" style={{textAlign:'center', padding: 60}}>
        <Icon d={I.check} size={32} style={{color:'var(--ok)', marginBottom: 16}} />
        <h3 style={{margin:0}}>No crashes — nice work</h3>
        <p className="text-dim" style={{marginTop: 6}}>This server hasn't crashed since it was created.</p>
      </div>
    );
  }
  return (
    <>
      <div className="between mb-16">
        <div>
          <h3 className="section-title"><Icon d={I.bug} size={14} />Crash Reports</h3>
          <div className="text-dim" style={{fontSize: 12, marginTop: 4}}>{CRASHES.length} crash · investigate, then mark resolved</div>
        </div>
        <button className="btn ghost"><Icon d={I.folder} size={14} />Open crash-reports/</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap: 20}}>
        <div className="card">
          {CRASHES.map((c, i) => (
            <div key={c.id} onClick={() => setOpen(c)} style={{padding:'14px 18px', borderBottom: i < CRASHES.length - 1 ? '1px solid var(--line-1)' : 'none', cursor:'pointer', background: open?.id === c.id ? 'var(--bg-3)' : 'transparent'}}>
              <div className="row gap-8">
                <span className={`pill ${c.severity==='fatal'?'bad':'warn'}`} style={{fontSize: 10}}>{c.severity}</span>
                {!c.resolved && <span className="pill" style={{fontSize: 10}}>open</span>}
              </div>
              <div style={{marginTop: 8, fontFamily:'Geist Mono, monospace', fontSize: 12, color:'var(--ink-0)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{c.cause}</div>
              <div className="text-faint" style={{fontSize: 11, marginTop: 6}}>{c.date} · {c.engine}</div>
            </div>
          ))}
        </div>

        {open && (
          <div className="card">
            <div className="card-head">
              <h4><Icon d={I.bug} size={14} />{open.cause}</h4>
              <div className="row gap-8">
                <button className="btn ghost sm"><Icon d={I.copy} size={12} />Copy</button>
                <button className="btn primary sm"><Icon d={I.check} size={12} />Mark Resolved</button>
              </div>
            </div>
            <div className="card-pad">
              <div className="grid-3 mb-16">
                <div><div className="eyebrow">Date</div><div style={{marginTop: 4, fontSize: 13}}>{open.date}</div></div>
                <div><div className="eyebrow">Engine</div><div style={{marginTop: 4, fontSize: 13}}>{open.engine}</div></div>
                <div><div className="eyebrow">Suspected</div><div style={{marginTop: 4, fontSize: 13}}>{open.plugin}</div></div>
              </div>
              <div className="text-dim" style={{fontSize: 13, lineHeight: 1.6, marginBottom: 16}}>{open.summary}</div>
              <div style={{padding: 14, background: '#050709', border:'1px solid var(--line-1)', borderRadius: 8, fontFamily:'Geist Mono, monospace', fontSize: 11, color:'var(--ink-1)', whiteSpace:'pre', overflow:'auto', lineHeight: 1.65}}>
{`---- Minecraft Crash Report ----
// I just don't know what went wrong :(

Time: 2026-05-04 18:42:11
Description: Exception in server tick loop

java.lang.OutOfMemoryError: Java heap space
    at java.base/java.util.Arrays.copyOf(Arrays.java:3537)
    at com.sk89q.worldedit.bukkit.WorldEditPlugin.paste(...)
    at net.minecraft.server.MinecraftServer.tickServer(MinecraftServer.java:1294)
    at net.minecraft.server.MinecraftServer.runServer(MinecraftServer.java:1029)
    at net.minecraft.server.MinecraftServer.lambda$spin$0(MinecraftServer.java:284)
    at java.base/java.lang.Thread.run(Thread.java:840)

-- System Details --
  Java Version: 21.0.10, Eclipse Adoptium
  Memory: 768288 / 6291456 KB
  CPU: AMD Ryzen 9 7950X 16-Core
  Server engine: Paper 1.21.4 build #523`}
              </div>
              <div style={{marginTop: 16, padding: 14, borderRadius: 8, background: 'var(--accent-soft)', border:'1px solid var(--accent-line)'}}>
                <div className="row gap-8" style={{color:'var(--accent)', fontWeight: 500, marginBottom: 6}}>
                  <Icon d={I.info} size={14} />Suggested fix
                </div>
                <div className="text-dim" style={{fontSize: 13, lineHeight: 1.6}}>
                  Increase RAM allocation to <strong style={{color:'var(--ink-0)'}}>at least 8 GB</strong> in Settings → System & Performance, or split the //paste into smaller chunks. WorldEdit clipboards over 1M blocks need significant heap.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// === Settings tab (server-specific) ===
const ServerSettingsTab = ({ server }) => {
  const [name, setName] = useStateS(server.name);
  const [motd, setMotd] = useStateS(server.motd);
  const [ram, setRam] = useStateS(server.ramMax);
  const [maxPlayers, setMaxPlayers] = useStateS(server.maxPlayers);
  const [viewDist, setViewDist] = useStateS(10);
  const [simDist, setSimDist] = useStateS(10);
  const [pvp, setPvp] = useStateS(server.pvp);
  const [flight, setFlight] = useStateS(server.flight);
  const [whitelist, setWhitelist] = useStateS(server.whitelist);
  const [onlineMode, setOnlineMode] = useStateS(server.onlineMode);
  const [cmdBlocks, setCmdBlocks] = useStateS(true);
  const [keepInv, setKeepInv] = useStateS(false);
  const [mobGriefing, setMobGriefing] = useStateS(true);

  const renderMotd = (s) => {
    const colorMap = { '0':'#000','1':'#00A','2':'#0A0','3':'#0AA','4':'#A00','5':'#A0A','6':'#FA0','7':'#AAA','8':'#555','9':'#55F','a':'#5F5','b':'#5FF','c':'#F55','d':'#F5F','e':'#FF5','f':'#FFF' };
    const out = [];
    let i = 0, color = '#FFF', bold = false;
    while (i < s.length) {
      if (s[i] === '§' && i + 1 < s.length) {
        const code = s[i+1];
        if (colorMap[code]) color = colorMap[code];
        else if (code === 'l') bold = true;
        else if (code === 'r') { color = '#FFF'; bold = false; }
        i += 2;
      } else {
        out.push(<span key={i} style={{color, fontWeight: bold ? 700 : 400}}>{s[i]}</span>);
        i++;
      }
    }
    return out;
  };

  return (
    <>
      <div className="between mb-24">
        <div>
          <h3 className="section-title"><Icon d={I.settings} size={14} />Server Configuration</h3>
          <div className="text-dim" style={{fontSize: 12, marginTop: 4}}>General settings, gameplay rules, and system limits.</div>
        </div>
        <div style={{display:'flex', gap: 8}}>
          <button className="btn ghost sm"><Icon d={I.edit} size={12} />Edit server.properties</button>
          <button className="btn primary sm"><Icon d={I.check} size={12} />Save Changes</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20}}>
        <div className="col">
          <div className="card">
            <div className="card-head"><h4><Icon d={I.info} size={14} />Identity</h4></div>
            <div className="card-pad col gap-16">
              <div className="field">
                <label>Server name</label>
                <input className="input" value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div className="field">
                <label>Message of the day (MOTD)</label>
                <textarea className="textarea" value={motd} onChange={e=>setMotd(e.target.value)} style={{minHeight: 60}} />
                <span className="hint">Use § + color code (e.g. §3, §l, §r)</span>
              </div>
              <div>
                <label style={{fontSize:12, color:'var(--ink-2)', display:'block', marginBottom: 6}}>Preview</label>
                <div className="motd-preview">
                  <div style={{fontSize: 13, fontWeight: 600, color:'#FFF'}}>{name}</div>
                  <div style={{marginTop: 2, fontSize: 12}}>{renderMotd(motd)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h4><Icon d={I.game} size={14} />Gameplay</h4></div>
            <div className="card-pad col gap-16">
              <div className="grid-2">
                <div className="field"><label>Gamemode</label><select className="select" defaultValue={server.gamemode}><option>survival</option><option>creative</option><option>adventure</option><option>spectator</option></select></div>
                <div className="field"><label>Difficulty</label><select className="select" defaultValue={server.difficulty}><option>peaceful</option><option>easy</option><option>normal</option><option>hard</option></select></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Server port</label><input className="input mono" defaultValue={server.address.split(':')[1]} /></div>
                <div className="field"><label>Max players</label><input className="input mono" type="number" value={maxPlayers} onChange={e=>setMaxPlayers(+e.target.value)} /></div>
              </div>

              <div className="col gap-8">
                {[
                  ['PvP', 'Allow players to fight each other', pvp, setPvp],
                  ['Allow flight', 'Allow non-creative flight', flight, setFlight],
                  ['Command blocks', 'Enable command blocks in survival', cmdBlocks, setCmdBlocks],
                  ['Keep inventory', 'Players keep items on death', keepInv, setKeepInv],
                  ['Mob griefing', 'Mobs can break blocks (creepers etc)', mobGriefing, setMobGriefing],
                ].map(([label, desc, v, set], i) => (
                  <div key={i} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'var(--bg-1)', borderRadius: 8, border:'1px solid var(--line-1)'}}>
                    <div>
                      <div style={{fontSize: 13, fontWeight: 500}}>{label}</div>
                      <div className="text-faint" style={{fontSize: 11, marginTop: 1}}>{desc}</div>
                    </div>
                    <div className={`toggle ${v?'on':''}`} onClick={() => set(!v)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="card-head"><h4><Icon d={I.cpu} size={14} />System & Performance</h4></div>
            <div className="card-pad col gap-16">
              <div className="field">
                <div className="between">
                  <label>RAM allocation</label>
                  <span className="text-mono" style={{color:'var(--accent)', fontSize: 18, fontWeight: 600}}>{(ram/1024).toFixed(0)} GB</span>
                </div>
                <input type="range" min="1024" max={32*1024} step="512" value={ram} onChange={e=>setRam(+e.target.value)} style={{width:'100%', accentColor:'var(--accent)'}} />
                <div className="between text-faint text-mono" style={{fontSize: 10}}><span>1 GB</span><span>32 GB</span></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>View distance</label>
                  <div style={{display:'flex', gap: 4, alignItems:'center'}}>
                    <button className="btn ghost icon-only sm" onClick={()=>setViewDist(v=>Math.max(2,v-1))}><Icon d={I.minus} size={12} /></button>
                    <input className="input mono" style={{textAlign:'center'}} value={viewDist} onChange={e=>setViewDist(+e.target.value)} />
                    <button className="btn ghost icon-only sm" onClick={()=>setViewDist(v=>v+1)}><Icon d={I.plus} size={12} /></button>
                  </div>
                </div>
                <div className="field"><label>Simulation distance</label>
                  <div style={{display:'flex', gap: 4, alignItems:'center'}}>
                    <button className="btn ghost icon-only sm" onClick={()=>setSimDist(v=>Math.max(2,v-1))}><Icon d={I.minus} size={12} /></button>
                    <input className="input mono" style={{textAlign:'center'}} value={simDist} onChange={e=>setSimDist(+e.target.value)} />
                    <button className="btn ghost icon-only sm" onClick={()=>setSimDist(v=>v+1)}><Icon d={I.plus} size={12} /></button>
                  </div>
                </div>
              </div>
              <div className="field">
                <label>JVM startup flags</label>
                <textarea className="textarea" placeholder="-XX:+UseG1GC -XX:+ParallelRefProcEnabled …" defaultValue="-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200" />
                <span className="hint">Aikar's flags recommended for &gt;6 GB heap.</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h4><Icon d={I.shield} size={14} />Access Control</h4></div>
            <div className="card-pad col gap-8">
              {[
                ['Enable whitelist', 'Only listed players can join', whitelist, setWhitelist],
                ['Online mode', 'Verify player accounts with Mojang', onlineMode, setOnlineMode],
                ['Enforce secure profiles', 'Block unsigned chat', true, ()=>{}],
              ].map(([label, desc, v, set], i) => (
                <div key={i} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'var(--bg-1)', borderRadius: 8, border:'1px solid var(--line-1)'}}>
                  <div>
                    <div style={{fontSize: 13, fontWeight: 500}}>{label}</div>
                    <div className="text-faint" style={{fontSize: 11, marginTop: 1}}>{desc}</div>
                  </div>
                  <div className={`toggle ${v?'on':''}`} onClick={() => set(!v)} />
                </div>
              ))}
            </div>
          </div>

          <div className="danger-zone">
            <div className="card-head" style={{borderBottomColor:'rgba(248,113,113,0.15)'}}>
              <h4 style={{color:'var(--bad)'}}><Icon d={I.alert} size={14} />Danger Zone</h4>
            </div>
            <div className="card-pad col gap-12">
              <div className="between">
                <div>
                  <div style={{fontSize: 13, fontWeight: 500}}>Reset world</div>
                  <div className="text-faint" style={{fontSize: 12, marginTop: 2}}>Generate a fresh world. Current world is moved to backups.</div>
                </div>
                <button className="btn danger sm">Reset World</button>
              </div>
              <div className="between">
                <div>
                  <div style={{fontSize: 13, fontWeight: 500}}>Delete server</div>
                  <div className="text-faint" style={{fontSize: 12, marginTop: 2}}>Permanently remove this server and all its data.</div>
                </div>
                <button className="btn danger sm">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Server view shell — composes hero + tab content
const ServerView = ({ server, currentTab, onAction }) => {
  const onToggle = () => onAction('toggle-server');
  return (
    <div className="main-inner wide">
      <ServerHero server={server} onToggle={onToggle} onAction={(a) => onAction(a)} />
      {currentTab === 'overview' && <OverviewTab server={server} />}
      {currentTab === 'console' && <ConsoleTab server={server} />}
      {currentTab === 'players' && <PlayersTab server={server} />}
      {currentTab === 'plugins' && <PluginsTab server={server} onBrowse={() => onAction({type:'marketplace'})} />}
      {currentTab === 'worldmap' && <WorldMapTab server={server} />}
      {currentTab === 'files' && <FilesTab server={server} />}
      {currentTab === 'backups' && <BackupsTab server={server} />}
      {currentTab === 'schedules' && <SchedulesTab server={server} />}
      {currentTab === 'crashes' && <CrashesTab server={server} />}
      {currentTab === 'settings' && <ServerSettingsTab server={server} />}
    </div>
  );
};

window.ServerView = ServerView;
window.PlayerHead = PlayerHead;
