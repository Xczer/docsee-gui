use crate::docker::{
    get_connection_status, get_docker_system_info, get_docker_stats, DOCKER_CLIENT,
    DockerConnectionStatus, DockerSystemInfo, DockerStats,
};
use crate::utils::Result;
use tracing::{info, warn, error};

#[tauri::command]
pub async fn connect_docker() -> Result<bool> {
    info!("Frontend requested Docker connection...");
    let result = DOCKER_CLIENT.connect().await;
    match &result {
        Ok(true) => info!("Docker connection command successful"),
        Ok(false) => warn!("Docker connection command returned false"),
        Err(e) => error!("Docker connection command failed: {}", e),
    }
    result
}

#[tauri::command]
pub async fn disconnect_docker() -> Result<()> {
    info!("Frontend requested Docker disconnection...");
    DOCKER_CLIENT.disconnect().await;
    Ok(())
}

#[tauri::command]
pub async fn get_docker_connection_status() -> DockerConnectionStatus {
    info!("Frontend requested connection status...");
    let status = get_connection_status().await;
    info!("Connection status: connected={}, error={:?}", status.connected, status.error);
    status
}

#[tauri::command]
pub async fn get_system_info() -> Result<DockerSystemInfo> {
    info!("Frontend requested system info...");
    get_docker_system_info().await
}

#[tauri::command]
pub async fn get_system_stats() -> Result<DockerStats> {
    info!("Frontend requested system stats...");
    get_docker_stats().await
}

#[tauri::command]
pub async fn test_docker_connection() -> Result<bool> {
    info!("Frontend requested connection test...");
    let result = DOCKER_CLIENT.test_connection().await;
    match &result {
        Ok(true) => info!("Connection test successful"),
        Ok(false) => info!("Connection test failed - not connected"),
        Err(e) => error!("Connection test error: {}", e),
    }
    result
}
