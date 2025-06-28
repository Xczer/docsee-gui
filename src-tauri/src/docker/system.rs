use crate::docker::client::DOCKER_CLIENT;
use crate::utils::{log_docker_operation, DockerError, Result};
use bollard::models::SystemInfo as BollardSystemInfo;
use bollard::system::Version;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerVersion {
    pub version: String,
    pub api_version: String,
    pub git_commit: String,
    pub go_version: String,
    pub os: String,
    pub arch: String,
    pub kernel_version: String,
    pub build_time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerInfo {
    pub id: String,
    pub containers: i64,
    pub containers_running: i64,
    pub containers_paused: i64,
    pub containers_stopped: i64,
    pub images: i64,
    pub driver: String,
    pub driver_status: Vec<Vec<String>>,
    pub system_status: Option<Vec<Vec<String>>>,
    pub plugins: DockerPlugins,
    pub memory_limit: bool,
    pub swap_limit: bool,
    pub kernel_memory: bool,
    pub cpu_cfs_period: bool,
    pub cpu_cfs_quota: bool,
    pub cpu_shares: bool,
    pub cpu_set: bool,
    pub pids_limit: bool,
    pub ipv4_forwarding: bool,
    pub bridge_nf_iptables: bool,
    pub bridge_nf_ip6tables: bool,
    pub debug: bool,
    pub nfd: i64,
    pub oom_kill_disable: bool,
    pub ngoroutines: i64,
    pub system_time: String,
    pub logging_driver: String,
    pub cgroup_driver: String,
    pub nevents_listener: i64,
    pub kernel_version: String,
    pub operating_system: String,
    pub os_type: String,
    pub architecture: String,
    pub ncpu: i64,
    pub mem_total: i64,
    pub docker_root_dir: String,
    pub http_proxy: String,
    pub https_proxy: String,
    pub no_proxy: String,
    pub name: String,
    pub labels: Vec<String>,
    pub experimental_build: bool,
    pub server_version: String,
    pub cluster_store: String,
    pub cluster_advertise: String,
    pub runtimes: HashMap<String, DockerRuntime>,
    pub default_runtime: String,
    pub swarm: DockerSwarm,
    pub live_restore_enabled: bool,
    pub isolation: String,
    pub init_binary: String,
    pub containerd_commit: DockerCommit,
    pub runc_commit: DockerCommit,
    pub init_commit: DockerCommit,
    pub security_options: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerPlugins {
    pub volume: Vec<String>,
    pub network: Vec<String>,
    pub authorization: Option<Vec<String>>,
    pub log: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerRuntime {
    pub path: String,
    pub runtime_args: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerSwarm {
    pub node_id: String,
    pub node_addr: String,
    pub local_node_state: String,
    pub control_available: bool,
    pub error: String,
    pub remote_managers: Vec<DockerSwarmManager>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerSwarmManager {
    pub node_id: String,
    pub addr: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerCommit {
    pub id: String,
    pub expected: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerSystemInfo {
    pub version: DockerVersion,
    pub info: DockerInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerConnectionStatus {
    pub connected: bool,
    pub error: Option<String>,
    pub version: Option<String>,
    pub api_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerStats {
    pub containers_total: i64,
    pub containers_running: i64,
    pub containers_stopped: i64,
    pub containers_paused: i64,
    pub images_total: i64,
    pub volumes_total: i64,
    pub networks_total: i64,
}

pub async fn get_docker_version() -> Result<DockerVersion> {
    let client = DOCKER_CLIENT.get_client().await?;

    match client.version().await {
        Ok(version) => {
            let result = convert_version(version);
            log_docker_operation(
                "get_docker_version",
                true,
                Some(&format!("Docker version: {}", result.version)),
            );
            Ok(result)
        }
        Err(e) => {
            log_docker_operation("get_docker_version", false, Some(&e.to_string()));
            Err(DockerError::Connection(e))
        }
    }
}

pub async fn get_docker_info() -> Result<DockerInfo> {
    let client = DOCKER_CLIENT.get_client().await?;

    match client.info().await {
        Ok(info) => {
            let result = convert_info(info);
            log_docker_operation(
                "get_docker_info",
                true,
                Some(&format!(
                    "Docker info retrieved for {} containers",
                    result.containers
                )),
            );
            Ok(result)
        }
        Err(e) => {
            log_docker_operation("get_docker_info", false, Some(&e.to_string()));
            Err(DockerError::Connection(e))
        }
    }
}

pub async fn get_docker_system_info() -> Result<DockerSystemInfo> {
    let version = get_docker_version().await?;
    let info = get_docker_info().await?;

    Ok(DockerSystemInfo { version, info })
}

pub async fn get_connection_status() -> DockerConnectionStatus {
    match DOCKER_CLIENT.test_connection().await {
        Ok(true) => {
            if let Ok(version) = get_docker_version().await {
                DockerConnectionStatus {
                    connected: true,
                    error: None,
                    version: Some(version.version),
                    api_version: Some(version.api_version),
                }
            } else {
                DockerConnectionStatus {
                    connected: true,
                    error: None,
                    version: None,
                    api_version: None,
                }
            }
        }
        Ok(false) => DockerConnectionStatus {
            connected: false,
            error: Some("Docker daemon not connected".to_string()),
            version: None,
            api_version: None,
        },
        Err(e) => DockerConnectionStatus {
            connected: false,
            error: Some(e.to_string()),
            version: None,
            api_version: None,
        },
    }
}

pub async fn get_docker_stats() -> Result<DockerStats> {
    let info = get_docker_info().await?;

    // Calculate volumes and networks count (simplified for now)
    // In a real implementation, you'd call list_volumes and list_networks
    Ok(DockerStats {
        containers_total: info.containers,
        containers_running: info.containers_running,
        containers_stopped: info.containers_stopped,
        containers_paused: info.containers_paused,
        images_total: info.images,
        volumes_total: 0,  // TODO: Implement volumes count
        networks_total: 0, // TODO: Implement networks count
    })
}

fn convert_version(version: Version) -> DockerVersion {
    DockerVersion {
        version: version.version.unwrap_or_default(),
        api_version: version.api_version.unwrap_or_default(),
        git_commit: version.git_commit.unwrap_or_default(),
        go_version: version.go_version.unwrap_or_default(),
        os: version.os.unwrap_or_default(),
        arch: version.arch.unwrap_or_default(),
        kernel_version: version.kernel_version.unwrap_or_default(),
        build_time: version.build_time.unwrap_or_default(),
    }
}

fn convert_info(info: BollardSystemInfo) -> DockerInfo {
    DockerInfo {
        id: info.id.unwrap_or_default(),
        containers: info.containers.unwrap_or_default(),
        containers_running: info.containers_running.unwrap_or_default(),
        containers_paused: info.containers_paused.unwrap_or_default(),
        containers_stopped: info.containers_stopped.unwrap_or_default(),
        images: info.images.unwrap_or_default(),
        driver: info.driver.unwrap_or_default(),
        driver_status: info.driver_status.unwrap_or_default(),
        system_status: None, // Field removed in newer API
        plugins: DockerPlugins {
            volume: info
                .plugins
                .as_ref()
                .and_then(|p| p.volume.clone())
                .unwrap_or_default(),
            network: info
                .plugins
                .as_ref()
                .and_then(|p| p.network.clone())
                .unwrap_or_default(),
            authorization: info.plugins.as_ref().and_then(|p| p.authorization.clone()),
            log: info
                .plugins
                .as_ref()
                .and_then(|p| p.log.clone())
                .unwrap_or_default(),
        },
        memory_limit: info.memory_limit.unwrap_or_default(),
        swap_limit: info.swap_limit.unwrap_or_default(),
        kernel_memory: false, // Field removed
        cpu_cfs_period: info.cpu_cfs_period.unwrap_or_default(),
        cpu_cfs_quota: info.cpu_cfs_quota.unwrap_or_default(),
        cpu_shares: info.cpu_shares.unwrap_or_default(),
        cpu_set: info.cpu_set.unwrap_or_default(),
        pids_limit: info.pids_limit.unwrap_or_default(),
        ipv4_forwarding: info.ipv4_forwarding.unwrap_or_default(),
        bridge_nf_iptables: info.bridge_nf_iptables.unwrap_or_default(),
        bridge_nf_ip6tables: info.bridge_nf_ip6tables.unwrap_or_default(),
        debug: info.debug.unwrap_or_default(),
        nfd: info.nfd.unwrap_or_default(),
        oom_kill_disable: info.oom_kill_disable.unwrap_or_default(),
        ngoroutines: info.n_goroutines.unwrap_or_default(),
        system_time: info.system_time.unwrap_or_default(),
        logging_driver: info.logging_driver.unwrap_or_default(),
        cgroup_driver: info
            .cgroup_driver
            .as_ref()
            .map(|cd| cd.to_string())
            .unwrap_or_default(),
        nevents_listener: info.n_events_listener.unwrap_or_default(),
        kernel_version: info.kernel_version.unwrap_or_default(),
        operating_system: info.operating_system.unwrap_or_default(),
        os_type: info.os_type.unwrap_or_default(),
        architecture: info.architecture.unwrap_or_default(),
        ncpu: info.ncpu.unwrap_or_default(),
        mem_total: info.mem_total.unwrap_or_default(),
        docker_root_dir: info.docker_root_dir.unwrap_or_default(),
        http_proxy: info.http_proxy.unwrap_or_default(),
        https_proxy: info.https_proxy.unwrap_or_default(),
        no_proxy: info.no_proxy.unwrap_or_default(),
        name: info.name.unwrap_or_default(),
        labels: info.labels.unwrap_or_default(),
        experimental_build: info.experimental_build.unwrap_or_default(),
        server_version: info.server_version.unwrap_or_default(),
        cluster_store: "".to_string(),     // Field removed
        cluster_advertise: "".to_string(), // Field removed
        runtimes: info
            .runtimes
            .unwrap_or_default()
            .into_iter()
            .map(|(k, v)| {
                (
                    k,
                    DockerRuntime {
                        path: v.path.unwrap_or_default(),
                        runtime_args: v.runtime_args,
                    },
                )
            })
            .collect(),
        default_runtime: info.default_runtime.unwrap_or_default(),
        swarm: DockerSwarm {
            node_id: info
                .swarm
                .as_ref()
                .and_then(|s| s.node_id.clone())
                .unwrap_or_default(),
            node_addr: info
                .swarm
                .as_ref()
                .and_then(|s| s.node_addr.clone())
                .unwrap_or_default(),
            local_node_state: info
                .swarm
                .as_ref()
                .and_then(|s| s.local_node_state.as_ref())
                .map(|s| s.to_string())
                .unwrap_or_default(),
            control_available: info
                .swarm
                .as_ref()
                .and_then(|s| s.control_available)
                .unwrap_or_default(),
            error: info
                .swarm
                .as_ref()
                .and_then(|s| s.error.clone())
                .unwrap_or_default(),
            remote_managers: info
                .swarm
                .as_ref()
                .and_then(|s| s.remote_managers.as_ref())
                .unwrap_or(&vec![])
                .iter()
                .map(|rm| DockerSwarmManager {
                    node_id: rm.node_id.clone().unwrap_or_default(),
                    addr: rm.addr.clone().unwrap_or_default(),
                })
                .collect(),
        },
        live_restore_enabled: info.live_restore_enabled.unwrap_or_default(),
        isolation: info
            .isolation
            .as_ref()
            .map(|i| i.to_string())
            .unwrap_or_default(),
        init_binary: info.init_binary.unwrap_or_default(),
        containerd_commit: DockerCommit {
            id: info
                .containerd_commit
                .as_ref()
                .and_then(|c| c.id.clone())
                .unwrap_or_default(),
            expected: info
                .containerd_commit
                .as_ref()
                .and_then(|c| c.expected.clone())
                .unwrap_or_default(),
        },
        runc_commit: DockerCommit {
            id: info
                .runc_commit
                .as_ref()
                .and_then(|c| c.id.clone())
                .unwrap_or_default(),
            expected: info
                .runc_commit
                .as_ref()
                .and_then(|c| c.expected.clone())
                .unwrap_or_default(),
        },
        init_commit: DockerCommit {
            id: info
                .init_commit
                .as_ref()
                .and_then(|c| c.id.clone())
                .unwrap_or_default(),
            expected: info
                .init_commit
                .as_ref()
                .and_then(|c| c.expected.clone())
                .unwrap_or_default(),
        },
        security_options: info.security_options.unwrap_or_default(),
    }
}
