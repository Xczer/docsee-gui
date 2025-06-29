use crate::docker::DOCKER_CLIENT;
use crate::utils::{DockerError, Result};
use bollard::network::ListNetworksOptions;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerNetwork {
    pub id: String,
    pub name: String,
    pub driver: String,
    pub scope: String,
    pub created: Option<String>,
    pub ipam: Option<NetworkIPAM>,
    pub containers: Option<HashMap<String, NetworkContainer>>,
    pub options: Option<HashMap<String, String>>,
    pub labels: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkIPAM {
    pub driver: Option<String>,
    pub config: Option<Vec<NetworkIPAMConfig>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkIPAMConfig {
    pub subnet: Option<String>,
    pub gateway: Option<String>,
    pub ip_range: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkContainer {
    pub name: Option<String>,
    pub endpoint_id: Option<String>,
    pub mac_address: Option<String>,
    pub ipv4_address: Option<String>,
    pub ipv6_address: Option<String>,
}

#[command]
pub async fn get_networks() -> Result<Vec<DockerNetwork>> {
    let client = DOCKER_CLIENT.get_client().await?;

    let options = Some(ListNetworksOptions::<String> {
        ..Default::default()
    });

    let networks =
        client
            .list_networks(options)
            .await
            .map_err(|e| DockerError::OperationFailed {
                message: format!("Failed to list networks: {e}"),
            })?;

    let mut result = Vec::new();

    for network in networks {
        let ipam = network.ipam.map(|ipam| NetworkIPAM {
            driver: ipam.driver,
            config: ipam.config.map(|configs| {
                configs
                    .into_iter()
                    .map(|config| NetworkIPAMConfig {
                        subnet: config.subnet,
                        gateway: config.gateway,
                        ip_range: config.ip_range,
                    })
                    .collect()
            }),
        });

        let containers = network.containers.map(|containers| {
            containers
                .into_iter()
                .map(|(id, container)| {
                    (
                        id,
                        NetworkContainer {
                            name: container.name,
                            endpoint_id: container.endpoint_id,
                            mac_address: container.mac_address,
                            ipv4_address: container.ipv4_address,
                            ipv6_address: container.ipv6_address,
                        },
                    )
                })
                .collect()
        });

        result.push(DockerNetwork {
            id: network.id.unwrap_or_default(),
            name: network.name.unwrap_or_default(),
            driver: network.driver.unwrap_or_default(),
            scope: network.scope.unwrap_or_default(),
            created: network.created,
            ipam,
            containers,
            options: network.options,
            labels: network.labels,
        });
    }

    Ok(result)
}

#[command]
pub async fn get_network_details(id: String) -> Result<DockerNetwork> {
    let client = DOCKER_CLIENT.get_client().await?;

    let network = client
        .inspect_network(&id, None::<bollard::network::InspectNetworkOptions<String>>)
        .await
        .map_err(|e| DockerError::OperationFailed {
            message: format!("Failed to inspect network: {e}"),
        })?;

    let ipam = network.ipam.map(|ipam| NetworkIPAM {
        driver: ipam.driver,
        config: ipam.config.map(|configs| {
            configs
                .into_iter()
                .map(|config| NetworkIPAMConfig {
                    subnet: config.subnet,
                    gateway: config.gateway,
                    ip_range: config.ip_range,
                })
                .collect()
        }),
    });

    let containers = network.containers.map(|containers| {
        containers
            .into_iter()
            .map(|(id, container)| {
                (
                    id,
                    NetworkContainer {
                        name: container.name,
                        endpoint_id: container.endpoint_id,
                        mac_address: container.mac_address,
                        ipv4_address: container.ipv4_address,
                        ipv6_address: container.ipv6_address,
                    },
                )
            })
            .collect()
    });

    Ok(DockerNetwork {
        id: network.id.unwrap_or_default(),
        name: network.name.unwrap_or_default(),
        driver: network.driver.unwrap_or_default(),
        scope: network.scope.unwrap_or_default(),
        created: network.created,
        ipam,
        containers,
        options: network.options,
        labels: network.labels,
    })
}

#[command]
pub async fn remove_network_cmd(id: String) -> Result<()> {
    let client = DOCKER_CLIENT.get_client().await?;

    client
        .remove_network(&id)
        .await
        .map_err(|e| DockerError::OperationFailed {
            message: format!("Failed to remove network: {e}"),
        })?;

    Ok(())
}

#[command]
pub async fn prune_networks_cmd() -> Result<()> {
    let client = DOCKER_CLIENT.get_client().await?;

    client
        .prune_networks(None::<bollard::network::PruneNetworksOptions<String>>)
        .await
        .map_err(|e| DockerError::OperationFailed {
            message: format!("Failed to prune networks: {e}"),
        })?;

    Ok(())
}
