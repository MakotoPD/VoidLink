use std::fs::{self, File};
use std::io::{Cursor, Read, Seek, SeekFrom, Write};
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

/// Extract a ZIP archive (provided as raw bytes) into `dest_dir`.
///
/// Used for MCJars server engines distributed as ZIPs (Forge, NeoForge, Mohist,
/// Magma, etc.). The archive root is extracted directly into `dest_dir`, so
/// server.jar and libraries/ land at the server folder root.
#[tauri::command]
pub async fn extract_zip_to_dir(bytes: Vec<u8>, dest_dir: String) -> Result<(), String> {
    let dest = PathBuf::from(&dest_dir);
    fs::create_dir_all(&dest).map_err(|e| format!("Failed to create dest dir: {}", e))?;

    let cursor = Cursor::new(bytes);
    let mut archive =
        zip::ZipArchive::new(cursor).map_err(|e| format!("Failed to open ZIP: {}", e))?;

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("ZIP entry error: {}", e))?;

        // Sanitise path — strip leading slashes and any ".." components
        let raw_name = entry.name().replace('\\', "/");
        let rel_path: PathBuf = raw_name
            .split('/')
            .filter(|s| !s.is_empty() && *s != "..")
            .collect();

        if rel_path.as_os_str().is_empty() {
            continue;
        }

        let out_path = dest.join(&rel_path);

        if entry.is_dir() {
            fs::create_dir_all(&out_path)
                .map_err(|e| format!("Failed to create dir {:?}: {}", out_path, e))?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create parent {:?}: {}", parent, e))?;
            }

            let mut outfile = File::create(&out_path)
                .map_err(|e| format!("Failed to create {:?}: {}", out_path, e))?;

            let mut buf = Vec::new();
            entry
                .read_to_end(&mut buf)
                .map_err(|e| format!("Failed to read ZIP entry: {}", e))?;

            outfile
                .write_all(&buf)
                .map_err(|e| format!("Failed to write {:?}: {}", out_path, e))?;
        }
    }

    Ok(())
}
