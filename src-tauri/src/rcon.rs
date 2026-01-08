use rcon::Connection;
use serde::{Deserialize, Serialize};
use tokio::net::TcpStream;

#[derive(Debug, Serialize, Deserialize)]
pub struct RconResult {
    pub success: bool,
    pub response: String,
}

#[tauri::command]
pub async fn rcon_send_command(
    host: String,
    port: u16,
    password: String,
    command: String,
) -> Result<RconResult, String> {
    let address = format!("{}:{}", host, port);
    
    log::info!("RCON connecting to {} for command: {}", address, command);
    
    // Connect to RCON using tokio
    let mut conn = <Connection<TcpStream>>::builder()
        .enable_minecraft_quirks(true)
        .connect(address, &password)
        .await
        .map_err(|e| format!("RCON connection failed: {}", e))?;
    
    // Send command
    let response = conn.cmd(&command)
        .await
        .map_err(|e| format!("RCON command failed: {}", e))?;
    
    log::info!("RCON response: {}", response);
    
    Ok(RconResult {
        success: true,
        response,
    })
}

#[tauri::command]
pub async fn rcon_stop_server(
    host: String,
    port: u16,
    password: String,
) -> Result<RconResult, String> {
    rcon_send_command(
        host,
        port,
        password,
        "stop".to_string(),
    ).await
}


