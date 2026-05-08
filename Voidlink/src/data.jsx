// Mock data for both online and offline states.

const MOCK_SERVERS = [
  {
    id: 'srv-vault',
    name: 'Vault SMP',
    engine: 'Paper',
    version: '1.21.4',
    hash: '#a4252518',
    color: '#38bdf8',
    glyph: 'V',
    online: true,
    address: '192.168.50.6:25565',
    publicAddress: 'play.voidlink.io:25565',
    cpu: 38.4,
    ram: 4296,
    ramMax: 6144,
    tps: 19.97,
    players: 7,
    maxPlayers: 20,
    uptime: '2d 14h 09m',
    motd: '§3§lVault§r §7• §bA cozy SMP for friends',
    gamemode: 'survival',
    difficulty: 'normal',
    pvp: true,
    flight: false,
    whitelist: true,
    onlineMode: true,
    portStatus: 'forwarded',
    autoBackup: true,
    crashCount: 1,
  },
  {
    id: 'srv-creative',
    name: 'creative-lab',
    engine: 'Purpur',
    version: '1.21.1',
    hash: '#c8e1f02a',
    color: '#a78bfa',
    glyph: 'C',
    online: true,
    address: '192.168.50.6:25566',
    publicAddress: 'lab.voidlink.io:25566',
    cpu: 6.8,
    ram: 1536,
    ramMax: 4096,
    tps: 20.0,
    players: 2,
    maxPlayers: 10,
    uptime: '6h 41m',
    motd: '§dCreative Lab §7• §fbuild freely',
    gamemode: 'creative',
    difficulty: 'peaceful',
    pvp: false,
    flight: true,
    whitelist: false,
    onlineMode: true,
    portStatus: 'forwarded',
    autoBackup: false,
    crashCount: 0,
  },
  {
    id: 'srv-test',
    name: 'test',
    engine: 'Purpur',
    version: '1.21.1',
    hash: '#a4252518',
    color: '#5b6473',
    glyph: 'T',
    online: false,
    address: '192.168.50.6:25567',
    publicAddress: null,
    cpu: 0,
    ram: 0,
    ramMax: 6144,
    tps: 20.0,
    players: 0,
    maxPlayers: 20,
    uptime: '—',
    motd: '§3Server Powered by §bVoidLink',
    gamemode: 'survival',
    difficulty: 'normal',
    pvp: true,
    flight: false,
    whitelist: false,
    onlineMode: true,
    portStatus: 'closed',
    autoBackup: false,
    crashCount: 0,
  },
];

const MOCK_PLAYERS = [
  { uuid: 'b8e2-9a4c', name: 'Kelpie_77', op: true, ping: 28, gm: 'survival', pos: { x: 412, y: 67, z: -1284 }, dim: 'overworld', joined: '2d ago', skinSeed: 1 },
  { uuid: '5a13-7f8e', name: 'oracle', op: true, ping: 41, gm: 'survival', pos: { x: -88, y: 72, z: 332 }, dim: 'overworld', joined: '5h ago', skinSeed: 2 },
  { uuid: 'c2ff-2810', name: 'pixelmage', op: false, ping: 64, gm: 'survival', pos: { x: 1402, y: 12, z: 805 }, dim: 'nether', joined: '1h ago', skinSeed: 3 },
  { uuid: 'aa9c-44b1', name: 'tinyboat', op: false, ping: 35, gm: 'survival', pos: { x: 220, y: 64, z: -50 }, dim: 'overworld', joined: '32m ago', skinSeed: 4 },
  { uuid: '7782-0001', name: 'bramble', op: false, ping: 88, gm: 'survival', pos: { x: -2400, y: 92, z: 1100 }, dim: 'overworld', joined: '12m ago', skinSeed: 5 },
  { uuid: '331e-9990', name: 'low_orbit', op: false, ping: 22, gm: 'survival', pos: { x: 0, y: 200, z: 0 }, dim: 'end', joined: '8m ago', skinSeed: 6 },
  { uuid: 'fff0-ab12', name: 'noctilucent', op: false, ping: 110, gm: 'survival', pos: { x: 540, y: 70, z: 420 }, dim: 'overworld', joined: '3m ago', skinSeed: 7 },
];

