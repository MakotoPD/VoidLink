# Server Creator (MineDash)

A modern, powerful, and easy-to-use desktop application for creating and managing Minecraft servers. Built with **Tauri 2.0**, **Nuxt 3**, and **TypeScript**.

## 🚀 Features

### 🖥️ Dashboard & Server Management
- **Intuitive UI**: Beautiful, dark-mode ready interface built with Nuxt UI and TailwindCSS.
- **Server Overview**: Monitor all your servers, their status, and key metrics at a glance.
- **One-Click Start**: Start, stop, and restart servers instantly.
- **System Tray**: Minimize to tray and manage servers from the context menu.

### ⚙️ Enhanced Configuration
- **Unified Settings**: Manage `server.properties` and system settings in one place.
- **Java Management**:
  - Configurable RAM allocation (1GB - 32GB).
  - Custom JVM startup flags (e.g., Aikar's flags).
  - Java path selection.
- **MOTD Editor**: Visual editor with real-time preview and support for Minecraft color/formatting codes.
- **Gameplay Toggles**: Easily switch Gamemode, Difficulty, PVP, Flight, and Command Blocks.
- **Port Management**: Simple numeric input for server port with safety validation.

### 📦 Addons & Mods
- **Modrinth Integration**: Browse, search, and install plugins/mods directly from the app.
- **Automatic Dependencies**: Resolves and installs required dependencies automatically.

### 💻 Console & Files
- **Live Console**: Real-time server logs with command input support.
- **File Manager**: Built-in simple file browser to manage server files.

## 🛠️ Technology Stack

- **Frontend**: Nuxt 3, Vue 3, Nuxt UI, TailwindCSS
- **Backend (OS Integration)**: Tauri 2.0 (Rust)
- **State Management**: Pinia
- **Icons**: Lucide Icons

## 🔮 Future Roadmap

Here is what we plan to add in upcoming updates:

- [ ] **Modpack Installer**: One-click installation of popular modpacks (CurseForge/Modrinth).
- [ ] **Backup System**: Automated and manual world backups with restore functionality.
- [ ] **Player Manager**: GUI for managing Whitelist, Ops, and Banned players.
- [ ] **Scheduled Tasks**: Auto-restart and scheduled commands.
- [ ] **Advanced Network**: Port forwarding helper or tunnel integration (e.g., playit.gg).
- [ ] **Multi-Version Support**: Better handling of Java versions manager for older Minecraft versions.
