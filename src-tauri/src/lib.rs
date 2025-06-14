mod utils;
mod docker;
mod commands;

use utils::init_logger;
use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    init_logger();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // System commands
            connect_docker,
            disconnect_docker,
            get_docker_connection_status,
            get_system_info,
            get_system_stats,
            test_docker_connection,
            // Container commands
            get_containers,
            get_container_details,
            start_container_cmd,
            stop_container_cmd,
            restart_container_cmd,
            remove_container_cmd,
            kill_container_cmd,
            get_container_stats_cmd,
            // Image commands
            get_images,
            get_image_details,
            remove_image_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