const MOCK_PLUGINS = [
  { id: 'coreprotect', name: 'CoreProtect', version: '23.1', author: 'Intelli', tag: 'security', enabled: true, color: '#3b82f6', desc: 'Block-level audit log: who placed/broke what, and when. Roll back grief in seconds.', size: '4.2 MB', deps: ['Vault'] },
  { id: 'lagfixer', name: 'LagFixer', version: '5.4.2', author: 'PrimeGames', tag: 'performance', enabled: true, color: '#10b981', desc: 'Auto-merges entities, clears ground items, throttles redstone hotspots.', size: '1.1 MB', deps: [] },
  { id: 'essentialsx', name: 'EssentialsX', version: '2.20.1', author: 'EssX Team', tag: 'utility', enabled: true, color: '#f59e0b', desc: 'Homes, warps, kits, mail, mute. The classic SMP toolkit.', size: '2.8 MB', deps: ['Vault'] },
  { id: 'vault', name: 'Vault', version: '1.7.3', author: 'MilkBowl', tag: 'api', enabled: true, color: '#a78bfa', desc: 'Permissions/economy abstraction layer. Required by many other plugins.', size: '0.6 MB', deps: [] },
  { id: 'luckperms', name: 'LuckPerms', version: '5.4.130', author: 'lucko', tag: 'permissions', enabled: true, color: '#ec4899', desc: 'High-performance permissions with web UI editor.', size: '3.4 MB', deps: [] },
  { id: 'discordsrv', name: 'DiscordSRV', version: '1.27.0', author: 'Scarsz', tag: 'integration', enabled: false, color: '#5865f2', desc: 'Two-way chat between Minecraft and your Discord server.', size: '5.1 MB', deps: ['Vault'] },
  { id: 'worldedit', name: 'WorldEdit', version: '7.3.4', author: 'EngineHub', tag: 'building', enabled: true, color: '#06b6d4', desc: 'Industry-standard in-game editor for terraforming and structures.', size: '8.9 MB', deps: [] },
  { id: 'dynmap', name: 'Dynmap', version: '3.7.10', author: 'webbukkit', tag: 'map', enabled: true, color: '#84cc16', desc: 'Live web-based map of your world, like Google Maps for Minecraft.', size: '14.2 MB', deps: [] },
];

const MARKETPLACE = [
  { id: 'm-essentialsx', name: 'EssentialsX', author: 'EssX Team', tag: 'Utility', downloads: '24M', rating: 4.8, color: '#f59e0b', desc: 'The classic SMP toolkit — homes, warps, kits, mail.' },
  { id: 'm-luckperms', name: 'LuckPerms', author: 'lucko', tag: 'Permissions', downloads: '18M', rating: 4.9, color: '#ec4899', desc: 'High-performance permissions with web UI editor.' },
  { id: 'm-coreprotect', name: 'CoreProtect', author: 'Intelli', tag: 'Security', downloads: '11M', rating: 4.9, color: '#3b82f6', desc: 'Block-level audit log and rollback.' },
  { id: 'm-discordsrv', name: 'DiscordSRV', author: 'Scarsz', tag: 'Integration', downloads: '9M', rating: 4.7, color: '#5865f2', desc: 'Two-way chat between Minecraft and your Discord.' },
  { id: 'm-worldedit', name: 'WorldEdit', author: 'EngineHub', tag: 'Building', downloads: '32M', rating: 4.9, color: '#06b6d4', desc: 'In-game editor for terraforming and structures.' },
  { id: 'm-dynmap', name: 'Dynmap', author: 'webbukkit', tag: 'Map', downloads: '7M', rating: 4.6, color: '#84cc16', desc: 'Live web-based map of your world.' },
  { id: 'm-bluemap', name: 'BlueMap', author: 'Blue', tag: 'Map', downloads: '3M', rating: 4.8, color: '#0ea5e9', desc: '3D web map renderer.' },
  { id: 'm-papi', name: 'PlaceholderAPI', author: 'helpchat', tag: 'API', downloads: '15M', rating: 4.8, color: '#a78bfa', desc: 'Universal placeholder system for plugin chains.' },
  { id: 'm-viaversion', name: 'ViaVersion', author: 'ViaMCP', tag: 'Compatibility', downloads: '6M', rating: 4.7, color: '#22c55e', desc: 'Connect with newer/older Minecraft clients.' },
];

