use bollard::Docker;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::utils::{DockerError, Result, log_docker_connection};
use tracing::{info, warn, error};

pub struct DockerClient {
    client: Arc<Mutex<Option<Docker>>>,
}

impl DockerClient {
    pub fn new() -> Self {
        Self {
            client: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn connect(&self) -> Result<bool> {
        info!("Attempting to connect to Docker daemon...");
        let mut client_guard = self.client.lock().await;
        
        // Try different connection methods with detailed logging
        let docker_result = self.try_connect_methods().await;
        
        match docker_result {
            Ok(docker) => {
                info!("Docker client created, testing connection...");
                // Test the connection by getting version
                match docker.version().await {
                    Ok(version) => {
                        info!("Docker connection successful! Version: {:?}", version.version);
                        *client_guard = Some(docker);
                        log_docker_connection(true, None);
                        Ok(true)
                    }
                    Err(e) => {
                        error!("Docker version check failed: {}", e);
                        log_docker_connection(false, Some(&e.to_string()));
                        Err(DockerError::Connection(e))
                    }
                }
            }
            Err(e) => {
                error!("Failed to create Docker client: {}", e);
                log_docker_connection(false, Some(&e.to_string()));
                Err(e)
            }
        }
    }

    async fn try_connect_methods(&self) -> Result<Docker> {
        info!("Trying various Docker connection methods...");
        
        // Method 1: Unix socket (most common on Linux/macOS)
        #[cfg(unix)]
        {
            info!("Trying Unix socket connection...");
            match Docker::connect_with_socket_defaults() {
                Ok(docker) => {
                    info!("Unix socket connection successful");
                    return Ok(docker);
                }
                Err(e) => {
                    warn!("Unix socket connection failed: {}", e);
                }
            }
        }

        // Method 2: Local defaults (tries multiple methods)
        info!("Trying local defaults connection...");
        match Docker::connect_with_local_defaults() {
            Ok(docker) => {
                info!("Local defaults connection successful");
                return Ok(docker);
            }
            Err(e) => {
                warn!("Local defaults connection failed: {}", e);
            }
        }

        // Method 3: HTTP connection
        info!("Trying HTTP connection...");
        match Docker::connect_with_http_defaults() {
            Ok(docker) => {
                info!("HTTP connection successful");
                return Ok(docker);
            }
            Err(e) => {
                warn!("HTTP connection failed: {}", e);
            }
        }

        // Method 4: Try explicit socket path
        #[cfg(unix)]
        {
            let socket_paths = [
                "/var/run/docker.sock",
                "/run/docker.sock",
                "/run/user/1000/docker.sock", // rootless Docker
            ];

            for socket_path in &socket_paths {
                info!("Trying explicit socket path: {}", socket_path);
                match Docker::connect_with_socket(socket_path, 120, bollard::API_DEFAULT_VERSION) {
                    Ok(docker) => {
                        info!("Explicit socket connection successful: {}", socket_path);
                        return Ok(docker);
                    }
                    Err(e) => {
                        warn!("Explicit socket connection failed for {}: {}", socket_path, e);
                    }
                }
            }
        }

        // Method 5: Try TCP connections (for Docker Machine, remote Docker, etc.)
        let tcp_addresses = [
            "tcp://localhost:2375",
            "tcp://localhost:2376",
            "tcp://127.0.0.1:2375",
            "tcp://127.0.0.1:2376",
        ];

        for tcp_addr in &tcp_addresses {
            info!("Trying TCP connection: {}", tcp_addr);
            match Docker::connect_with_http(tcp_addr, 120, bollard::API_DEFAULT_VERSION) {
                Ok(docker) => {
                    info!("TCP connection successful: {}", tcp_addr);
                    return Ok(docker);
                }
                Err(e) => {
                    warn!("TCP connection failed for {}: {}", tcp_addr, e);
                }
            }
        }

        error!("All Docker connection methods failed");
        Err(DockerError::DaemonNotAvailable)
    }

    pub async fn disconnect(&self) {
        info!("Disconnecting from Docker daemon...");
        let mut client_guard = self.client.lock().await;
        *client_guard = None;
        info!("Docker client disconnected");
    }

    pub async fn is_connected(&self) -> bool {
        let client_guard = self.client.lock().await;
        client_guard.is_some()
    }

    pub async fn get_client(&self) -> Result<Docker> {
        let client_guard = self.client.lock().await;
        match client_guard.as_ref() {
            Some(client) => Ok(client.clone()),
            None => {
                warn!("Docker client not connected");
                Err(DockerError::DaemonNotAvailable)
            }
        }
    }

    pub async fn test_connection(&self) -> Result<bool> {
        match self.get_client().await {
            Ok(client) => {
                info!("Testing Docker connection...");
                match client.version().await {
                    Ok(version) => {
                        info!("Docker connection test successful. Version: {:?}", version.version);
                        Ok(true)
                    }
                    Err(e) => {
                        warn!("Docker connection test failed: {}", e);
                        // Connection lost, clear it
                        self.disconnect().await;
                        Err(DockerError::Connection(e))
                    }
                }
            }
            Err(_) => {
                info!("Docker client not connected");
                Ok(false)
            }
        }
    }
}

impl Default for DockerClient {
    fn default() -> Self {
        Self::new()
    }
}

// Global Docker client instance
lazy_static::lazy_static! {
    pub static ref DOCKER_CLIENT: DockerClient = DockerClient::new();
}
