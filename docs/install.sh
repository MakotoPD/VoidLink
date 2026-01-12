#!/bin/bash
#
# VoidLink Installer for Linux
# Downloads and installs the AppImage with desktop integration
#
# Usage: 
#   curl -sSL https://makotopd.github.io/VoidLink/install.sh | bash
#   curl -sSL https://makotopd.github.io/VoidLink/install.sh | bash -s -- --version v0.3.17
#   curl -sSL https://makotopd.github.io/VoidLink/install.sh | bash -s -- --debug
#   curl -sSL https://makotopd.github.io/VoidLink/install.sh | bash -s -- --uninstall
#

set -e

# Default values
VERSION=""
DEBUG=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

APP_NAME="VoidLink"
GITHUB_REPO="MakotoPD/VoidLink"
INSTALL_DIR="$HOME/.local/bin"
APPLICATIONS_DIR="$HOME/.local/share/applications"

# Debug logging
debug() {
    if [ "$DEBUG" = true ]; then
        echo -e "${GRAY}[DEBUG] $1${NC}"
    fi
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            -d|--debug)
                DEBUG=true
                shift
                ;;
            -u|--uninstall)
                uninstall
                exit 0
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            --list)
                list_versions
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

# Show help
show_help() {
    echo "VoidLink Installer"
    echo ""
    echo "Usage: install.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -v, --version <tag>    Install specific version (e.g., v0.3.17)"
    echo "  -d, --debug            Enable debug output"
    echo "  -u, --uninstall        Uninstall VoidLink"
    echo "  --list                 List available versions"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  Install latest:   curl -sSL .../install.sh | bash"
    echo "  Specific version: curl -sSL .../install.sh | bash -s -- -v v0.3.17"
    echo "  With debug:       curl -sSL .../install.sh | bash -s -- --debug"
}

# List available versions
list_versions() {
    echo -e "${BLUE}Fetching available versions...${NC}"
    RELEASES=$(curl -sSL "https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=10")
    
    if command -v jq &> /dev/null; then
        echo "$RELEASES" | jq -r '.[].tag_name'
    else
        echo "$RELEASES" | grep -oP '"tag_name":\s*"\K[^"]+' | head -10
    fi
}

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

# Check for required tools
check_requirements() {
    debug "Checking requirements..."
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}Error: curl is required${NC}"
        exit 1
    fi
    
    debug "curl: OK"
    
    if command -v jq &> /dev/null; then
        debug "jq: OK (will use for JSON parsing)"
    else
        debug "jq: not found (will use grep fallback)"
    fi
}

# Get release info from GitHub
get_release() {
    if [ -n "$VERSION" ]; then
        echo -e "${BLUE}→ Fetching version ${VERSION}...${NC}"
        debug "API URL: https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${VERSION}"
        RELEASE_INFO=$(curl -sSL "https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${VERSION}")
    else
        echo -e "${BLUE}→ Fetching latest release...${NC}"
        debug "API URL: https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
        RELEASE_INFO=$(curl -sSL "https://api.github.com/repos/${GITHUB_REPO}/releases/latest")
    fi
    
    debug "Response length: ${#RELEASE_INFO} bytes"
    
    if command -v jq &> /dev/null; then
        VERSION=$(echo "$RELEASE_INFO" | jq -r '.tag_name')
        APPIMAGE_URL=$(echo "$RELEASE_INFO" | jq -r '.assets[] | select(.name | endswith(".AppImage")) | .browser_download_url' | head -1)
        debug "Parsed with jq"
    else
        VERSION=$(echo "$RELEASE_INFO" | grep -oP '"tag_name":\s*"\K[^"]+' | head -1)
        APPIMAGE_URL=$(echo "$RELEASE_INFO" | grep -oP '"browser_download_url":\s*"\K[^"]+\.AppImage' | head -1)
        debug "Parsed with grep"
    fi
    
    debug "VERSION: $VERSION"
    debug "APPIMAGE_URL: $APPIMAGE_URL"
    
    if [ -z "$VERSION" ] || [ "$VERSION" = "null" ]; then
        echo -e "${RED}Error: Could not find release${NC}"
        exit 1
    fi
    
    if [ -z "$APPIMAGE_URL" ] || [ "$APPIMAGE_URL" = "null" ]; then
        echo -e "${RED}Error: No AppImage found in release${NC}"
        exit 1
    fi
    
    echo -e "  Version: ${GREEN}${VERSION}${NC}"
}

# Create directories
setup_directories() {
    debug "Creating directories..."
    
    mkdir -p "$INSTALL_DIR"
    debug "Created: $INSTALL_DIR"
    
    mkdir -p "$APPLICATIONS_DIR"
    debug "Created: $APPLICATIONS_DIR"
    
    mkdir -p "$HOME/.local/share/icons/hicolor/128x128/apps"
    mkdir -p "$HOME/.local/share/icons/hicolor/256x256/apps"
    debug "Created icon directories"
}

