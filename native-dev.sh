#!/bin/bash

# Native Development Script for DocSee-GUI
# This script manages NATIVE development (not containerized runtime)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[DocSee Native]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[DocSee Native]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[DocSee Native]${NC} $1"
}

print_error() {
    echo -e "${RED}[DocSee Native]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking development dependencies..."
    
    local missing_deps=()
    
    # Check for Node.js/Bun
    if ! command -v bun &> /dev/null; then
        missing_deps+=("bun")
    fi
    
    # Check for Rust
    if ! command -v cargo &> /dev/null; then
        missing_deps+=("rust")
    fi
    
    # Check for Tauri CLI
    if ! command -v cargo-tauri &> /dev/null; then
        missing_deps+=("tauri-cli")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_warning "Missing dependencies: ${missing_deps[*]}"
        print_status "Would you like to install them using our containerized setup? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            setup_tools_from_container
        else
            print_error "Please install missing dependencies manually:"
            echo "  - Bun: curl -fsSL https://bun.sh/install | bash"
            echo "  - Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
            echo "  - Tauri CLI: cargo install tauri-cli"
            exit 1
        fi
    else
        print_success "All dependencies are installed!"
    fi
}

# Setup development tools using container (one-time)
setup_tools_from_container() {
    print_status "Setting up development tools from container..."
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is required for development tools setup"
        exit 1
    fi
    
    # Build the dev-tools container
    docker-compose --profile dev-setup build dev-tools
    
    print_success "Development tools container ready!"
    print_status "Run the tools installation commands on your host system"
}

# Development commands
case "$1" in
    "check")
        check_dependencies
        ;;
        
    "install")
        print_status "Installing project dependencies..."
        bun install
        print_success "Dependencies installed!"
        ;;
        
    "dev" | "start")
        print_status "Starting native development server..."
        check_dependencies
        
        # Check if dependencies are installed
        if [ ! -d "node_modules" ]; then
            print_status "Installing dependencies first..."
            bun install
        fi
        
        print_success "Starting Tauri development server..."
        print_status "Your app will open as a native window"
        print_status "Frontend dev server: http://localhost:1420"
        
        # This runs NATIVELY on your host - no container!
        bun run tauri dev
        ;;
        
    "build")
        print_status "Building DocSee-GUI natively..."
        check_dependencies
        
        # Native build for your current platform
        bun run build
        bun run tauri build
        
        print_success "Native build completed!"
        print_status "Artifacts in: src-tauri/target/release/bundle/"
        ;;
        
    "build-container")
        print_status "Building DocSee-GUI using container..."
        
        if ! docker info > /dev/null 2>&1; then
            print_error "Docker is required for containerized builds"
            exit 1
        fi
        
        # Use container for build (useful for CI/CD or different platforms)
        docker-compose --profile build up docsee-build
        
        if [ $? -eq 0 ]; then
            print_success "Container build completed!"
            print_status "Artifacts in: src-tauri/target/release/bundle/"
        else
            print_error "Container build failed"
            exit 1
        fi
        ;;
        
    "test")
        print_status "Running tests..."
        # Add your test commands here
        bun run check
        print_success "Tests completed!"
        ;;
        
    "lint")
        print_status "Running linter..."
        bunx biome check .
        ;;
        
    "format")
        print_status "Formatting code..."
        bunx biome format --write .
        print_success "Code formatted!"
        ;;
        
    "clean")
        print_status "Cleaning build artifacts..."
        rm -rf build/
        rm -rf .svelte-kit/
        rm -rf src-tauri/target/
        rm -rf node_modules/
        print_success "Clean completed!"
        ;;
        
    "docker-clean")
        print_status "Cleaning Docker build cache..."
        docker-compose down --volumes
        docker image prune -f
        print_success "Docker cleanup completed!"
        ;;
        
    "setup-host")
        print_status "Setting up host development environment..."
        
        print_status "Installing Bun..."
        curl -fsSL https://bun.sh/install | bash
        
        print_status "Please install Rust manually:"
        echo "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
        echo "source ~/.cargo/env"
        echo "cargo install tauri-cli"
        ;;
        
    *)
        echo "DocSee-GUI Native Development"
        echo ""
        echo "This script manages NATIVE development (app runs on host, not in container)"
        echo ""
        echo "Usage: $0 {command}"
        echo ""
        echo "Development Commands:"
        echo "  check           - Check if all dependencies are installed"
        echo "  install         - Install Node.js dependencies"
        echo "  dev|start       - Start native development (recommended)"
        echo "  build           - Build natively for current platform"
        echo "  build-container - Build using container (for CI/CD)"
        echo "  test            - Run tests"
        echo "  lint            - Run linter"
        echo "  format          - Format code"
        echo ""
        echo "Setup Commands:"
        echo "  setup-host      - Install development tools on host"
        echo "  clean           - Clean build artifacts"
        echo "  docker-clean    - Clean Docker cache"
        echo ""
        echo "Examples:"
        echo "  $0 check        # Check dependencies"
        echo "  $0 dev          # Start development (NATIVE)"
        echo "  $0 build        # Build for current platform"
        echo ""
        echo "Key Points:"
        echo "  • App runs NATIVELY on your host (not in container)"
        echo "  • Docker is only used for building/CI/CD"
        echo "  • Direct access to Docker daemon on host"
        echo "  • Better performance and simpler setup"
        echo ""
        exit 1
        ;;
esac