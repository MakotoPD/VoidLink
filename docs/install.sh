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
ICONS_DIR="$HOME/.local/share/icons"

echo -e "${BLUE}"
echo "  ╦  ╦╔═╗╦╔╦╗╦  ╦╔╗╔╦╔═"
echo "  ╚╗╔╝║ ║║ ║║║  ║║║║╠╩╗"
echo "   ╚╝ ╚═╝╩═╩╝╩═╝╩╝╚╝╩ ╩"
echo -e "${NC}"
echo -e "${GREEN}VoidLink Installer${NC}"
echo "================================"
echo ""

# Check for required tools
check_requirements() {
    local missing=()
    
    if ! command -v curl &> /dev/null; then
        missing+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}Note: jq not found, will use grep fallback${NC}"
    fi
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${RED}Error: Missing required tools: ${missing[*]}${NC}"
        echo "Please install them and try again."
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

# Create directories if they don't exist
setup_directories() {
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$APPLICATIONS_DIR"
    mkdir -p "$ICONS_DIR"
}

# Download the AppImage
download_appimage() {
    local filename="${APP_NAME}.AppImage"
    local filepath="${INSTALL_DIR}/${filename}"
    
    echo -e "${BLUE}→ Downloading ${APP_NAME} ${VERSION}...${NC}"
    
    # Remove old version if exists
    if [ -f "$filepath" ]; then
        echo -e "  Removing old version..."
        rm -f "$filepath"
    fi
    
    # Download new version
    curl -sSL "$APPIMAGE_URL" -o "$filepath"
    chmod +x "$filepath"
    
    echo -e "  ${GREEN}Downloaded to: ${filepath}${NC}"
}

# Download icon
download_icon() {
    echo -e "${BLUE}→ Downloading icon...${NC}"
    
    local icon_url="https://raw.githubusercontent.com/${GITHUB_REPO}/main/src-tauri/icons/128x128.png"
    
    # Install to hicolor theme (standard location for most DEs)
    local hicolor_dir="$HOME/.local/share/icons/hicolor/128x128/apps"
    mkdir -p "$hicolor_dir"
    
    curl -sSL "$icon_url" -o "${hicolor_dir}/voidlink.png" 2>/dev/null || true
    
    # Also copy to a fallback location
    mkdir -p "$ICONS_DIR"
    cp "${hicolor_dir}/voidlink.png" "${ICONS_DIR}/voidlink.png" 2>/dev/null || true
    
    # Update icon cache if available
    if command -v gtk-update-icon-cache &> /dev/null; then
        gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
    fi
    
    if [ -f "${hicolor_dir}/voidlink.png" ]; then
        echo -e "  ${GREEN}Icon installed${NC}"
    fi
}

# Create desktop entry
create_desktop_entry() {
    echo -e "${BLUE}→ Creating desktop entry...${NC}"
    
    local desktop_file="${APPLICATIONS_DIR}/voidlink.desktop"
    local exec_path="${INSTALL_DIR}/${APP_NAME}.AppImage"
    
    # Use icon name without path - will be found in hicolor theme
    cat > "$desktop_file" << 'DESKTOP_EOF'
[Desktop Entry]
Name=VoidLink
GenericName=Minecraft Server Manager
Comment=Minecraft Server Dashboard
Exec=EXEC_PATH_PLACEHOLDER
Icon=voidlink
Terminal=false
Type=Application
Categories=Game;Utility;Network;
Keywords=minecraft;server;dashboard;
StartupWMClass=VoidLink
StartupNotify=true
DESKTOP_EOF
    
    # Replace placeholder with actual path
    sed -i "s|EXEC_PATH_PLACEHOLDER|${exec_path}|g" "$desktop_file"
    
    chmod +x "$desktop_file"
    
    # Update desktop database
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
    fi
    
    # Some DEs need this to refresh
    if command -v xdg-desktop-menu &> /dev/null; then
        xdg-desktop-menu forceupdate 2>/dev/null || true
    fi
    
    echo -e "  ${GREEN}Desktop entry created${NC}"
    echo -e "  ${YELLOW}Note: You may need to log out and back in for the app to appear in menus${NC}"
}

# Add to PATH if needed
setup_path() {
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        echo -e "${YELLOW}Note: ${INSTALL_DIR} is not in your PATH${NC}"
        echo -e "Add this to your ~/.bashrc or ~/.zshrc:"
        echo -e "  ${BLUE}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
        echo ""
    fi
}

# Main installation
main() {
    echo -e "${BLUE}Starting installation...${NC}"
    echo ""
    
    check_requirements
    get_latest_release
    setup_directories
    download_appimage
    download_icon
    create_desktop_entry
    setup_path
    
    echo ""
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ VoidLink ${VERSION} installed successfully!${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo ""
    echo -e "You can now:"
    echo -e "  • Launch from your application menu"
    echo -e "  • Run: ${BLUE}${INSTALL_DIR}/${APP_NAME}.AppImage${NC}"
    echo ""
    echo -e "${YELLOW}Note: Auto-updates are built-in. VoidLink will"
    echo -e "notify you when a new version is available.${NC}"
    echo ""
}

# Uninstall function
uninstall() {
    echo -e "${YELLOW}Uninstalling VoidLink...${NC}"
    
    rm -f "${INSTALL_DIR}/${APP_NAME}.AppImage"
    rm -f "${APPLICATIONS_DIR}/voidlink.desktop"
    rm -f "${ICONS_DIR}/voidlink.png"
    
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
    fi
    
    echo -e "${GREEN}VoidLink has been uninstalled.${NC}"
}

# Check for uninstall flag
if [ "$1" = "--uninstall" ] || [ "$1" = "-u" ]; then
    uninstall
    exit 0
fi

main
