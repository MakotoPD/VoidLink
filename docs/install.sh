#!/bin/bash
#
# VoidLink Installer for Linux
# Auto-detects your distro and installs the best package format
#
# Usage:
#   curl -sSL https://makotopd.github.io/VoidLink/install.sh | bash
#   curl -sSL https://makotopd.github.io/VoidLink/install.sh | bash -s -- --format appimage
#   curl -sSL https://makotopd.github.io/VoidLink/install.sh | bash -s -- --version v0.4.2
#   curl -sSL https://makotopd.github.io/VoidLink/install.sh | bash -s -- --debug
#   curl -sSL https://makotopd.github.io/VoidLink/install.sh | bash -s -- --uninstall
#

set -e

# Default values
VERSION=""
FORMAT=""
DEBUG=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
BOLD='\033[1m'
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
            -f|--format)
                FORMAT="$2"
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
    echo "  -v, --version <tag>      Install specific version (e.g., v0.4.2)"
    echo "  -f, --format <format>    Force package format: deb, rpm, appimage"
    echo "  -d, --debug              Enable debug output"
    echo "  -u, --uninstall          Uninstall VoidLink"
    echo "  --list                   List available versions"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  Install latest (auto-detect): curl -sSL .../install.sh | bash"
    echo "  Force AppImage:               curl -sSL .../install.sh | bash -s -- -f appimage"
    echo "  Force RPM:                    curl -sSL .../install.sh | bash -s -- -f rpm"
    echo "  Specific version:             curl -sSL .../install.sh | bash -s -- -v v0.4.2"
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

# Detect the best package format for this system
detect_format() {
    local distro="$1"

    # Check by distro family
    case "$distro" in
        ubuntu|debian|linuxmint|pop|elementary|zorin|kali|raspbian|neon)
            if command -v dpkg &> /dev/null; then
                echo "deb"
                return
            fi
            ;;
        fedora|nobara|rhel|centos|rocky|alma|opensuse*|suse|mageia)
            if command -v rpm &> /dev/null; then
                echo "rpm"
                return
            fi
            ;;
        arch|manjaro|endeavouros|garuda|artix)
            # Arch-based distros don't have native .deb/.rpm, use AppImage
            echo "appimage"
            return
            ;;
    esac

    # Fallback: check available package managers
    if command -v dpkg &> /dev/null && command -v apt &> /dev/null; then
        echo "deb"
    elif command -v rpm &> /dev/null && (command -v dnf &> /dev/null || command -v yum &> /dev/null || command -v zypper &> /dev/null); then
        echo "rpm"
    else
        echo "appimage"
    fi
}

