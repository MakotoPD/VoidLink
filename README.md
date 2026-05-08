![banner](https://i.imgur.com/KWatIFf.png)

# Server Creator (VoidLink)

A modern, powerful, and easy-to-use desktop application for creating and managing Minecraft servers. Built with **Tauri 2.0**, **Nuxt 3**, and **TypeScript**.

🌐 **Website**: [makotopd.github.io/VoidLink](https://makotopd.github.io/VoidLink/) — Download links and Linux one-line installer

##  Images

![main menu](https://i.imgur.com/lDFr5am.png)

<details>
  <summary>Server Dashboard</summary>

  Dashboard allows you to monitor your server, view console, and manage server settings.

  ![server performance](https://i.imgur.com/mqfCDIm.png)
  
  ![server console](https://i.imgur.com/YJdoSDG.png)

  ![server settings](https://i.imgur.com/fEZkcRv.png)

  ![server mods/plugins](https://i.imgur.com/lMmEFit.png)

  ![server mods/plugins download](https://i.imgur.com/9mu7y7u.png)

</details>

<details>
  <summary>Create Server</summary>
  
  You can create servers with different game engines like Vanilla, Forge, Fabric, Quilt, and Modrinth modpacks.
  
  ![select engine](https://i.imgur.com/A8gz34G.png)

</details>

<details>
  <summary>System Tray</summary>

  Manage your servers from the system tray.

  ![system tray](https://i.imgur.com/GLJoCnn.png)

</details>

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

### 💻 Console
- **Live Console**: Real-time server logs with command input support.

### 🌍 Built-in Tunneling (VoidLink Tunnels)
Safe and easy way to expose your local Minecraft server to the internet without port forwarding.
This application uses our custom tunneling solution: [VoidLink-Tunnels](https://github.com/MakotoPD/VoidLink-Tunnels).

- **No Port Forwarding needed**: Works behind NAT and CGNAT.
- **Secure**: Uses token-based authentication.
- **TCP & UDP Support**: Supports both game traffic and Voice Chat.


## 🛠️ Technology Stack

- **Frontend**: Nuxt 3, Vue 3, Nuxt UI, TailwindCSS
- **Backend (OS Integration)**: Tauri 2.0 (Rust)
- **State Management**: Pinia
- **Icons**: Lucide Icons

## 🔮 Future Roadmap

Here is what we plan to add in upcoming updates:

- [X] **Modpack Installer**: One-click installation of popular modpacks (CurseForge/Modrinth).
- [X] **Backup System**: Automated and manual world backups with restore functionality.
- [X] **Player Manager**: GUI for managing Whitelist, Ops, and Banned players.
- [ ] **Scheduled Tasks**: Auto-restart and scheduled commands.
- [ ] **Advanced Network**: Tunnel integration.
- [X] **Multi-Version Support**: Better handling of Java versions manager for older Minecraft versions.
- [ ] **Multi-Games Support**: Support for multiple Games. Not only Minecraft.

## ⚠️ Windows Security Warning (False Positive)

**Important Notice**: Due to unsigned binaries and the FRP sidecar, Windows Defender and other antivirus software may flag VoidLink as suspicious or potentially unwanted. **This is a false positive.**

### Why does this happen?
- The application includes FRP (Fast Reverse Proxy) binary for tunneling functionality
- Unsigned applications trigger Windows SmartScreen warnings
- Network tunneling tools are often flagged by antivirus software

### How to safely install:

1. **Download from official sources only**: 
   - [GitHub Releases](https://github.com/MakotoPD/VoidLink/releases)
   - Verify the SHA256 checksum provided in release notes

2. **Windows SmartScreen**:
   - Click **"More info"** → **"Run anyway"** when prompted

3. **Windows Defender** (if blocked):
   - Open **Windows Security** → **Virus & threat protection**
   - Click **Protection history**
   - Find VoidLink → **Actions** → **Allow**

4. **Optional**: Add an exception for VoidLink installation directory in your antivirus

We are working on code signing to eliminate these warnings in future releases.

## 🍎 macOS Troubleshooting (App is damaged)

If you see a message saying **"VoidLink is damaged and can't be opened"**, this is a normal security check for apps not signed with a paid Apple Developer certificate.

To fix this, run the following command in your terminal:
```bash
sudo xattr -cr /Applications/VoidLink.app
```
(Make sure the app is in your Applications folder first).
