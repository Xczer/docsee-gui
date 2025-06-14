use bollard::Docker;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::utils::{DockerError, Result, log_docker_connection};

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
        let mut client_guard = self.client.lock().await;
        
        // Try different connection methods
        let docker_result = self.try_connect_methods().await;
        
        match docker_result {
            Ok(docker) => {
                // Test the connection by getting version
                match docker.version().await {
                    Ok(_) => {
                        *client_guard = Some(docker);
                        log_docker_connection(true, None);
                        Ok(true)
                    }
                    Err(e) => {
                        log_docker_connection(false, Some(&e.to_string()));
                        Err(DockerError::Connection(e))
                    }
                }
            }
            Err(e) => {
                log_docker_connection(false, Some(&e.to_string()));
                Err(e)
            }
        }
    }

    async fn try_connect_methods(&self) -> Result<Docker> {
        // Try socket connection first (most common)
        #[cfg(unix)]
        {
            if let Ok(docker) = Docker::connect_with_socket_defaults() {
                return Ok(docker);
            }
        }

        // Try local defaults
        if let Ok(docker) = Docker::connect_with_local_defaults() {
            return Ok(docker);
        }

        // Try HTTP connection
        if let Ok(docker) = Docker::connect_with_http_defaults() {
            return Ok(docker);
        }

        // Try SSL if available (commented out as ssl feature not enabled)
        // if let Ok(docker) = Docker::connect_with_ssl_defaults() {
        //     return Ok(docker);
        // }

        Err(DockerError::DaemonNotAvailable)
    }

    pub async fn disconnect(&self) {
        let mut client_guard = self.client.lock().await;
        *client_guard = None;
    }

    pub async fn is_connected(&self) -> bool {
        let client_guard = self.client.lock().await;
        client_guard.is_some()
    }

    pub async fn get_client(&self) -> Result<Docker> {
        let client_guard = self.client.lock().await;
        match client_guard.as_ref() {
            Some(client) => Ok(client.clone()),
            None => Err(DockerError::DaemonNotAvailable),
        }
    }

    pub async fn test_connection(&self) -> Result<bool> {
        match self.get_client().await {
            Ok(client) => {
                match client.version().await {
                    Ok(_) => Ok(true),
                    Err(e) => {
                        // Connection lost, clear it
                        self.disconnect().await;
                        Err(DockerError::Connection(e))
                    }
                }
            }
            Err(_) => Ok(false),
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
