use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use zip::write::FileOptions;
use zip::{CompressionMethod, ZipArchive, ZipWriter};
use chrono::Local;

// Backup metadata structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub size_bytes: u64,
    pub path: String,
    pub backup_type: String, // "manual" or "auto"
    pub included_folders: Vec<String>,
}

// Backup settings per server
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupSettings {
    pub enabled: bool,
    pub interval_minutes: u32,
    pub max_backups: u32,
    pub custom_path: Option<String>,
    pub included_folders: Vec<String>,
}

impl Default for BackupSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            interval_minutes: 30,
            max_backups: 5,
            custom_path: None,
            included_folders: vec![
                "world".to_string(),
                "world_nether".to_string(),
                "world_the_end".to_string(),
            ],
        }
    }
}

// Backup statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupStats {
    pub total_backups: u32,
    pub total_size_bytes: u64,
    pub oldest_backup: Option<String>,
    pub newest_backup: Option<String>,
}

// Default exclusion patterns (files/folders to skip)
const DEFAULT_EXCLUSIONS: &[&str] = &[
    ".log",
    ".log.gz",
    "crash-reports",
    ".mixin.out",
    "logs",
    ".cache",
    "libraries",
];

fn should_exclude(path: &Path, exclusions: &[&str]) -> bool {
    let path_str = path.to_string_lossy().to_lowercase();
    let file_name = path.file_name()
        .map(|n| n.to_string_lossy().to_lowercase())
        .unwrap_or_default();
    
    for exclusion in exclusions {
        let excl_lower = exclusion.to_lowercase();
        if file_name.ends_with(&excl_lower) || file_name == excl_lower || path_str.contains(&excl_lower) {
            return true;
        }
    }
    false
}

fn get_backup_dir(server_id: &str, custom_path: Option<&str>) -> Result<PathBuf, String> {
    match custom_path {
        Some(path) => {
            let custom = PathBuf::from(path);
            let backup_dir = custom.join(server_id);
            fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
            Ok(backup_dir)
        }
        None => {
            let docs = dirs::document_dir()
                .ok_or("Could not find Documents directory")?;
            let backup_dir = docs.join("VoidLink").join("Backups").join(server_id);
            fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
            Ok(backup_dir)
        }
    }
}

fn get_metadata_path(backup_dir: &Path) -> PathBuf {
    backup_dir.join("backups.json")
}

fn load_backup_metadata(backup_dir: &Path) -> Vec<BackupInfo> {
    let meta_path = get_metadata_path(backup_dir);
    if !meta_path.exists() {
        return vec![];
    }
    
    match fs::read_to_string(&meta_path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => vec![],
    }
}

fn save_backup_metadata(backup_dir: &Path, backups: &[BackupInfo]) -> Result<(), String> {
    let meta_path = get_metadata_path(backup_dir);
    let content = serde_json::to_string_pretty(backups).map_err(|e| e.to_string())?;
    fs::write(meta_path, content).map_err(|e| e.to_string())
}

