use bollard::container::{
    ListContainersOptions, InspectContainerOptions, StartContainerOptions,
    StopContainerOptions, RestartContainerOptions, RemoveContainerOptions,
    KillContainerOptions, StatsOptions,
};
use bollard::models::{ContainerSummary, ContainerInspectResponse};
use bollard::container::Stats;
use futures_util::stream::TryStreamExt;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use crate::docker::client::DOCKER_CLIENT;
use crate::utils::{DockerError, Result, log_docker_operation};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerListItem {
    pub id: String,
    pub names: Vec<String>,
    pub image: String,
    pub image_id: String,
    pub command: String,
    pub created: i64,
    pub state: String,
    pub status: String,
    pub ports: Vec<ContainerPort>,
    pub labels: HashMap<String, String>,
    pub size_rw: Option<i64>,
    pub size_root_fs: Option<i64>,
    pub host_config: ContainerHostConfig,
    pub network_settings: ContainerNetworkSettings,
    pub mounts: Vec<ContainerMount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerPort {
    pub ip: Option<String>,
    pub private_port: u16,
    pub public_port: Option<u16>,
    pub r#type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerHostConfig {
    pub network_mode: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerNetworkSettings {
    pub networks: HashMap<String, ContainerNetwork>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerNetwork {
    pub network_id: String,
    pub endpoint_id: String,
    pub gateway: String,
    pub ip_address: String,
    pub ip_prefix_len: i64,
    pub ipv6_gateway: String,
    pub global_ipv6_address: String,
    pub global_ipv6_prefix_len: i64,
    pub mac_address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerMount {
    pub r#type: String,
    pub name: Option<String>,
    pub source: String,
    pub destination: String,
    pub driver: Option<String>,
    pub mode: String,
    pub rw: bool,
    pub propagation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerDetails {
    pub id: String,
    pub created: String,
    pub path: String,
    pub args: Vec<String>,
    pub state: ContainerState,
    pub image: String,
    pub name: String,
    pub restart_count: i64,
    pub driver: String,
    pub platform: String,
    pub mount_label: String,
    pub process_label: String,
    pub app_armor_profile: String,
    pub exec_ids: Option<Vec<String>>,
    pub host_config: serde_json::Value,
    pub graph_driver: GraphDriver,
    pub size_rw: Option<i64>,
    pub size_root_fs: Option<i64>,
    pub mounts: Vec<ContainerMount>,
    pub config: serde_json::Value,
    pub network_settings: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerState {
    pub status: String,
    pub running: bool,
    pub paused: bool,
    pub restarting: bool,
    pub oom_killed: bool,
    pub dead: bool,
    pub pid: i64,
    pub exit_code: i64,
    pub error: String,
    pub started_at: String,
    pub finished_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphDriver {
    pub name: String,
    pub data: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerStatsData {
    pub id: String,
    pub name: String,
    pub read: String,
    pub preread: String,
    pub pids_stats: Option<serde_json::Value>,
    pub blkio_stats: Option<serde_json::Value>,
    pub num_procs: u32,
    pub storage_stats: Option<serde_json::Value>,
    pub cpu_stats: Option<serde_json::Value>,
    pub precpu_stats: Option<serde_json::Value>,
    pub memory_stats: Option<serde_json::Value>,
    pub networks: Option<HashMap<String, serde_json::Value>>,
}

pub async fn list_containers(all: bool) -> Result<Vec<ContainerListItem>> {
    let client = DOCKER_CLIENT.get_client().await?;

    let options = Some(ListContainersOptions::<String> {
        all,
        ..Default::default()
    });

    match client.list_containers(options).await {
        Ok(containers) => {
            let result: Vec<ContainerListItem> = containers
                .into_iter()
                .map(|container| convert_container_summary(container))
                .collect();

            log_docker_operation("list_containers", true, Some(&format!("Found {} containers", result.len())));
            Ok(result)
        }
        Err(e) => {
            log_docker_operation("list_containers", false, Some(&e.to_string()));
            Err(DockerError::Connection(e))
        }
    }
}

pub async fn inspect_container(id: &str) -> Result<ContainerDetails> {
    let client = DOCKER_CLIENT.get_client().await?;

    let options = Some(InspectContainerOptions {
        size: true,
    });

    match client.inspect_container(id, options).await {
        Ok(container) => {
            let result = convert_container_inspect(container);
            log_docker_operation("inspect_container", true, Some(&format!("Inspected container {}", id)));
            Ok(result)
        }
        Err(e) => {
            log_docker_operation("inspect_container", false, Some(&e.to_string()));
            if e.to_string().contains("404") {
                Err(DockerError::ContainerNotFound { id: id.to_string() })
            } else {
                Err(DockerError::Connection(e))
            }
        }
    }
}

pub async fn start_container(id: &str) -> Result<()> {
    let client = DOCKER_CLIENT.get_client().await?;

    match client.start_container(id, None::<StartContainerOptions<String>>).await {
        Ok(_) => {
            log_docker_operation("start_container", true, Some(&format!("Started container {}", id)));
            Ok(())
        }
        Err(e) => {
            log_docker_operation("start_container", false, Some(&e.to_string()));
            if e.to_string().contains("404") {
                Err(DockerError::ContainerNotFound { id: id.to_string() })
            } else {
                Err(DockerError::Connection(e))
            }
        }
    }
}

pub async fn stop_container(id: &str, timeout: Option<i64>) -> Result<()> {
    let client = DOCKER_CLIENT.get_client().await?;

    let options = StopContainerOptions {
        t: timeout.unwrap_or(10),  // Remove the `as isize` conversion
    };

    match client.stop_container(id, Some(options)).await {
        Ok(_) => {
            log_docker_operation("stop_container", true, Some(&format!("Stopped container {}", id)));
            Ok(())
        }
        Err(e) => {
            log_docker_operation("stop_container", false, Some(&e.to_string()));
            if e.to_string().contains("404") {
                Err(DockerError::ContainerNotFound { id: id.to_string() })
            } else {
                Err(DockerError::Connection(e))
            }
        }
    }
}

pub async fn restart_container(id: &str, timeout: Option<i64>) -> Result<()> {
    let client = DOCKER_CLIENT.get_client().await?;

    let options = RestartContainerOptions {
        t: timeout.unwrap_or(10) as isize,  // Remove the `as isize` conversion here too
    };

    match client.restart_container(id, Some(options)).await {
        Ok(_) => {
            log_docker_operation("restart_container", true, Some(&format!("Restarted container {}", id)));
            Ok(())
        }
        Err(e) => {
            log_docker_operation("restart_container", false, Some(&e.to_string()));
            if e.to_string().contains("404") {
                Err(DockerError::ContainerNotFound { id: id.to_string() })
            } else {
                Err(DockerError::Connection(e))
            }
        }
    }
}

pub async fn remove_container(id: &str, force: bool, remove_volumes: bool) -> Result<()> {
    let client = DOCKER_CLIENT.get_client().await?;

    let options = Some(RemoveContainerOptions {
        force,
        v: remove_volumes,
        ..Default::default()
    });

    match client.remove_container(id, options).await {
        Ok(_) => {
            log_docker_operation("remove_container", true, Some(&format!("Removed container {}", id)));
            Ok(())
        }
        Err(e) => {
            log_docker_operation("remove_container", false, Some(&e.to_string()));
            if e.to_string().contains("404") {
                Err(DockerError::ContainerNotFound { id: id.to_string() })
            } else {
                Err(DockerError::Connection(e))
            }
        }
    }
}

pub async fn kill_container(id: &str, signal: Option<&str>) -> Result<()> {
    let client = DOCKER_CLIENT.get_client().await?;

    let options = Some(KillContainerOptions {
        signal: signal.unwrap_or("SIGKILL"),
    });

    match client.kill_container(id, options).await {
        Ok(_) => {
            log_docker_operation("kill_container", true, Some(&format!("Killed container {}", id)));
            Ok(())
        }
        Err(e) => {
            log_docker_operation("kill_container", false, Some(&e.to_string()));
            if e.to_string().contains("404") {
                Err(DockerError::ContainerNotFound { id: id.to_string() })
            } else {
                Err(DockerError::Connection(e))
            }
        }
    }
}

pub async fn get_container_stats(id: &str) -> Result<ContainerStatsData> {
    let client = DOCKER_CLIENT.get_client().await?;

    let options = Some(StatsOptions {
        stream: false,
        one_shot: true,
    });

    match client.stats(id, options).try_collect::<Vec<_>>().await {
        Ok(mut stats) => {
            if let Some(stat) = stats.pop() {
                let result = convert_container_stats(stat);
                log_docker_operation("get_container_stats", true, Some(&format!("Retrieved stats for container {}", id)));
                Ok(result)
            } else {
                Err(DockerError::OperationFailed {
                    message: "No stats data received".to_string(),
                })
            }
        }
        Err(e) => {
            log_docker_operation("get_container_stats", false, Some(&e.to_string()));
            if e.to_string().contains("404") {
                Err(DockerError::ContainerNotFound { id: id.to_string() })
            } else {
                Err(DockerError::Connection(e))
            }
        }
    }
}

// Helper functions to convert from bollard types to our types
fn convert_container_summary(container: ContainerSummary) -> ContainerListItem {
    ContainerListItem {
        id: container.id.unwrap_or_default(),
        names: container.names.unwrap_or_default(),
        image: container.image.unwrap_or_default(),
        image_id: container.image_id.unwrap_or_default(),
        command: container.command.unwrap_or_default(),
        created: container.created.unwrap_or_default(),
        state: container.state.unwrap_or_default(),
        status: container.status.unwrap_or_default(),
        ports: container.ports.unwrap_or_default().into_iter().map(|p| ContainerPort {
            ip: p.ip,
            private_port: p.private_port,
            public_port: p.public_port,
            r#type: p.typ.as_ref().map(|t| t.to_string()).unwrap_or_default(),
        }).collect(),
        labels: container.labels.unwrap_or_default(),
        size_rw: container.size_rw,
        size_root_fs: container.size_root_fs,
        host_config: ContainerHostConfig {
            network_mode: container.host_config
                .and_then(|hc| hc.network_mode)
                .unwrap_or_default(),
        },
        network_settings: ContainerNetworkSettings {
            networks: container.network_settings
                .and_then(|ns| ns.networks)
                .unwrap_or_default()
                .into_iter()
                .map(|(k, v)| (k, ContainerNetwork {
                    network_id: v.network_id.unwrap_or_default(),
                    endpoint_id: v.endpoint_id.unwrap_or_default(),
                    gateway: v.gateway.unwrap_or_default(),
                    ip_address: v.ip_address.unwrap_or_default(),
                    ip_prefix_len: v.ip_prefix_len.unwrap_or_default(),
                    ipv6_gateway: v.ipv6_gateway.unwrap_or_default(),
                    global_ipv6_address: v.global_ipv6_address.unwrap_or_default(),
                    global_ipv6_prefix_len: v.global_ipv6_prefix_len.unwrap_or_default(),
                    mac_address: v.mac_address.unwrap_or_default(),
                }))
                .collect(),
        },
        mounts: container.mounts.unwrap_or_default().into_iter().map(|m| ContainerMount {
            r#type: m.typ.as_ref().map(|t| t.to_string()).unwrap_or_default(),
            name: m.name,
            source: m.source.unwrap_or_default(),
            destination: m.destination.unwrap_or_default(),
            driver: m.driver,
            mode: m.mode.unwrap_or_default(),
            rw: m.rw.unwrap_or_default(),
            propagation: m.propagation.unwrap_or_default(),
        }).collect(),
    }
}

fn convert_container_inspect(container: ContainerInspectResponse) -> ContainerDetails {
    ContainerDetails {
        id: container.id.unwrap_or_default(),
        created: container.created.unwrap_or_default(),
        path: container.path.unwrap_or_default(),
        args: container.args.unwrap_or_default(),
        state: ContainerState {
            status: container.state.as_ref().and_then(|s| s.status.as_ref()).map(|s| s.to_string()).unwrap_or_default(),
            running: container.state.as_ref().and_then(|s| s.running).unwrap_or_default(),
            paused: container.state.as_ref().and_then(|s| s.paused).unwrap_or_default(),
            restarting: container.state.as_ref().and_then(|s| s.restarting).unwrap_or_default(),
            oom_killed: container.state.as_ref().and_then(|s| s.oom_killed).unwrap_or_default(),
            dead: container.state.as_ref().and_then(|s| s.dead).unwrap_or_default(),
            pid: container.state.as_ref().and_then(|s| s.pid).unwrap_or_default(),
            exit_code: container.state.as_ref().and_then(|s| s.exit_code).unwrap_or_default(),
            error: container.state.as_ref().and_then(|s| s.error.clone()).unwrap_or_default(),
            started_at: container.state.as_ref().and_then(|s| s.started_at.clone()).unwrap_or_default(),
            finished_at: container.state.as_ref().and_then(|s| s.finished_at.clone()).unwrap_or_default(),
        },
        image: container.image.unwrap_or_default(),
        name: container.name.unwrap_or_default(),
        restart_count: container.restart_count.unwrap_or_default(),
        driver: container.driver.unwrap_or_default(),
        platform: container.platform.unwrap_or_default(),
        mount_label: container.mount_label.unwrap_or_default(),
        process_label: container.process_label.unwrap_or_default(),
        app_armor_profile: container.app_armor_profile.unwrap_or_default(),
        exec_ids: container.exec_ids,
        host_config: serde_json::to_value(&container.host_config).unwrap_or_default(),
        graph_driver: GraphDriver {
            name: container.graph_driver.as_ref().and_then(|gd| Some(gd.name.clone())).unwrap_or_default(),
            data: container.graph_driver.as_ref().map(|gd| gd.data.clone()).unwrap_or_default(),
        },
        size_rw: container.size_rw,
        size_root_fs: container.size_root_fs,
        mounts: container.mounts.unwrap_or_default().into_iter().map(|m| ContainerMount {
            r#type: m.typ.as_ref().map(|t| t.to_string()).unwrap_or_default(),
            name: m.name,
            source: m.source.unwrap_or_default(),
            destination: m.destination.unwrap_or_default(),
            driver: m.driver,
            mode: m.mode.unwrap_or_default(),
            rw: m.rw.unwrap_or_default(),
            propagation: m.propagation.unwrap_or_default(),
        }).collect(),
        config: serde_json::to_value(&container.config).unwrap_or_default(),
        network_settings: serde_json::to_value(&container.network_settings).unwrap_or_default(),
    }
}

fn convert_container_stats(stats: Stats) -> ContainerStatsData {
    ContainerStatsData {
        id: stats.id,
        name: stats.name,
        read: stats.read,
        preread: stats.preread,
        pids_stats: Some(serde_json::to_value(&stats.pids_stats).unwrap_or_default()),
        blkio_stats: Some(serde_json::to_value(&stats.blkio_stats).unwrap_or_default()),
        num_procs: stats.num_procs,
        storage_stats: Some(serde_json::to_value(&stats.storage_stats).unwrap_or_default()),
        cpu_stats: Some(serde_json::to_value(&stats.cpu_stats).unwrap_or_default()),
        precpu_stats: Some(serde_json::to_value(&stats.precpu_stats).unwrap_or_default()),
        memory_stats: Some(serde_json::to_value(&stats.memory_stats).unwrap_or_default()),
        networks: stats.networks.map(|networks| {
            networks.into_iter()
                .map(|(k, v)| (k, serde_json::to_value(v).unwrap_or_default()))
                .collect()
        }),
    }
}