# Download the AppImage
download_appimage() {
    local filepath="${INSTALL_DIR}/${APP_NAME}.AppImage"
    
    echo -e "${BLUE}→ Downloading ${APP_NAME} ${VERSION}...${NC}"
    debug "Download URL: $APPIMAGE_URL"
    debug "Target path: $filepath"
    
    rm -f "$filepath" 2>/dev/null || true
    
    if [ "$DEBUG" = true ]; then
        curl -L --progress-bar "$APPIMAGE_URL" -o "$filepath"
    else
        curl -sSL "$APPIMAGE_URL" -o "$filepath"
    fi
    
    chmod +x "$filepath"
    
    local size=$(du -h "$filepath" | cut -f1)
    echo -e "  ${GREEN}Downloaded: ${filepath} (${size})${NC}"
    debug "File size: $size"
}

# Download icons
download_icons() {
    echo -e "${BLUE}→ Downloading icons...${NC}"
    
    debug "Downloading 128x128 icon..."
    curl -sSL "https://raw.githubusercontent.com/${GITHUB_REPO}/main/src-tauri/icons/128x128.png" \
        -o "$HOME/.local/share/icons/hicolor/128x128/apps/voidlink.png" 2>/dev/null || true
    
    debug "Downloading 256x256 icon..."
    curl -sSL "https://raw.githubusercontent.com/${GITHUB_REPO}/main/src-tauri/icons/128x128@2x.png" \
        -o "$HOME/.local/share/icons/hicolor/256x256/apps/voidlink.png" 2>/dev/null || true
    
    echo -e "  ${GREEN}Icons installed${NC}"
}

# Create desktop entry
create_desktop_entry() {
    echo -e "${BLUE}→ Creating desktop entry...${NC}"
    
    local desktop_file="${APPLICATIONS_DIR}/voidlink.desktop"
    local exec_path="${INSTALL_DIR}/${APP_NAME}.AppImage"
    
    debug "Desktop file: $desktop_file"
    debug "Exec path: $exec_path"
    
    cat > "$desktop_file" <<EOF
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
    
    # Validate desktop file
    if command -v desktop-file-validate &> /dev/null; then
        if desktop-file-validate "$desktop_file" 2>/dev/null; then
            debug "Desktop file validation: OK"
        else
            debug "Desktop file validation: FAILED (non-fatal)"
        fi
    fi
    
    echo -e "  ${GREEN}Desktop entry created${NC}"
}

# Refresh desktop database
refresh_desktop_database() {
    echo -e "${BLUE}→ Refreshing desktop database...${NC}"
    
    if command -v update-desktop-database &> /dev/null; then
        debug "Running update-desktop-database..."
        update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
    fi
    
    if command -v gtk-update-icon-cache &> /dev/null; then
        debug "Running gtk-update-icon-cache..."
        gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
    fi
    
    # DE-specific refreshes
    if [[ "$DE" == *"GNOME"* ]]; then
        debug "GNOME detected"
        echo -e "  ${YELLOW}GNOME: Press Alt+F2, type 'r', Enter to refresh${NC}"
    fi
    
    if [[ "$DE" == *"KDE"* ]] || [[ "$DE" == *"plasma"* ]]; then
        debug "KDE detected"
        if command -v kbuildsycoca5 &> /dev/null; then
            kbuildsycoca5 2>/dev/null || true
        fi
    fi
    
    if command -v xdg-desktop-menu &> /dev/null; then
        debug "Running xdg-desktop-menu forceupdate..."
        xdg-desktop-menu forceupdate 2>/dev/null || true
    fi
    
    echo -e "  ${GREEN}Done${NC}"
}

# Main installation
main() {
    DE=$(detect_de)
    DISTRO=$(detect_distro)
    
    echo -e "Detected: ${BLUE}${DISTRO}${NC} with ${BLUE}${DE}${NC}"
    debug "DE=$DE, DISTRO=$DISTRO"
    echo ""
    
    echo -e "${BLUE}Starting installation...${NC}"
    echo ""
    
    check_requirements
    get_release
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
    
    debug "Removing AppImage..."
    rm -f "${INSTALL_DIR}/${APP_NAME}.AppImage"
    
    debug "Removing desktop entry..."
    rm -f "${APPLICATIONS_DIR}/voidlink.desktop"
    
    debug "Removing icons..."
    rm -f "$HOME/.local/share/icons/hicolor/128x128/apps/voidlink.png"
    rm -f "$HOME/.local/share/icons/hicolor/256x256/apps/voidlink.png"
    
    debug "Refreshing databases..."
    update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
    gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
    
    echo -e "${GREEN}VoidLink has been uninstalled.${NC}"
}

# Parse arguments and run
parse_args "$@"
main
