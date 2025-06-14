// Container operations module
use bollard::container::{
    Config, CreateContainerOptions, ListContainersOptions, 
    RemoveContainerOptions, StartContainerOptions, StopContainerOptions,
    LogsOptions, StatsOptions, InspectContainerOptions, TopOptions,
    RenameContainerOptions, RestartContainerOptions, KillContainerOptions
};
use bollard::models::{ContainerSummary, ContainerInspectResponse};
use bollard::Docker;
use futures_util::stream::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::utils::error::{DockerError, DockerResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct ContainerInfo {
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
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContainerPort {
    pub ip: Option<String>,
    pub private_port: u16,
    pub public_port: Option<u16>,
    pub port_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
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
    pub graph_driver: serde_json::Value,
    pub size_rw: Option<i64>,
    pub size_root_fs: Option<i64>,
    pub mounts: Vec<serde_json::Value>,
    pub config: serde_json::Value,
    pub network_settings: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
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
    pub health: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContainerStats {
    pub read: String,
    pub preread: String,
    pub pids_stats: Option<serde_json::Value>,
    pub blkio_stats: serde_json::Value,
    pub num_procs: u32,
    pub storage_stats: Option<serde_json::Value>,
    pub cpu_stats: serde_json::Value,
    pub precpu_stats: serde_json::Value,
    pub memory_stats: serde_json::Value,
    pub name: String,
    pub id: String,
    pub networks: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContainerProcess {
    pub titles: Vec<String>,
    pub processes: Vec<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContainerLog {
    pub timestamp: String,
    pub stream: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateContainerRequest {
    pub name: Option<String>,
    pub image: String,
    pub cmd: Option<Vec<String>>,
    pub env: Option<Vec<String>>,
    pub working_dir: Option<String>,
    pub exposed_ports: Option<HashMap<String, serde_json::Value>>,
    pub host_config: Option<serde_json::Value>,
    pub networking_config: Option<serde_json::Value>,
    pub labels: Option<HashMap<String, String>>,
}

pub async fn list_containers(
    docker: &Docker, 
    all: bool, 
    size: bool
) -> DockerResult<Vec<ContainerInfo>> {
    let options = Some(ListContainersOptions::<String> {
        all,
        size,
        ..Default::default()
    });

    let containers = docker.list_containers(options).await?;
    
    let result = containers
        .into_iter()
        .map(|container| map_container_summary(container))
        .collect();
    
    Ok(result)
}

pub async fn get_container(
    docker: &Docker, 
    id: &str
) -> DockerResult<ContainerDetails> {
    let options = Some(InspectContainerOptions { size: true });
    
    let container = docker.inspect_container(id, options).await?;
    
    Ok(map_container_inspect(container))
}

pub async fn create_container(
    docker: &Docker,
    request: CreateContainerRequest,
) -> DockerResult<String> {
    let config = Config {
        image: Some(request.image),
        cmd: request.cmd,
        env: request.env,
        working_dir: request.working_dir,
        exposed_ports: request.exposed_ports.map(|ports| {
            ports.into_iter().map(|(k, _)| (k, HashMap::new())).collect()
        }),
        labels: request.labels,
        ..Default::default()
    };

    let options = CreateContainerOptions {
        name: request.name.as_deref().unwrap_or(""),
        platform: None,
    };

    let response = docker.create_container(Some(options), config).await?;
    
    Ok(response.id)
}

pub async fn start_container(docker: &Docker, id: &str) -> DockerResult<()> {
    docker.start_container(id, None::<StartContainerOptions<String>>).await?;
    Ok(())
}

pub async fn stop_container(docker: &Docker, id: &str, timeout: Option<i64>) -> DockerResult<()> {
    let options = StopContainerOptions { t: timeout.unwrap_or(10) };
    docker.stop_container(id, Some(options)).await?;
    Ok(())
}

pub async fn restart_container(docker: &Docker, id: &str, timeout: Option<i64>) -> DockerResult<()> {
    let options = RestartContainerOptions { t: timeout.unwrap_or(10) as isize };
    docker.restart_container(id, Some(options)).await?;
    Ok(())
}

pub async fn kill_container(docker: &Docker, id: &str, signal: Option<String>) -> DockerResult<()> {
    let options = KillContainerOptions {
        signal: signal.as_deref().unwrap_or("SIGKILL"),
    };
    docker.kill_container(id, Some(options)).await?;
    Ok(())
}

pub async fn remove_container(
    docker: &Docker, 
    id: &str, 
    force: bool, 
    remove_volumes: bool
) -> DockerResult<()> {
    let options = RemoveContainerOptions {
        force,
        v: remove_volumes,
        ..Default::default()
    };
    
    docker.remove_container(id, Some(options)).await?;
    Ok(())
}

pub async fn rename_container(docker: &Docker, id: &str, new_name: &str) -> DockerResult<()> {
    let options = RenameContainerOptions { name: new_name };
    docker.rename_container(id, options).await?;
    Ok(())
}

pub async fn get_container_stats(docker: &Docker, id: &str) -> DockerResult<ContainerStats> {
    let options = StatsOptions {
        stream: false,
        one_shot: true,
    };

    let mut stream = docker.stats(id, Some(options));
    
    if let Some(result) = stream.next().await {
        let stats = result?;
        return Ok(map_container_stats(stats, id));
    }
    
    Err(DockerError::operation_failed("Failed to get container stats"))
}

pub async fn get_container_processes(docker: &Docker, id: &str) -> DockerResult<ContainerProcess> {
    let options = TopOptions { ps_args: "aux" };
    let response = docker.top_processes(id, Some(options)).await?;
    
    Ok(ContainerProcess {
        titles: response.titles.unwrap_or_default(),
        processes: response.processes.unwrap_or_default(),
    })
}

pub async fn get_container_logs(
    docker: &Docker, 
    id: &str, 
    follow: bool,
    tail: Option<String>,
    since: Option<String>,
    until: Option<String>,
) -> DockerResult<Vec<ContainerLog>> {
    let options = LogsOptions {
        follow,
        stdout: true,
        stderr: true,
        timestamps: true,
        tail: tail.unwrap_or_else(|| "100".to_string()),
        since: since.unwrap_or_default().parse().unwrap_or(0),
        until: until.unwrap_or_default().parse().unwrap_or(0),
        ..Default::default()
    };

    let mut stream = docker.logs(id, Some(options));
    let mut logs = Vec::new();

    while let Some(result) = stream.next().await {
        let log_output = result?;
        let log = ContainerLog {
            timestamp: chrono::Utc::now().to_rfc3339(),
            stream: "stdout".to_string(), // This could be enhanced to detect stderr
            content: log_output.to_string(),
        };
        logs.push(log);
        
        if !follow && logs.len() >= 1000 { // Limit for non-streaming
            break;
        }
    }

    Ok(logs)
}

// Helper functions to map Docker API responses to our types
fn map_container_summary(container: ContainerSummary) -> ContainerInfo {
    ContainerInfo {
        id: container.id.unwrap_or_default(),
        names: container.names.unwrap_or_default(),
        image: container.image.unwrap_or_default(),
        image_id: container.image_id.unwrap_or_default(),
        command: container.command.unwrap_or_default(),
        created: container.created.unwrap_or(0),
        state: container.state.unwrap_or_default(),
        status: container.status.unwrap_or_default(),
        ports: container.ports.unwrap_or_default()
            .into_iter()
            .map(|port| ContainerPort {
                ip: port.ip,
                private_port: port.private_port,
                public_port: port.public_port,
                port_type: format!("{:?}", port.typ.unwrap_or(bollard::models::PortTypeEnum::EMPTY)),
            })
            .collect(),
        labels: container.labels.unwrap_or_default(),
        size_rw: container.size_rw,
        size_root_fs: container.size_root_fs,
    }
}

fn map_container_inspect(inspect: ContainerInspectResponse) -> ContainerDetails {
    let state = inspect.state.map(|s| ContainerState {
        status: format!("{:?}", s.status.unwrap_or(bollard::models::ContainerStateStatusEnum::EMPTY)),
        running: s.running.unwrap_or(false),
        paused: s.paused.unwrap_or(false),
        restarting: s.restarting.unwrap_or(false),
        oom_killed: s.oom_killed.unwrap_or(false),
        dead: s.dead.unwrap_or(false),
        pid: s.pid.unwrap_or(0),
        exit_code: s.exit_code.unwrap_or(0),
        error: s.error.unwrap_or_default(),
        started_at: s.started_at.unwrap_or_default(),
        finished_at: s.finished_at.unwrap_or_default(),
        health: s.health.map(|h| serde_json::to_value(h).unwrap_or_default()),
    }).unwrap_or_else(|| ContainerState {
        status: "unknown".to_string(),
        running: false,
        paused: false,
        restarting: false,
        oom_killed: false,
        dead: false,
        pid: 0,
        exit_code: 0,
        error: String::new(),
        started_at: String::new(),
        finished_at: String::new(),
        health: None,
    });

    ContainerDetails {
        id: inspect.id.unwrap_or_default(),
        created: inspect.created.unwrap_or_default(),
        path: inspect.path.unwrap_or_default(),
        args: inspect.args.unwrap_or_default(),
        state,
        image: inspect.image.unwrap_or_default(),
        name: inspect.name.unwrap_or_default(),
        restart_count: inspect.restart_count.unwrap_or(0),
        driver: inspect.driver.unwrap_or_default(),
        platform: inspect.platform.unwrap_or_default(),
        mount_label: inspect.mount_label.unwrap_or_default(),
        process_label: inspect.process_label.unwrap_or_default(),
        app_armor_profile: inspect.app_armor_profile.unwrap_or_default(),
        exec_ids: inspect.exec_ids,
        host_config: serde_json::to_value(inspect.host_config).unwrap_or_default(),
        graph_driver: serde_json::to_value(inspect.graph_driver).unwrap_or_default(),
        size_rw: inspect.size_rw,
        size_root_fs: inspect.size_root_fs,
        mounts: inspect.mounts.map(|mounts| 
            mounts.into_iter()
                .map(|mount| serde_json::to_value(mount).unwrap_or_default())
                .collect()
        ).unwrap_or_default(),
        config: serde_json::to_value(inspect.config).unwrap_or_default(),
        network_settings: serde_json::to_value(inspect.network_settings).unwrap_or_default(),
    }
}

fn map_container_stats(stats: bollard::container::Stats, id: &str) -> ContainerStats {
    ContainerStats {
        read: stats.read,
        preread: stats.preread,
        pids_stats: stats.pids_stats.map(|p| serde_json::to_value(&p).unwrap_or_default()),
        blkio_stats: serde_json::to_value(stats.blkio_stats).unwrap_or_default(),
        num_procs: stats.num_procs,
        storage_stats: stats.storage_stats.map(|s| serde_json::to_value(&s).unwrap_or_default()),
        cpu_stats: serde_json::to_value(stats.cpu_stats).unwrap_or_default(),
        precpu_stats: serde_json::to_value(stats.precpu_stats).unwrap_or_default(),
        memory_stats: serde_json::to_value(stats.memory_stats).unwrap_or_default(),
        name: stats.name,
        id: id.to_string(),
        networks: stats.networks.unwrap_or_default()
            .into_iter()
            .map(|(k, v)| (k, serde_json::to_value(v).unwrap_or_default()))
            .collect(),
    }
}
