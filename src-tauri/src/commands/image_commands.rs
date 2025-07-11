use crate::docker::{
    inspect_image, list_images, pull_image, remove_image, ImageDetails, ImageListItem,
};
use crate::utils::Result;

#[tauri::command]
pub async fn get_images(all: bool) -> Result<Vec<ImageListItem>> {
    list_images(all).await
}

#[tauri::command]
pub async fn get_image_details(id: String) -> Result<ImageDetails> {
    inspect_image(&id).await
}

#[tauri::command]
pub async fn remove_image_cmd(id: String, force: bool, no_prune: bool) -> Result<()> {
    remove_image(&id, force, no_prune).await
}

#[tauri::command]
pub async fn pull_image_cmd(name: String, tag: Option<String>) -> Result<()> {
    pull_image(&name, tag.as_deref()).await
}
