use tracing::{info, error};
use tracing_subscriber;

pub fn init_logger() {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)  // Changed from INFO to DEBUG for better debugging
        .with_target(false)
        .init();
    
    info!("Logger initialized with DEBUG level");
}

pub fn log_docker_connection(success: bool, error: Option<&str>) {
    if success {
        info!("Docker connection established successfully");
    } else {
        error!("Docker connection failed: {}", error.unwrap_or("Unknown error"));
    }
}

pub fn log_docker_operation(operation: &str, success: bool, details: Option<&str>) {
    if success {
        info!("Docker operation '{}' completed successfully", operation);
        if let Some(details) = details {
            info!("Operation details: {}", details);
        }
    } else {
        error!("Docker operation '{}' failed", operation);
        if let Some(details) = details {
            error!("Error details: {}", details);
        }
    }
}