/// Create a backup of the specified server
#[tauri::command]
pub fn backup_create_cmd(
    server_path: String,
    server_id: String,
    backup_type: String,
    included_folders: Vec<String>,
    custom_path: Option<String>,
) -> Result<BackupInfo, String> {
    let server_dir = PathBuf::from(&server_path);
    if !server_dir.exists() {
        return Err(format!("Server path does not exist: {}", server_path));
    }

    let backup_dir = get_backup_dir(&server_id, custom_path.as_deref())?;
    
    // Generate backup filename with timestamp
    let now = Local::now();
    let timestamp = now.format("%Y-%m-%d_%H-%M-%S").to_string();
    let backup_name = format!("backup_{}.zip", timestamp);
    let backup_path = backup_dir.join(&backup_name);
    
    // Create ZIP file with maximum compression
    let file = File::create(&backup_path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);
    
    let options = FileOptions::default()
        .compression_method(CompressionMethod::Deflated);
    
    let mut files_added = 0u64;
    
    for folder in &included_folders {
        let folder_path = server_dir.join(folder);
        if !folder_path.exists() {
            log::warn!("Folder does not exist, skipping: {:?}", folder_path);
            continue;
        }
        
        for entry in WalkDir::new(&folder_path) {
            let entry = match entry {
                Ok(e) => e,
                Err(e) => {
                    log::warn!("Error walking directory: {}", e);
                    continue;
                }
            };
            
            let path = entry.path();
            
            // Skip excluded files/folders
            if should_exclude(path, DEFAULT_EXCLUSIONS) {
                continue;
            }
            
            // Calculate relative path from server directory
            let relative_path = match path.strip_prefix(&server_dir) {
                Ok(p) => p,
                Err(_) => continue,
            };
            
            let path_str = relative_path.to_string_lossy().replace('\\', "/");
            
            if path.is_file() {
                zip.start_file(&path_str, options)
                    .map_err(|e| format!("Failed to start file in zip: {}", e))?;
                
                let mut file = File::open(path).map_err(|e| e.to_string())?;
                let mut buffer = Vec::new();
                file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
                zip.write_all(&buffer).map_err(|e| e.to_string())?;
                files_added += 1;
            } else if path.is_dir() && !path_str.is_empty() {
                zip.add_directory(&format!("{}/", path_str), options)
                    .map_err(|e| format!("Failed to add directory: {}", e))?;
            }
        }
    }
    
    zip.finish().map_err(|e| e.to_string())?;
    
    // Get file size
    let metadata = fs::metadata(&backup_path).map_err(|e| e.to_string())?;
    let size_bytes = metadata.len();
    
    log::info!("Created backup with {} files, size: {} bytes", files_added, size_bytes);
    
    // Create backup info
    let backup_info = BackupInfo {
        id: uuid_simple(),
        name: backup_name,
        created_at: now.to_rfc3339(),
        size_bytes,
        path: backup_path.to_string_lossy().to_string(),
        backup_type,
        included_folders,
    };
    
    // Update metadata
    let mut backups = load_backup_metadata(&backup_dir);
    backups.push(backup_info.clone());
    save_backup_metadata(&backup_dir, &backups)?;
    
    Ok(backup_info)
}

/// List all backups for a server
#[tauri::command]
pub fn backup_list_cmd(
    server_id: String,
    custom_path: Option<String>,
) -> Result<Vec<BackupInfo>, String> {
    let backup_dir = get_backup_dir(&server_id, custom_path.as_deref())?;
    let backups = load_backup_metadata(&backup_dir);
    Ok(backups)
}

