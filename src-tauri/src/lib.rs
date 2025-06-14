// Simplified lib.rs for initial testing
mod utils;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn test_docker_connection() -> Result<String, String> {
    Ok("Docker connection test - not implemented yet".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, test_docker_connection])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
