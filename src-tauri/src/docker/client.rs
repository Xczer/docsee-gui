// Docker client module for Tauri backend
use bollard::Docker;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::utils::error::DockerError;

pub type DockerClient = Arc<RwLock<Option<Docker>>>;

pub fn create_docker_client() -> DockerClient {
    Arc::new(RwLock::new(None))
}

pub async fn connect_docker(client: &DockerClient) -> Result<(), DockerError> {
    let docker = Docker::connect_with_socket_defaults()
        .map_err(|e| DockerError::ConnectionError(e.to_string()))?;
    
    // Test the connection
    docker.ping().await
        .map_err(|e| DockerError::ConnectionError(e.to_string()))?;
    
    let mut client_guard = client.write().await;
    *client_guard = Some(docker);
    
    Ok(())
}

pub async fn disconnect_docker(client: &DockerClient) {
    let mut client_guard = client.write().await;
    *client_guard = None;
}

pub async fn get_docker_client(client: &DockerClient) -> Result<Docker, DockerError> {
    let client_guard = client.read().await;
    match client_guard.as_ref() {
        Some(docker) => Ok(docker.clone()),
        None => Err(DockerError::NotConnected),
    }
}

pub async fn is_connected(client: &DockerClient) -> bool {
    let client_guard = client.read().await;
    client_guard.is_some()
}

pub async fn reconnect_docker(client: &DockerClient) -> Result<(), DockerError> {
    disconnect_docker(client).await;
    connect_docker(client).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_docker_client_creation() {
        let client = create_docker_client();
        assert!(!is_connected(&client).await);
    }

    #[tokio::test]
    async fn test_docker_connection() {
        let client = create_docker_client();
        
        // This test will only pass if Docker is running
        match connect_docker(&client).await {
            Ok(_) => {
                assert!(is_connected(&client).await);
                disconnect_docker(&client).await;
                assert!(!is_connected(&client).await);
            }
            Err(DockerError::ConnectionError(_)) => {
                // Docker is not running, which is fine for testing
                assert!(!is_connected(&client).await);
            }
            Err(e) => panic!("Unexpected error: {:?}", e),
        }
    }
}
