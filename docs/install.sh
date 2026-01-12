#!/bin/bash
#
# VoidLink Installer for Linux
# Downloads and installs the latest AppImage with desktop integration
#
# Usage: curl -sSL https://makotopd.github.io/VoidLink/install.sh | bash
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_NAME="VoidLink"
GITHUB_REPO="MakotoPD/VoidLink"
INSTALL_DIR="$HOME/.local/bin"
APPLICATIONS_DIR="$HOME/.local/share/applications"

echo -e "${BLUE}"
echo "  ╦  ╦╔═╗╦╔╦╗╦  ╦╔╗╔╦╔═"
echo "  ╚╗╔╝║ ║║ ║║║  ║║║║╠╩╗"
echo "   ╚╝ ╚═╝╩═╩╝╩═╝╩╝╚╝╩ ╩"
echo -e "${NC}"
echo -e "${GREEN}VoidLink Installer${NC}"
echo "================================"
echo ""

# Detect desktop environment
detect_de() {
    if [ "$XDG_CURRENT_DESKTOP" ]; then
        echo "$XDG_CURRENT_DESKTOP"
    elif [ "$DESKTOP_SESSION" ]; then
        echo "$DESKTOP_SESSION"
    else
        echo "unknown"
    fi
}

# Detect distro
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$ID"
    else
        echo "unknown"
    fi
}

DE=$(detect_de)
DISTRO=$(detect_distro)
echo -e "Detected: ${BLUE}${DISTRO}${NC} with ${BLUE}${DE}${NC}"
echo ""

# Check for required tools
check_requirements() {
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}Error: curl is required${NC}"
        exit 1
    fi
}

# Get the latest release info from GitHub
get_latest_release() {
    echo -e "${BLUE}→ Fetching latest release info...${NC}"
    
    RELEASE_INFO=$(curl -sSL "https://api.github.com/repos/${GITHUB_REPO}/releases/latest")
    
    if command -v jq &> /dev/null; then
        VERSION=$(echo "$RELEASE_INFO" | jq -r '.tag_name')
        APPIMAGE_URL=$(echo "$RELEASE_INFO" | jq -r '.assets[] | select(.name | endswith(".AppImage")) | .browser_download_url' | head -1)
    else
        VERSION=$(echo "$RELEASE_INFO" | grep -oP '"tag_name":\s*"\K[^"]+' | head -1)
        APPIMAGE_URL=$(echo "$RELEASE_INFO" | grep -oP '"browser_download_url":\s*"\K[^"]+\.AppImage' | head -1)
    fi
    
    if [ -z "$VERSION" ] || [ -z "$APPIMAGE_URL" ]; then
        echo -e "${RED}Error: Could not find latest release${NC}"
        exit 1
    fi
    
    echo -e "  Latest version: ${GREEN}${VERSION}${NC}"
}

# Create directories
setup_directories() {
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$APPLICATIONS_DIR"
    mkdir -p "$HOME/.local/share/icons/hicolor/128x128/apps"
    mkdir -p "$HOME/.local/share/icons/hicolor/256x256/apps"
}

# Download the AppImage
download_appimage() {
    local filepath="${INSTALL_DIR}/${APP_NAME}.AppImage"
    
    echo -e "${BLUE}→ Downloading ${APP_NAME} ${VERSION}...${NC}"
    
    rm -f "$filepath" 2>/dev/null || true
    curl -sSL "$APPIMAGE_URL" -o "$filepath"
    chmod +x "$filepath"
    
    echo -e "  ${GREEN}Downloaded to: ${filepath}${NC}"
}

# Download icons
download_icons() {
    echo -e "${BLUE}→ Downloading icons...${NC}"
    
    # Download multiple sizes for better compatibility
    curl -sSL "https://raw.githubusercontent.com/${GITHUB_REPO}/main/src-tauri/icons/128x128.png" \
        -o "$HOME/.local/share/icons/hicolor/128x128/apps/voidlink.png" 2>/dev/null || true
    
    curl -sSL "https://raw.githubusercontent.com/${GITHUB_REPO}/main/src-tauri/icons/128x128@2x.png" \
        -o "$HOME/.local/share/icons/hicolor/256x256/apps/voidlink.png" 2>/dev/null || true
    
    echo -e "  ${GREEN}Icons installed${NC}"
}