# Let user choose format interactively
choose_format() {
    local detected="$1"

    echo -e "${CYAN}${BOLD}Package format:${NC}"
    echo ""

    local options=()
    local descriptions=()
    local idx=1
    local default_idx=1

    # Always show all three options
    if command -v dpkg &> /dev/null; then
        options+=("deb")
        descriptions+=(".deb — Native package for Debian/Ubuntu (installs system-wide via dpkg)")
        if [ "$detected" = "deb" ]; then default_idx=$idx; fi
        idx=$((idx + 1))
    fi

    if command -v rpm &> /dev/null; then
        options+=("rpm")
        descriptions+=(".rpm — Native package for Fedora/RHEL/openSUSE (installs system-wide via rpm)")
        if [ "$detected" = "rpm" ]; then default_idx=$idx; fi
        idx=$((idx + 1))
    fi

    options+=("appimage")
    descriptions+=(".AppImage — Universal Linux package (no root needed, runs from ~/.local/bin)")
    if [ "$detected" = "appimage" ]; then default_idx=$idx; fi

    for i in "${!options[@]}"; do
        local num=$((i + 1))
        if [ "$num" -eq "$default_idx" ]; then
            echo -e "  ${GREEN}${BOLD}${num})${NC} ${GREEN}${descriptions[$i]} ${BOLD}(recommended)${NC}"
        else
            echo -e "  ${BOLD}${num})${NC} ${descriptions[$i]}"
        fi
    done

    echo ""

    # When piped (no tty), use detected format automatically
    if [ ! -t 0 ]; then
        debug "No TTY detected (piped input), using auto-detected format: $detected"
        FORMAT="$detected"
        echo -e "  Auto-selected: ${GREEN}${FORMAT}${NC} (no interactive terminal)"
        return
    fi

    read -r -p "  Choose [1-${#options[@]}] (default: ${default_idx}): " choice

    if [ -z "$choice" ]; then
        choice=$default_idx
    fi

    if [ "$choice" -ge 1 ] 2>/dev/null && [ "$choice" -le "${#options[@]}" ] 2>/dev/null; then
        FORMAT="${options[$((choice - 1))]}"
    else
        echo -e "${YELLOW}  Invalid choice, using recommended: ${options[$((default_idx - 1))]}${NC}"
        FORMAT="${options[$((default_idx - 1))]}"
    fi

    echo -e "  Selected: ${GREEN}${FORMAT}${NC}"
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
        echo -e "${BLUE}-> Fetching version ${VERSION}...${NC}"
        debug "API URL: https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${VERSION}"
        RELEASE_INFO=$(curl -sSL "https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${VERSION}")
    else
        echo -e "${BLUE}-> Fetching latest release...${NC}"
        debug "API URL: https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
        RELEASE_INFO=$(curl -sSL "https://api.github.com/repos/${GITHUB_REPO}/releases/latest")
    fi

    debug "Response length: ${#RELEASE_INFO} bytes"

    # Parse version tag
    if command -v jq &> /dev/null; then
        VERSION=$(echo "$RELEASE_INFO" | jq -r '.tag_name')
    else
        VERSION=$(echo "$RELEASE_INFO" | grep -oP '"tag_name":\s*"\K[^"]+' | head -1)
    fi

    debug "VERSION: $VERSION"

    if [ -z "$VERSION" ] || [ "$VERSION" = "null" ]; then
        echo -e "${RED}Error: Could not find release${NC}"
        exit 1
    fi

    # Find download URL based on format
    case "$FORMAT" in
        deb)
            if command -v jq &> /dev/null; then
                DOWNLOAD_URL=$(echo "$RELEASE_INFO" | jq -r '.assets[] | select(.name | endswith(".deb")) | .browser_download_url' | head -1)
            else
                DOWNLOAD_URL=$(echo "$RELEASE_INFO" | grep -oP '"browser_download_url":\s*"\K[^"]+\.deb' | head -1)
            fi
            ;;
        rpm)
            if command -v jq &> /dev/null; then
                DOWNLOAD_URL=$(echo "$RELEASE_INFO" | jq -r '.assets[] | select(.name | endswith(".rpm")) | .browser_download_url' | head -1)
            else
                DOWNLOAD_URL=$(echo "$RELEASE_INFO" | grep -oP '"browser_download_url":\s*"\K[^"]+\.rpm' | head -1)
            fi
            ;;
        appimage)
            if command -v jq &> /dev/null; then
                DOWNLOAD_URL=$(echo "$RELEASE_INFO" | jq -r '.assets[] | select(.name | endswith(".AppImage")) | .browser_download_url' | head -1)
            else
                DOWNLOAD_URL=$(echo "$RELEASE_INFO" | grep -oP '"browser_download_url":\s*"\K[^"]+\.AppImage' | head -1)
            fi
            ;;
    esac

    debug "DOWNLOAD_URL: $DOWNLOAD_URL"

    if [ -z "$DOWNLOAD_URL" ] || [ "$DOWNLOAD_URL" = "null" ]; then
        echo -e "${RED}Error: No ${FORMAT} package found in release ${VERSION}${NC}"
        echo -e "${YELLOW}Try a different format: --format appimage${NC}"
        exit 1
    fi

    echo -e "  Version: ${GREEN}${VERSION}${NC}"
    echo -e "  Format:  ${GREEN}${FORMAT}${NC}"
}

# Create directories (for AppImage installs)
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

# Download and install the package
download_and_install() {
    local tmpdir
    tmpdir=$(mktemp -d)
    local filename
    filename=$(basename "$DOWNLOAD_URL")
    local filepath="${tmpdir}/${filename}"

    echo -e "${BLUE}-> Downloading ${APP_NAME} ${VERSION} (${FORMAT})...${NC}"
    debug "Download URL: $DOWNLOAD_URL"
    debug "Temp file: $filepath"

    if [ "$DEBUG" = true ]; then
        curl -L --progress-bar "$DOWNLOAD_URL" -o "$filepath"
    else
        curl -sSL "$DOWNLOAD_URL" -o "$filepath"
    fi

    local size
    size=$(du -h "$filepath" | cut -f1)
    echo -e "  Downloaded: ${GREEN}${filename} (${size})${NC}"

    case "$FORMAT" in
        deb)
            echo -e "${BLUE}-> Installing .deb package...${NC}"
            if command -v sudo &> /dev/null; then
                sudo dpkg -i "$filepath" || true
                sudo apt-get install -f -y 2>/dev/null || true
            else
                echo -e "${RED}Error: sudo is required to install .deb packages${NC}"
                echo -e "${YELLOW}Run manually: dpkg -i ${filepath}${NC}"
                rm -rf "$tmpdir"
                exit 1
            fi
            INSTALL_LOCATION="/usr/bin/void-link"
            ;;
        rpm)
            echo -e "${BLUE}-> Installing .rpm package...${NC}"
            if command -v sudo &> /dev/null; then
                if command -v dnf &> /dev/null; then
                    sudo dnf install -y "$filepath"
                elif command -v zypper &> /dev/null; then
                    sudo zypper install -y --allow-unsigned-rpm "$filepath"
                else
                    sudo rpm -i --force "$filepath"
                fi
            else
                echo -e "${RED}Error: sudo is required to install .rpm packages${NC}"
                echo -e "${YELLOW}Run manually: rpm -i ${filepath}${NC}"
                rm -rf "$tmpdir"
                exit 1
            fi
            INSTALL_LOCATION="/usr/bin/void-link"
            ;;
        appimage)
            echo -e "${BLUE}-> Installing AppImage...${NC}"
            local target="${INSTALL_DIR}/${APP_NAME}.AppImage"
            rm -f "$target" 2>/dev/null || true
            mv "$filepath" "$target"
            chmod +x "$target"
            INSTALL_LOCATION="$target"
            ;;
    esac

    rm -rf "$tmpdir"
    echo -e "  ${GREEN}Installed successfully${NC}"
}