/// Restore a backup (creates pre-restore backup automatically)
#[tauri::command]
pub fn backup_restore_cmd(
    server_path: String,
    server_id: String,
    backup_id: String,
    included_folders: Vec<String>,
    custom_path: Option<String>,
) -> Result<BackupInfo, String> {
    let server_dir = PathBuf::from(&server_path);
    let backup_dir = get_backup_dir(&server_id, custom_path.as_deref())?;
    
    // Find the backup to restore
    let backups = load_backup_metadata(&backup_dir);
    let backup = backups.iter()
        .find(|b| b.id == backup_id)
        .ok_or("Backup not found")?;
    
    let backup_path = PathBuf::from(&backup.path);
    if !backup_path.exists() {
        return Err("Backup file does not exist".to_string());
    }
    
    // Create pre-restore backup automatically
    log::info!("Creating pre-restore backup...");
    let pre_restore = backup_create_cmd(
        server_path.clone(),
        server_id.clone(),
        "pre-restore".to_string(),
        included_folders.clone(),
        custom_path.clone(),
    )?;
    
    // Extract the backup
    let file = File::open(&backup_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;
    
    // Remove existing folders that will be restored
    for folder in &backup.included_folders {
        let folder_path = server_dir.join(folder);
        if folder_path.exists() {
            fs::remove_dir_all(&folder_path).map_err(|e| e.to_string())?;
        }
    }
    
    // Extract all files
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let out_path = server_dir.join(file.mangled_name());
        
        if file.name().ends_with('/') {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut outfile = File::create(&out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }
    
    log::info!("Backup restored successfully");
    
    Ok(pre_restore)
}

/// Delete a backup
#[tauri::command]
pub fn backup_delete_cmd(
    server_id: String,
    backup_id: String,
    custom_path: Option<String>,
) -> Result<(), String> {
    let backup_dir = get_backup_dir(&server_id, custom_path.as_deref())?;
    let mut backups = load_backup_metadata(&backup_dir);
    
    // Find and remove the backup
    let backup_idx = backups.iter()
        .position(|b| b.id == backup_id)
        .ok_or("Backup not found")?;
    
    let backup = backups.remove(backup_idx);
    
    // Delete the file
    let backup_path = PathBuf::from(&backup.path);
    if backup_path.exists() {
        fs::remove_file(&backup_path).map_err(|e| e.to_string())?;
    }
    
    // Update metadata
    save_backup_metadata(&backup_dir, &backups)?;
    
    log::info!("Deleted backup: {}", backup.name);
    
    Ok(())
}

/// Rotate backups (delete oldest if over limit)
#[tauri::command]
pub fn backup_rotate_cmd(
    server_id: String,
    max_backups: u32,
    custom_path: Option<String>,
) -> Result<u32, String> {
    let backup_dir = get_backup_dir(&server_id, custom_path.as_deref())?;
    let mut backups = load_backup_metadata(&backup_dir);
    
    // Sort by created_at (oldest first)
    backups.sort_by(|a, b| a.created_at.cmp(&b.created_at));
    
    let mut deleted_count = 0u32;
    
    // Delete oldest backups if over limit
    while backups.len() > max_backups as usize {
        if let Some(oldest) = backups.first() {
            let backup_path = PathBuf::from(&oldest.path);
            if backup_path.exists() {
                let _ = fs::remove_file(&backup_path);
            }
            backups.remove(0);
            deleted_count += 1;
        }
    }
    
    if deleted_count > 0 {
        save_backup_metadata(&backup_dir, &backups)?;
        log::info!("Rotated {} old backups", deleted_count);
    }
    
    Ok(deleted_count)
}

/// Get backup statistics
#[tauri::command]
pub fn backup_stats_cmd(
    server_id: String,
    custom_path: Option<String>,
) -> Result<BackupStats, String> {
    let backup_dir = get_backup_dir(&server_id, custom_path.as_deref())?;
    let backups = load_backup_metadata(&backup_dir);
    
    let total_backups = backups.len() as u32;
    let total_size_bytes: u64 = backups.iter().map(|b| b.size_bytes).sum();
    
    let oldest_backup = backups.iter()
        .min_by(|a, b| a.created_at.cmp(&b.created_at))
        .map(|b| b.created_at.clone());
    
    let newest_backup = backups.iter()
        .max_by(|a, b| a.created_at.cmp(&b.created_at))
        .map(|b| b.created_at.clone());
    
    Ok(BackupStats {
        total_backups,
        total_size_bytes,
        oldest_backup,
        newest_backup,
    })
}

/// Get available folders for backup selection
#[tauri::command]
pub fn backup_get_folders_cmd(server_path: String) -> Result<Vec<String>, String> {
    let server_dir = PathBuf::from(&server_path);
    if !server_dir.exists() {
        return Err("Server path does not exist".to_string());
    }
    
    let mut folders = Vec::new();
    
    // Common Minecraft server folders that could be backed up
    let potential_folders = [
        "world", "world_nether", "world_the_end",
        "plugins", "mods", "config", "datapacks",
        "crash-reports", "logs", "ops.json", "whitelist.json",
        "banned-players.json", "banned-ips.json", "server.properties",
    ];
    
    for folder in potential_folders {
        let path = server_dir.join(folder);
        if path.exists() {
            folders.push(folder.to_string());
        }
    }
    
    // Also add any folder starting with "world"
    if let Ok(entries) = fs::read_dir(&server_dir) {
        for entry in entries.flatten() {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_dir() {
                    let name = entry.file_name().to_string_lossy().to_string();
                    if name.starts_with("world") && !folders.contains(&name) {
                        folders.push(name);
                    }
                }
            }
        }
    }
    
    Ok(folders)
}

/// Load backup settings for a server
#[tauri::command]
pub fn backup_load_settings_cmd(
    server_id: String,
    custom_path: Option<String>,
) -> Result<BackupSettings, String> {
    let backup_dir = get_backup_dir(&server_id, custom_path.as_deref())?;
    let settings_path = backup_dir.join("settings.json");
    
    if settings_path.exists() {
        let content = fs::read_to_string(&settings_path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).map_err(|e| e.to_string())
    } else {
        Ok(BackupSettings::default())
    }
}

/// Save backup settings for a server
#[tauri::command]
pub fn backup_save_settings_cmd(
    server_id: String,
    settings: BackupSettings,
    custom_path: Option<String>,
) -> Result<(), String> {
    let backup_dir = get_backup_dir(&server_id, custom_path.as_deref())?;
    let settings_path = backup_dir.join("settings.json");
    
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(settings_path, content).map_err(|e| e.to_string())
}

// Simple UUID generator (no external crate needed)
fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap();
    format!("{:x}{:x}", duration.as_secs(), duration.subsec_nanos())
}
