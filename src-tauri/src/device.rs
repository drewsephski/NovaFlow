use tauri::command;

/// Get device unique identifier - Desktop implementation
#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[command]
pub fn get_device_id() -> Result<String, String> {
    machine_uid::get()
        .map_err(|e| format!("Failed to get device ID: {}", e))
}

/// Get device unique identifier - Android implementation
#[cfg(target_os = "android")]
#[command]
pub fn get_device_id() -> Result<String, String> {
    get_or_create_device_id()
}

/// Get device unique identifier - iOS implementation
#[cfg(target_os = "ios")]
#[command]
pub fn get_device_id() -> Result<String, String> {
    get_or_create_device_id()
}

/// Generic mobile device ID retrieval logic
#[cfg(any(target_os = "android", target_os = "ios"))]
fn get_or_create_device_id() -> Result<String, String> {
    // Use a simpler approach: directly use temp directory
    // This ensures cross-platform compatibility and permission access
    let app_data_dir = std::env::temp_dir();
    
    let device_id_file = app_data_dir.join("novaflow-device-id.txt");
    
    // If file exists, read existing ID
    if device_id_file.exists() {
        if let Ok(id) = std::fs::read_to_string(&device_id_file) {
            let trimmed = id.trim();
            if !trimmed.is_empty() {
                return Ok(trimmed.to_string());
            }
        }
    }
    
    // If file doesn't exist or read fails, generate new UUID
    let new_id = uuid::Uuid::new_v4().to_string();
    
    // Ensure directory exists (cache_dir usually exists, but check for safety)
    if let Some(parent) = device_id_file.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    // Save to file
    std::fs::write(&device_id_file, &new_id)
        .map_err(|e| format!("Failed to write device ID: {}", e))?;
    
    Ok(new_id)
}
