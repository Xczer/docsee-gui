
#[tauri::command]
pub fn greet(name: &str) -> String {
    println!("Namaste Duniya");
    format!("Hello, {}! You've been greeted from Rust!", name)
}
