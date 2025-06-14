// Simplified error handling for basic version
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum DockerError {
    NotConnected,
    ConnectionError(String),
    ContainerNotFound(String),
    ImageNotFound(String),
    NetworkNotFound(String),
    VolumeNotFound(String),
    PermissionDenied(String),
    InvalidArgument(String),
    OperationFailed(String),
    ApiError(String),
    SerializationError(String),
    IoError(String),
    TimeoutError(String),
    Unknown(String),
}

impl std::fmt::Display for DockerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DockerError::NotConnected => write!(f, "Not connected to Docker daemon"),
            DockerError::ConnectionError(msg) => write!(f, "Connection error: {}", msg),
            DockerError::ContainerNotFound(id) => write!(f, "Container not found: {}", id),
            DockerError::ImageNotFound(id) => write!(f, "Image not found: {}", id),
            DockerError::NetworkNotFound(id) => write!(f, "Network not found: {}", id),
            DockerError::VolumeNotFound(id) => write!(f, "Volume not found: {}", id),
            DockerError::PermissionDenied(msg) => write!(f, "Permission denied: {}", msg),
            DockerError::InvalidArgument(msg) => write!(f, "Invalid argument: {}", msg),
            DockerError::OperationFailed(msg) => write!(f, "Operation failed: {}", msg),
            DockerError::ApiError(msg) => write!(f, "API error: {}", msg),
            DockerError::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
            DockerError::IoError(msg) => write!(f, "IO error: {}", msg),
            DockerError::TimeoutError(msg) => write!(f, "Timeout error: {}", msg),
            DockerError::Unknown(msg) => write!(f, "Unknown error: {}", msg),
        }
    }
}

impl std::error::Error for DockerError {}

impl From<serde_json::Error> for DockerError {
    fn from(error: serde_json::Error) -> Self {
        DockerError::SerializationError(error.to_string())
    }
}

impl From<std::io::Error> for DockerError {
    fn from(error: std::io::Error) -> Self {
        DockerError::IoError(error.to_string())
    }
}

// Result type alias for convenience
pub type DockerResult<T> = Result<T, DockerError>;

// Helper function to create specific errors
impl DockerError {
    pub fn container_not_found(id: &str) -> Self {
        DockerError::ContainerNotFound(id.to_string())
    }
    
    pub fn image_not_found(id: &str) -> Self {
        DockerError::ImageNotFound(id.to_string())
    }
    
    pub fn network_not_found(id: &str) -> Self {
        DockerError::NetworkNotFound(id.to_string())
    }
    
    pub fn volume_not_found(id: &str) -> Self {
        DockerError::VolumeNotFound(id.to_string())
    }
    
    pub fn operation_failed(message: &str) -> Self {
        DockerError::OperationFailed(message.to_string())
    }
    
    pub fn invalid_argument(message: &str) -> Self {
        DockerError::InvalidArgument(message.to_string())
    }
}
