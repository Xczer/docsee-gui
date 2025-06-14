use bollard::image::{ListImagesOptions, RemoveImageOptions};
use bollard::models::{ImageSummary as BollardImageSummary, ImageInspect as BollardImageInspect};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use crate::docker::client::DOCKER_CLIENT;
use crate::utils::{DockerError, Result, log_docker_operation};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageListItem {
    pub id: String,
    pub parent_id: String,
    pub repo_tags: Vec<String>,
    pub repo_digests: Vec<String>,
    pub created: i64,
    pub size: i64,
    pub virtual_size: i64,
    pub shared_size: i64,
    pub labels: HashMap<String, String>,
    pub containers: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageDetails {
    pub id: String,
    pub repo_tags: Vec<String>,
    pub repo_digests: Vec<String>,
    pub parent: String,
    pub comment: String,
    pub created: String,
    pub container: String,
    pub container_config: serde_json::Value,
    pub docker_version: String,
    pub author: String,
    pub config: serde_json::Value,
    pub architecture: String,
    pub os: String,
    pub size: i64,
    pub virtual_size: i64,
    pub graph_driver: GraphDriver,
    pub root_fs: RootFs,
    pub metadata: ImageMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphDriver {
    pub name: String,
    pub data: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RootFs {
    pub r#type: String,
    pub layers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageMetadata {
    pub last_tag_time: String,
}

pub async fn list_images(all: bool) -> Result<Vec<ImageListItem>> {
    let client = DOCKER_CLIENT.get_client().await?;
    
    let options = Some(ListImagesOptions::<String> {
        all,
        ..Default::default()
    });

    match client.list_images(options).await {
        Ok(images) => {
            let result: Vec<ImageListItem> = images
                .into_iter()
                .map(|image| convert_image_summary(image))
                .collect();
            
            log_docker_operation("list_images", true, Some(&format!("Found {} images", result.len())));
            Ok(result)
        }
        Err(e) => {
            log_docker_operation("list_images", false, Some(&e.to_string()));
            Err(DockerError::Connection(e))
        }
    }
}

pub async fn inspect_image(id: &str) -> Result<ImageDetails> {
    let client = DOCKER_CLIENT.get_client().await?;

    match client.inspect_image(id).await {
        Ok(image) => {
            let result = convert_image_inspect(image);
            log_docker_operation("inspect_image", true, Some(&format!("Inspected image {}", id)));
            Ok(result)
        }
        Err(e) => {
            log_docker_operation("inspect_image", false, Some(&e.to_string()));
            if e.to_string().contains("404") {
                Err(DockerError::ImageNotFound { id: id.to_string() })
            } else {
                Err(DockerError::Connection(e))
            }
        }
    }
}

pub async fn remove_image(id: &str, force: bool, no_prune: bool) -> Result<()> {
    let client = DOCKER_CLIENT.get_client().await?;
    
    let options = Some(RemoveImageOptions {
        force,
        noprune: no_prune,
    });

    match client.remove_image(id, options, None).await {
        Ok(_) => {
            log_docker_operation("remove_image", true, Some(&format!("Removed image {}", id)));
            Ok(())
        }
        Err(e) => {
            log_docker_operation("remove_image", false, Some(&e.to_string()));
            if e.to_string().contains("404") {
                Err(DockerError::ImageNotFound { id: id.to_string() })
            } else {
                Err(DockerError::Connection(e))
            }
        }
    }
}

fn convert_image_summary(image: BollardImageSummary) -> ImageListItem {
    ImageListItem {
        id: image.id,
        parent_id: image.parent_id,
        repo_tags: image.repo_tags,
        repo_digests: image.repo_digests,
        created: image.created,
        size: image.size,
        virtual_size: image.virtual_size.unwrap_or_default(),
        shared_size: image.shared_size,
        labels: image.labels,
        containers: image.containers,
    }
}

fn convert_image_inspect(image: BollardImageInspect) -> ImageDetails {
    ImageDetails {
        id: image.id.unwrap_or_default(),
        repo_tags: image.repo_tags.unwrap_or_default(),
        repo_digests: image.repo_digests.unwrap_or_default(),
        parent: image.parent.unwrap_or_default(),
        comment: image.comment.unwrap_or_default(),
        created: image.created.unwrap_or_default(),
        container: image.container.unwrap_or_default(),
        container_config: serde_json::to_value(&image.container_config).unwrap_or_default(),
        docker_version: image.docker_version.unwrap_or_default(),
        author: image.author.unwrap_or_default(),
        config: serde_json::to_value(&image.config).unwrap_or_default(),
        architecture: image.architecture.unwrap_or_default(),
        os: image.os.unwrap_or_default(),
        size: image.size.unwrap_or_default(),
        virtual_size: image.virtual_size.unwrap_or_default(),
        graph_driver: GraphDriver {
            name: image.graph_driver.as_ref().and_then(|gd| Some(gd.name.clone())).unwrap_or_default(),
            data: image.graph_driver.as_ref().map(|gd| gd.data.clone()).unwrap_or_default(),
        },
        root_fs: RootFs {
            r#type: image.root_fs.as_ref().map(|rf| rf.typ.clone()).unwrap_or_default(),
            layers: image.root_fs.as_ref().and_then(|rf| rf.layers.clone()).unwrap_or_default(),
        },
        metadata: ImageMetadata {
            last_tag_time: image.metadata.as_ref()
                .and_then(|m| m.last_tag_time.clone())
                .unwrap_or_default(),
        },
    }
}