# Download icons (for AppImage installs)
download_icons() {
    echo -e "${BLUE}-> Downloading icons...${NC}"

    debug "Downloading 128x128 icon..."
    curl -sSL "https://raw.githubusercontent.com/${GITHUB_REPO}/main/src-tauri/icons/128x128.png" \
        -o "$HOME/.local/share/icons/hicolor/128x128/apps/voidlink.png" 2>/dev/null || true

    debug "Downloading 256x256 icon..."
    curl -sSL "https://raw.githubusercontent.com/${GITHUB_REPO}/main/src-tauri/icons/128x128@2x.png" \
        -o "$HOME/.local/share/icons/hicolor/256x256/apps/voidlink.png" 2>/dev/null || true

    echo -e "  ${GREEN}Icons installed${NC}"
}

# Create desktop entry (for AppImage installs)
create_desktop_entry() {
    echo -e "${BLUE}-> Creating desktop entry...${NC}"

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
    echo -e "${BLUE}-> Refreshing desktop database...${NC}"

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

    check_requirements

    # Determine package format
    if [ -z "$FORMAT" ]; then
        local detected
        detected=$(detect_format "$DISTRO")
        debug "Auto-detected format: $detected"
        choose_format "$detected"
    else
        # Validate user-provided format
        case "$FORMAT" in
            deb|rpm|appimage) ;;
            *)
                echo -e "${RED}Unknown format: ${FORMAT}${NC}"
                echo -e "Valid formats: deb, rpm, appimage"
                exit 1
                ;;
        esac
        echo -e "  Format: ${GREEN}${FORMAT}${NC} (user-specified)"
    fi

    echo ""
    echo -e "${BLUE}Starting installation...${NC}"
    echo ""

    get_release

    if [ "$FORMAT" = "appimage" ]; then
        setup_directories
    fi

    download_and_install

    if [ "$FORMAT" = "appimage" ]; then
        download_icons
        create_desktop_entry
        refresh_desktop_database
    fi

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  VoidLink ${VERSION} installed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    case "$FORMAT" in
        deb|rpm)
            echo -e "Installed as system package. Launch from your app menu or run:"
            echo -e "  ${BLUE}void-link${NC}"
            ;;
        appimage)
            echo -e "Installation locations:"
            echo -e "  App:     ${BLUE}${INSTALL_DIR}/${APP_NAME}.AppImage${NC}"
            echo -e "  Desktop: ${BLUE}${APPLICATIONS_DIR}/voidlink.desktop${NC}"
            echo ""
            echo -e "${YELLOW}If you don't see VoidLink in your app menu:${NC}"
            echo -e "  1. Log out and log back in"
            echo -e "  2. Or run: ${BLUE}${INSTALL_DIR}/${APP_NAME}.AppImage${NC}"
            ;;
    esac
    echo ""
}

# Uninstall function
uninstall() {
    echo -e "${YELLOW}Uninstalling VoidLink...${NC}"

    # Check if installed as system package
    if command -v dpkg &> /dev/null && dpkg -l void-link 2>/dev/null | grep -q "^ii"; then
        echo -e "  Removing .deb package..."
        sudo dpkg -r void-link 2>/dev/null || true
    elif command -v rpm &> /dev/null && rpm -q void-link 2>/dev/null; then
        echo -e "  Removing .rpm package..."
        if command -v dnf &> /dev/null; then
            sudo dnf remove -y void-link 2>/dev/null || true
        else
            sudo rpm -e void-link 2>/dev/null || true
        fi
    fi

    # Remove AppImage installation
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