# Create desktop entry
create_desktop_entry() {
    echo -e "${BLUE}→ Creating desktop entry...${NC}"
    
    local desktop_file="${APPLICATIONS_DIR}/voidlink.desktop"
    local exec_path="${INSTALL_DIR}/${APP_NAME}.AppImage"
    
    cat > "$desktop_file" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=VoidLink
GenericName=Minecraft Server Manager
Comment=Minecraft Server Dashboard
Exec=${exec_path} %U
Icon=voidlink
Terminal=false
Categories=Game;Utility;
Keywords=minecraft;server;dashboard;
StartupWMClass=VoidLink
StartupNotify=true
EOF
    
    # Validate desktop file if desktop-file-validate is available
    if command -v desktop-file-validate &> /dev/null; then
        if desktop-file-validate "$desktop_file" 2>/dev/null; then
            echo -e "  ${GREEN}Desktop file validated${NC}"
        fi
    fi
    
    echo -e "  ${GREEN}Desktop entry created: ${desktop_file}${NC}"
}

# Refresh desktop database based on DE
refresh_desktop_database() {
    echo -e "${BLUE}→ Refreshing desktop database...${NC}"
    
    # Update desktop database
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
    fi
    
    # Update icon cache
    if command -v gtk-update-icon-cache &> /dev/null; then
        gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
    fi
    
    # GNOME specific - restart shell for immediate effect
    if [[ "$DE" == *"GNOME"* ]]; then
        echo -e "  ${YELLOW}GNOME detected - you may need to press Alt+F2, type 'r' and press Enter to refresh${NC}"
    fi
    
    # KDE specific
    if [[ "$DE" == *"KDE"* ]] || [[ "$DE" == *"plasma"* ]]; then
        if command -v kbuildsycoca5 &> /dev/null; then
            kbuildsycoca5 2>/dev/null || true
        fi
    fi
    
    # xdg-desktop-menu
    if command -v xdg-desktop-menu &> /dev/null; then
        xdg-desktop-menu forceupdate 2>/dev/null || true
    fi
    
    echo -e "  ${GREEN}Done${NC}"
}

# Main installation
main() {
    echo -e "${BLUE}Starting installation...${NC}"
    echo ""
    
    check_requirements
    get_latest_release
    setup_directories
    download_appimage
    download_icons
    create_desktop_entry
    refresh_desktop_database
    
    echo ""
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ VoidLink ${VERSION} installed successfully!${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo ""
    echo -e "Installation locations:"
    echo -e "  • App:     ${BLUE}${INSTALL_DIR}/${APP_NAME}.AppImage${NC}"
    echo -e "  • Desktop: ${BLUE}${APPLICATIONS_DIR}/voidlink.desktop${NC}"
    echo ""
    echo -e "${YELLOW}If you don't see VoidLink in your app menu:${NC}"
    echo -e "  1. Log out and log back in"
    echo -e "  2. Or run: ${BLUE}${INSTALL_DIR}/${APP_NAME}.AppImage${NC}"
    echo ""
}

# Uninstall function
uninstall() {
    echo -e "${YELLOW}Uninstalling VoidLink...${NC}"
    
    rm -f "${INSTALL_DIR}/${APP_NAME}.AppImage"
    rm -f "${APPLICATIONS_DIR}/voidlink.desktop"
    rm -f "$HOME/.local/share/icons/hicolor/128x128/apps/voidlink.png"
    rm -f "$HOME/.local/share/icons/hicolor/256x256/apps/voidlink.png"
    
    # Refresh
    update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
    gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
    
    echo -e "${GREEN}VoidLink has been uninstalled.${NC}"
}

# Check for uninstall flag
if [ "$1" = "--uninstall" ] || [ "$1" = "-u" ]; then
    uninstall
    exit 0
fi

main
