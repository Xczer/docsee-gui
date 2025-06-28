# Build-only Dockerfile for DocSee-GUI
# This container is ONLY for building, not running the application

FROM node:20-bullseye AS builder

# Install system dependencies for building Tauri
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    file \
    build-essential \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libwebkit2gtk-4.0-dev \
    libxdo-dev \
    libxrandr-dev \
    libdbus-1-dev \
    pkg-config \
    libasound2-dev \
    libpango1.0-dev \
    libatk1.0-dev \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    rpm \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Install Tauri CLI
RUN cargo install tauri-cli --version "^2.0"

WORKDIR /workspace

# Copy source code
COPY . .

# Install dependencies
RUN bun install

# Build the frontend
RUN bun run build

# Build Tauri application for Linux
RUN cargo tauri build

# Output stage - just the built artifacts
FROM scratch AS artifacts
COPY --from=builder /workspace/src-tauri/target/release/bundle /artifacts

# Development dependencies stage for local development
FROM node:20-bullseye AS dev-deps

# Install only the essential development tools
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Rust for local development
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Install Tauri CLI
RUN cargo install tauri-cli --version "^2.0"

WORKDIR /workspace

# This stage is for extracting tools to host system
CMD ["echo", "Use this container to extract development tools"]