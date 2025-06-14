use crate::docker::DOCKER_CLIENT;
use crate::utils::{DockerError, Result};
use serde::{Deserialize, Serialize};
use tauri::command;
use bollard::volume::{ListVolumesOptions, RemoveVolumeOptions};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerVolume {
    pub name: String,
    pub driver: String,
    pub mountpoint: String,
    pub created_at: Option<String>,
    pub scope: String,
    pub status: Option<HashMap<String, String>>,
    pub labels: Option<HashMap<String, String>>,
    pub options: Option<HashMap<String, String>>,
    pub usage_data: Option<VolumeUsageData>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VolumeUsageData {
    pub size: Option<i64>,
    pub ref_count: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VolumePruneResponse {
    pub volumes_deleted: Option<Vec<String>>,
    pub space_reclaimed: Option<u64>,
}

#[command]
pub async fn get_volumes() -> Result<Vec<DockerVolume>> {
    let client = DOCKER_CLIENT.get_client().await?;
    
    let options = Some(ListVolumesOptions::<String> {
        ..Default::default()
    });
    
    let volumes_response = client.list_volumes(options).await
        .map_err(|e| DockerError::OperationFailed { message: format!("Failed to list volumes: {}", e) })?;
    
    let mut result = Vec::new();
    
    if let Some(volumes) = volumes_response.volumes {
        for volume in volumes {
            let usage_data = volume.usage_data.map(|data| VolumeUsageData {
                size: Some(data.size),
                ref_count: Some(data.ref_count),
            });
            
            result.push(DockerVolume {
                name: volume.name,
                driver: volume.driver,
                mountpoint: volume.mountpoint,
                created_at: volume.created_at,
                scope: volume.scope.map(|s| s.to_string()).unwrap_or_default(),
                status: volume.status.map(|s| s.into_iter().map(|(k, _)| (k, String::new())).collect()),
                labels: Some(volume.labels),
                options: Some(volume.options),
                usage_data,
            });
        }
    }
    
    Ok(result)
}

#[command]
pub async fn get_volume_details(name: String) -> Result<DockerVolume> {
    let client = DOCKER_CLIENT.get_client().await?;
    
    let volume = client.inspect_volume(&name).await
        .map_err(|e| DockerError::OperationFailed { message: format!("Failed to inspect volume: {}", e) })?;
    
    let usage_data = volume.usage_data.map(|data| VolumeUsageData {
        size: Some(data.size),
        ref_count: Some(data.ref_count),
    });
    
    Ok(DockerVolume {
        name: volume.name,
        driver: volume.driver,
        mountpoint: volume.mountpoint,
        created_at: volume.created_at,
        scope: volume.scope.map(|s| s.to_string()).unwrap_or_default(),
        status: volume.status.map(|s| s.into_iter().map(|(k, _)| (k, String::new())).collect()),
        labels: Some(volume.labels),
        options: Some(volume.options),
        usage_data,
    })
}

#[command]
pub async fn remove_volume_cmd(name: String, force: Option<bool>) -> Result<()> {
    let client = DOCKER_CLIENT.get_client().await?;
    
    let options = RemoveVolumeOptions {
        force: force.unwrap_or(false),
    };
    
    client.remove_volume(&name, Some(options)).await
        .map_err(|e| DockerError::OperationFailed { message: format!("Failed to remove volume: {}", e) })?;
    
    Ok(())
}

#[command]
pub async fn prune_volumes_cmd() -> Result<VolumePruneResponse> {
    let client = DOCKER_CLIENT.get_client().await?;
    
    let response = client.prune_volumes(None::<bollard::volume::PruneVolumesOptions<String>>).await
        .map_err(|e| DockerError::OperationFailed { message: format!("Failed to prune volumes: {}", e) })?;
    
    Ok(VolumePruneResponse {
        volumes_deleted: response.volumes_deleted,
        space_reclaimed: response.space_reclaimed.map(|v| v as u64),
    })
}
