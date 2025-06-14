// Container commands for Tauri
use tauri::State;
use crate::docker::client::DockerClient;
use crate::docker::containers::*;
use crate::utils::error::{DockerError, DockerResult};

#[tauri::command]
pub async fn connect_docker(client: State<'_, DockerClient>) -> Result<(), DockerError> {
    crate::docker::client::connect_docker(&client).await
}

#[tauri::command]
pub async fn disconnect_docker(client: State<'_, DockerClient>) -> Result<(), DockerError> {
    crate::docker::client::disconnect_docker(&client).await;
    Ok(())
}

#[tauri::command]
pub async fn is_docker_connected(client: State<'_, DockerClient>) -> Result<bool, DockerError> {
    Ok(crate::docker::client::is_connected(&client).await)
}

#[tauri::command]
pub async fn list_containers_cmd(
    client: State<'_, DockerClient>,
    all: bool,
    size: bool,
) -> DockerResult<Vec<ContainerInfo>> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    list_containers(&docker, all, size).await
}

#[tauri::command]
pub async fn get_container_cmd(
    client: State<'_, DockerClient>,
    id: String,
) -> DockerResult<ContainerDetails> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    get_container(&docker, &id).await
}

#[tauri::command]
pub async fn create_container_cmd(
    client: State<'_, DockerClient>,
    request: CreateContainerRequest,
) -> DockerResult<String> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    create_container(&docker, request).await
}

#[tauri::command]
pub async fn start_container_cmd(
    client: State<'_, DockerClient>,
    id: String,
) -> DockerResult<()> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    start_container(&docker, &id).await
}

#[tauri::command]
pub async fn stop_container_cmd(
    client: State<'_, DockerClient>,
    id: String,
    timeout: Option<i64>,
) -> DockerResult<()> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    stop_container(&docker, &id, timeout).await
}

#[tauri::command]
pub async fn restart_container_cmd(
    client: State<'_, DockerClient>,
    id: String,
    timeout: Option<i64>,
) -> DockerResult<()> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    restart_container(&docker, &id, timeout).await
}

#[tauri::command]
pub async fn kill_container_cmd(
    client: State<'_, DockerClient>,
    id: String,
    signal: Option<String>,
) -> DockerResult<()> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    kill_container(&docker, &id, signal).await
}

#[tauri::command]
pub async fn remove_container_cmd(
    client: State<'_, DockerClient>,
    id: String,
    force: bool,
    remove_volumes: bool,
) -> DockerResult<()> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    remove_container(&docker, &id, force, remove_volumes).await
}

#[tauri::command]
pub async fn rename_container_cmd(
    client: State<'_, DockerClient>,
    id: String,
    new_name: String,
) -> DockerResult<()> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    rename_container(&docker, &id, &new_name).await
}

#[tauri::command]
pub async fn get_container_stats_cmd(
    client: State<'_, DockerClient>,
    id: String,
) -> DockerResult<ContainerStats> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    get_container_stats(&docker, &id).await
}

#[tauri::command]
pub async fn get_container_processes_cmd(
    client: State<'_, DockerClient>,
    id: String,
) -> DockerResult<ContainerProcess> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    get_container_processes(&docker, &id).await
}

#[tauri::command]
pub async fn get_container_logs_cmd(
    client: State<'_, DockerClient>,
    id: String,
    follow: bool,
    tail: Option<String>,
    since: Option<String>,
    until: Option<String>,
) -> DockerResult<Vec<ContainerLog>> {
    let docker = crate::docker::client::get_docker_client(&client).await?;
    get_container_logs(&docker, &id, follow, tail, since, until).await
}