const MOCK_LOGS = [
  ['11:42:18', 'INFO', 'Starting minecraft server version 1.21.4'],
  ['11:42:18', 'INFO', 'Loading properties'],
  ['11:42:19', 'INFO', 'Default game type: SURVIVAL'],
  ['11:42:19', 'INFO', 'Generating keypair'],
  ['11:42:20', 'INFO', 'Starting Minecraft server on *:25565'],
  ['11:42:21', 'INFO', '[CoreProtect] Enabling CoreProtect v23.1'],
  ['11:42:21', 'INFO', '[LagFixer] Enabling LagFixer v5.4.2'],
  ['11:42:22', 'INFO', '[EssentialsX] Enabling EssentialsX v2.20.1'],
  ['11:42:23', 'INFO', '[LuckPerms] Loaded 14 groups, 8 users'],
  ['11:42:23', 'INFO', '[Vault] Enabling Vault v1.7.3'],
  ['11:42:24', 'INFO', '[WorldEdit] Enabling WorldEdit v7.3.4'],
  ['11:42:24', 'INFO', '[Dynmap] Web server started on http://0.0.0.0:8123'],
  ['11:42:25', 'INFO', 'Preparing level "world"'],
  ['11:42:28', 'INFO', 'Preparing spawn area: 0%'],
  ['11:42:31', 'INFO', 'Preparing spawn area: 47%'],
  ['11:42:33', 'INFO', 'Done (12.812s)! For help, type "help"'],
  ['11:42:33', 'INFO', 'Timings Reset'],
  ['11:43:12', 'INFO', '<<player>>Kelpie_77<</player>> joined the game'],
  ['11:43:12', 'INFO', '<<player>>Kelpie_77<</player>> issued server command: /home'],
  ['11:43:42', 'INFO', '<<player>>oracle<</player>> joined the game'],
  ['11:44:07', 'WARN', 'Can\'t keep up! Is the server overloaded? Running 2031ms or 40 ticks behind'],
  ['11:44:18', 'INFO', '<<player>>oracle<</player>> teleported to <<coord>>412 67 -1284<</coord>>'],
  ['11:45:02', 'INFO', '<<player>>pixelmage<</player>> joined the game'],
  ['11:45:34', 'INFO', '<chat> <<player>>Kelpie_77<</player>>: anyone working on the iron farm?'],
  ['11:45:48', 'INFO', '<chat> <<player>>oracle<</player>>: i can help in 5'],
  ['11:46:11', 'DEBUG', '[Spark] Profiling cycle complete (avg TPS: 19.94)'],
  ['11:46:32', 'INFO', '<<player>>tinyboat<</player>> joined the game'],
  ['11:48:09', 'INFO', '<<player>>pixelmage<</player>> entered the Nether at <<coord>>1402 12 805<</coord>>'],
  ['11:50:12', 'WARN', '[Dynmap] Render queue is 8412 tiles deep'],
  ['11:51:00', 'INFO', '[CoreProtect] Database optimization complete (28.4MB)'],
  ['11:52:18', 'INFO', '<chat> <<player>>tinyboat<</player>>: brb dinner'],
  ['11:55:41', 'INFO', '<<player>>tinyboat<</player>> left the game'],
  ['11:58:19', 'INFO', '<<player>>bramble<</player>> joined the game'],
  ['12:01:48', 'INFO', '<<player>>low_orbit<</player>> joined the game'],
  ['12:03:11', 'INFO', '<chat> <<player>>low_orbit<</player>>: pushing to end raid in 10 mins'],
  ['12:05:32', 'INFO', '<<player>>noctilucent<</player>> joined the game'],
];

const SCHEDULES = [
  { id: 's1', name: 'Nightly backup', cron: 'every day at 03:00', action: 'backup full', enabled: true, last: '8h ago', next: 'in 15h 41m' },
  { id: 's2', name: 'Weekend restart', cron: 'sat & sun at 06:00', action: 'restart', enabled: true, last: '3d ago', next: 'in 4d 6h' },
  { id: 's3', name: 'Hourly /save-all', cron: 'every hour at :00', action: 'console: save-all flush', enabled: true, last: '12m ago', next: 'in 48m' },
  { id: 's4', name: 'Daily restart announcement', cron: 'every day at 05:55', action: 'broadcast', enabled: true, last: '23h ago', next: 'in 1h 11m' },
  { id: 's5', name: 'Weekly Dynmap fullrender', cron: 'sun at 04:30', action: 'console: dynmap fullrender world', enabled: false, last: '1w ago', next: '—' },
];

