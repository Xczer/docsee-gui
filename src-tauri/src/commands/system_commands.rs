use crate::docker::{
    get_connection_status, get_docker_system_info, get_docker_stats, DOCKER_CLIENT,
    DockerConnectionStatus, DockerSystemInfo, DockerStats,
};
use crate::utils::Result;

#[tauri::command]
pub async fn connect_docker() -> Result<bool> {
    DOCKER_CLIENT.connect().await
}

#[tauri::command]
pub async fn disconnect_docker() -> Result<()> {
    DOCKER_CLIENT.disconnect().await;
    Ok(())
}

#[tauri::command]
pub async fn get_docker_connection_status() -> DockerConnectionStatus {
    get_connection_status().await
}

#[tauri::command]
pub async fn get_system_info() -> Result<DockerSystemInfo> {
    get_docker_system_info().await
}

#[tauri::command]
pub async fn get_system_stats() -> Result<DockerStats> {
    get_docker_stats().await
}

#[tauri::command]
pub async fn test_docker_connection() -> Result<bool> {
    DOCKER_CLIENT.test_connection().await
}
