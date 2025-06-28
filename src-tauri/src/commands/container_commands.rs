use crate::docker::{
    exec_container, get_container_logs, get_container_stats, inspect_container, kill_container,
    list_containers, remove_container, restart_container, start_container, stop_container,
    ContainerDetails, ContainerListItem, ContainerLogLine, ContainerStatsData,
};
use crate::utils::Result;

#[tauri::command]
pub async fn get_containers(all: bool) -> Result<Vec<ContainerListItem>> {
    list_containers(all).await
}

#[tauri::command]
pub async fn get_container_details(id: String) -> Result<ContainerDetails> {
    inspect_container(&id).await
}

#[tauri::command]
pub async fn start_container_cmd(id: String) -> Result<()> {
    start_container(&id).await
}

#[tauri::command]
pub async fn stop_container_cmd(id: String, timeout: Option<i64>) -> Result<()> {
    stop_container(&id, timeout).await
}

#[tauri::command]
pub async fn restart_container_cmd(id: String, timeout: Option<i64>) -> Result<()> {
    restart_container(&id, timeout).await
}

#[tauri::command]
pub async fn remove_container_cmd(id: String, force: bool, remove_volumes: bool) -> Result<()> {
    remove_container(&id, force, remove_volumes).await
}

#[tauri::command]
pub async fn kill_container_cmd(id: String, signal: Option<String>) -> Result<()> {
    kill_container(&id, signal.as_deref()).await
}

#[tauri::command]
pub async fn get_container_stats_cmd(id: String) -> Result<ContainerStatsData> {
    get_container_stats(&id).await
}

#[tauri::command]
pub async fn get_container_logs_cmd(
    id: String,
    follow: Option<bool>,
    tail: Option<String>,
    since: Option<String>,
    until: Option<String>,
) -> Result<Vec<ContainerLogLine>> {
    get_container_logs(&id, follow.unwrap_or(false), tail, since, until).await
}

#[tauri::command]
pub async fn exec_container_cmd(
    id: String,
    cmd: Vec<String>,
    interactive: Option<bool>,
    tty: Option<bool>,
) -> Result<String> {
    exec_container(&id, cmd, interactive.unwrap_or(true), tty.unwrap_or(true)).await
}
