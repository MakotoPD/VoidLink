use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::PathBuf;

#[derive(serde::Serialize)]
pub struct TailResult {
    pub content: String,
    pub new_offset: u64,
}

#[tauri::command]
pub async fn read_log_tail(path: String, offset: u64) -> Result<TailResult, String> {
    let path = PathBuf::from(path);
    
    // Open file
    let mut file = File::open(&path).map_err(|e| format!("Failed to open file: {}", e))?;
    
    // Check file size
    let file_size = file.metadata().map_err(|e| format!("Failed to get metadata: {}", e))?.len();
    
    // If file shrank (rotation/restart), reset offset
    let mut current_offset = offset;
    if file_size < offset {
        current_offset = 0;
    }
    
    // Seek to offset
    file.seek(SeekFrom::Start(current_offset)).map_err(|e| format!("Failed to seek: {}", e))?;
    
    // Read to end
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| format!("Failed to read: {}", e))?;
    
    // Convert to string (lossy to avoid UTF-8 errors splitting bytes)
    let content = String::from_utf8_lossy(&buffer).to_string();
    
    Ok(TailResult {
        content,
        // Return new offset (current + read bytes)
        new_offset: current_offset + buffer.len() as u64,
    })
}
