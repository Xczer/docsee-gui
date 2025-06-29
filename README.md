# DocSee GUI - Modern Docker Management

A fast, intuitive Docker management application built with Tauri v2 and SvelteKit for native desktop performance.

![DocSee GUI](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Release%20Candidate-orange)

## ✨ Features

### 🐳 **Complete Docker Management**
- **Containers**: Full lifecycle management with real-time logs, statistics, and shell access
- **Images**: Pull from registries, manage layers, and cleanup unused images
- **Volumes**: Track usage, manage mounts, and reclaim disk space
- **Networks**: Visualize topology, manage connectivity, and configure drivers

### 🎨 **Modern User Experience**
- **Native Performance**: Desktop app with < 2s startup and < 100MB memory usage
- **Dark Mode**: Complete theme system with light/dark/auto modes
- **Responsive Design**: Works perfectly on any screen size
- **Real-time Updates**: Live monitoring with configurable refresh intervals

### 🚀 **Advanced Features**
- **Interactive Shell**: Built-in terminal access to containers
- **Log Streaming**: Real-time log viewing with search and filtering
- **Resource Monitoring**: Live CPU, memory, network, and disk I/O statistics
- **Bulk Operations**: Multi-select actions for efficient management
- **Smart Search**: Advanced filtering across all Docker resources

## 🛠️ Tech Stack

- **Frontend**: SvelteKit + Svelte 5 + TypeScript + TailwindCSS v4
- **Backend**: Rust + Tauri v2 + Bollard (Docker API)
- **UI Components**: shadcn-svelte design system
- **Cross-platform**: Native builds for Linux, macOS, and Windows

## 📦 Installation

### Download Pre-built Binaries

Visit our [Releases](../../releases) page to download the latest version:

- **Linux**: AppImage (portable), DEB (Debian/Ubuntu), RPM (Fedora/RHEL)
- **macOS**: DMG installer (Intel and Apple Silicon)
- **Windows**: MSI installer and portable NSIS

### Build from Source

#### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed and running
- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) 18+ and [Bun](https://bun.sh/)

#### Development Setup
```bash
# Clone the repository
git clone https://github.com/your-username/docsee-gui.git
cd docsee-gui

# Install dependencies
bun install

# Run in development mode
bun tauri dev

# Build for production
bun tauri build
```

## 🚀 Usage

### Getting Started
1. **Launch DocSee GUI** from your applications menu or command line
2. **Docker Detection**: The app automatically detects your Docker daemon
3. **Explore**: Navigate through containers, images, volumes, and networks
4. **Manage**: Use the intuitive interface to perform Docker operations

### Key Operations

#### Container Management
- **Start/Stop/Restart**: Click the action buttons or use bulk operations
- **View Logs**: Real-time log streaming with search capabilities
- **Monitor Resources**: Live CPU, memory, and network statistics
- **Shell Access**: Interactive terminal directly in the app

#### Image Operations
- **Pull Images**: Download from Docker Hub or private registries
- **Cleanup**: Remove unused images and reclaim disk space
- **Inspect**: View layer information and image details

#### Volume & Network Management
- **Track Usage**: See which containers use which volumes
- **Cleanup**: Remove unused volumes and networks safely
- **Monitor**: View mount points and network topology

## 🔧 Configuration

### Docker Connection
DocSee GUI automatically detects Docker in standard locations:
- Linux: `/var/run/docker.sock`
- macOS: `~/.docker/run/docker.sock`
- Windows: `//./pipe/docker_engine`

### Settings
Access preferences through the settings page:
- Theme selection (light/dark/auto)
- Auto-refresh intervals
- Resource monitoring options

## 🎯 Roadmap

### Current Status: Release Candidate
- ✅ Complete Docker resource management
- ✅ Modern UI with dark mode support
- ✅ Real-time monitoring and logs
- ✅ Cross-platform releases
- ⏳ Settings page (final feature for v1.0)

### Future Versions
- **v2.0**: Docker Compose support, image building
- **v3.0**: Multi-host management, advanced monitoring

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines
- Use TypeScript with strict typing
- Follow Svelte 5 patterns (runes over legacy reactivity)
- Ensure Rust code follows standard conventions
- Test across different Docker environments

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tauri Team](https://tauri.app/) - Excellent desktop app framework
- [Bollard](https://github.com/fussybeaver/bollard) - Comprehensive Docker API for Rust
- [SvelteKit](https://kit.svelte.dev/) - Modern web development framework
- [shadcn-svelte](https://www.shadcn-svelte.com/) - Beautiful UI components

## 📞 Support

- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Documentation**: [Project Wiki](../../wiki)

---

**DocSee GUI** - Making Docker management fast, intuitive, and enjoyable! 🐳✨