const BACKUPS = [
  { id: 'b1', name: 'auto-2026-05-06-03-00', size: '2.4 GB', date: 'Today, 03:00', type: 'auto', includes: ['world', 'world_nether', 'world_the_end', 'plugins'], duration: '38s' },
  { id: 'b2', name: 'auto-2026-05-05-03-00', size: '2.4 GB', date: 'Yesterday, 03:00', type: 'auto', includes: ['world', 'world_nether', 'world_the_end', 'plugins'], duration: '37s' },
  { id: 'b3', name: 'pre-update-1.21.4', size: '2.3 GB', date: 'May 03, 14:22', type: 'manual', includes: ['world', 'world_nether', 'world_the_end', 'plugins', 'config'], duration: '41s' },
  { id: 'b4', name: 'auto-2026-05-04-03-00', size: '2.3 GB', date: 'May 04, 03:00', type: 'auto', includes: ['world', 'world_nether', 'world_the_end', 'plugins'], duration: '36s' },
  { id: 'b5', name: 'manual-iron-farm-done', size: '2.2 GB', date: 'May 02, 22:11', type: 'manual', includes: ['world', 'plugins'], duration: '32s' },
  { id: 'b6', name: 'auto-2026-05-03-03-00', size: '2.2 GB', date: 'May 03, 03:00', type: 'auto', includes: ['world', 'world_nether', 'world_the_end', 'plugins'], duration: '34s' },
];

const CRASHES = [
  { id: 'c1', date: 'May 04, 18:42', cause: 'java.lang.OutOfMemoryError: Java heap space', plugin: 'WorldEdit', engine: 'Paper 1.21.4', severity: 'fatal', resolved: false, summary: 'Heap exhausted during //paste of 2.1M block clipboard.' },
];

const FILES = [
  { name: 'world', type: 'dir', size: '1.4 GB', modified: '2 min ago' },
  { name: 'world_nether', type: 'dir', size: '412 MB', modified: '8 min ago' },
  { name: 'world_the_end', type: 'dir', size: '88 MB', modified: '1h ago' },
  { name: 'plugins', type: 'dir', size: '142 MB', modified: '2d ago' },
  { name: 'logs', type: 'dir', size: '74 MB', modified: 'just now' },
  { name: 'config', type: 'dir', size: '2.4 MB', modified: '3d ago' },
  { name: 'crash-reports', type: 'dir', size: '1.1 MB', modified: 'May 04' },
  { name: 'banned-players.json', type: 'file', size: '124 B', modified: 'never' },
  { name: 'banned-ips.json', type: 'file', size: '52 B', modified: 'never' },
  { name: 'eula.txt', type: 'file', size: '156 B', modified: 'Apr 02' },
  { name: 'ops.json', type: 'file', size: '412 B', modified: '2d ago' },
  { name: 'paper.yml', type: 'file', size: '12 KB', modified: '2d ago' },
  { name: 'paper-global.yml', type: 'file', size: '6.4 KB', modified: '2d ago' },
  { name: 'server.properties', type: 'file', size: '1.4 KB', modified: '2d ago' },
  { name: 'spigot.yml', type: 'file', size: '3.8 KB', modified: '2d ago' },
  { name: 'whitelist.json', type: 'file', size: '892 B', modified: '5h ago' },
];

const ACTIVITY_FEED = [
  { time: '12:08', server: 'Vault SMP', kind: 'join', text: 'noctilucent joined', icon: 'user' },
  { time: '12:03', server: 'Vault SMP', kind: 'chat', text: 'low_orbit: pushing to end raid in 10 mins', icon: 'hash' },
  { time: '12:01', server: 'Vault SMP', kind: 'join', text: 'low_orbit joined', icon: 'user' },
  { time: '11:58', server: 'Vault SMP', kind: 'join', text: 'bramble joined', icon: 'user' },
  { time: '11:50', server: 'Vault SMP', kind: 'warn', text: 'Dynmap render queue is 8,412 tiles deep', icon: 'alert' },
  { time: '11:44', server: 'Vault SMP', kind: 'warn', text: 'Tick lag — 2031ms behind for 40 ticks', icon: 'alert' },
  { time: '11:42', server: 'Vault SMP', kind: 'system', text: 'Server started in 12.8s', icon: 'rocket' },
  { time: '08:12', server: 'creative-lab', kind: 'system', text: 'Auto-restart completed', icon: 'refresh' },
  { time: '03:00', server: 'Vault SMP', kind: 'backup', text: 'Backup completed (2.4 GB, 38s)', icon: 'archive' },
  { time: 'May 04, 18:42', server: 'Vault SMP', kind: 'crash', text: 'Crash: OOM during //paste', icon: 'flame' },
];

window.MOCK_SERVERS = MOCK_SERVERS;
window.MOCK_PLAYERS = MOCK_PLAYERS;
window.MOCK_PLUGINS = MOCK_PLUGINS;
window.MARKETPLACE = MARKETPLACE;
window.MOCK_LOGS = MOCK_LOGS;
window.SCHEDULES = SCHEDULES;
window.BACKUPS = BACKUPS;
window.CRASHES = CRASHES;
window.FILES = FILES;
window.ACTIVITY_FEED = ACTIVITY_FEED;
