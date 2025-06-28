use thiserror::Error;

#[derive(Error, Debug)]
pub enum DockerError {
    #[error("Docker connection failed: {0}")]
    Connection(#[from] bollard::errors::Error),

    #[error("Docker daemon not available")]
    DaemonNotAvailable,

    #[error("Container not found: {id}")]
    ContainerNotFound { id: String },

    #[error("Image not found: {id}")]
    ImageNotFound { id: String },

    #[allow(dead_code)]
    #[error("Network not found: {id}")]
    NetworkNotFound { id: String },

    #[allow(dead_code)]
    #[error("Volume not found: {id}")]
    VolumeNotFound { id: String },

    #[error("Operation failed: {message}")]
    OperationFailed { message: String },

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[allow(dead_code)]
    #[error("Invalid input: {message}")]
    InvalidInput { message: String },
}

pub type Result<T> = std::result::Result<T, DockerError>;

impl serde::Serialize for DockerError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
