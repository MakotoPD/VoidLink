use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};
use std::sync::Arc;
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::{TcpStream, UdpSocket};
use tokio::sync::watch;

// Global state for tracking running tunnel client connections
pub static FRP_PROCESSES: LazyLock<Mutex<HashMap<String, TunnelHandle>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

pub struct TunnelHandle {
    pub tunnel_id: String,
    pub is_running: bool,
    pub shutdown_tx: watch::Sender<bool>,
}

fn default_control_port() -> u16 {
    7001
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FRPConfig {
    pub server_addr: String,
    /// Legacy field — ignored in new implementation
    #[serde(default)]
    pub server_port: u16,
    /// Port of the custom tunnel control server (default: 7001)
    #[serde(default = "default_control_port")]
    pub control_port: u16,
    pub token: String,
    /// Legacy field — ignored in new implementation
    #[serde(default)]
    pub proxies: Vec<FRPProxy>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FRPProxy {
    pub name: String,
    pub proxy_type: String,
    pub local_port: u16,
    pub remote_port: u16,
}

#[derive(Debug, Serialize)]
pub struct FRPStatus {
    pub tunnel_id: String,
    pub is_running: bool,
    pub pid: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct FRPStartResult {
    pub success: bool,
    pub tunnel_id: String,
    pub message: String,
}

// ──────────────────────────────────────────────────────────────────
// Tauri commands
// ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn frp_start_tunnel(
    app: tauri::AppHandle,
    tunnel_id: String,
    config: FRPConfig,
) -> Result<FRPStartResult, String> {
    // Check if already running
    {
        let processes = FRP_PROCESSES.lock().map_err(|e| e.to_string())?;
        if let Some(handle) = processes.get(&tunnel_id) {
            if handle.is_running {
                return Ok(FRPStartResult {
                    success: false,
                    tunnel_id,
                    message: "Tunnel is already running".to_string(),
                });
            }
        }
    }

    let (shutdown_tx, shutdown_rx) = watch::channel(false);

    // Store handle before spawning task so status queries work immediately
    {
        let mut processes = FRP_PROCESSES.lock().map_err(|e| e.to_string())?;
        processes.insert(
            tunnel_id.clone(),
            TunnelHandle {
                tunnel_id: tunnel_id.clone(),
                is_running: true,
                shutdown_tx: shutdown_tx.clone(),
            },
        );
    }

    log::info!(
        "Starting tunnel client {} → {}:{}",
        tunnel_id,
        config.server_addr,
        config.control_port
    );

    let app_clone = app.clone();
    let tunnel_id_clone = tunnel_id.clone();

    tauri::async_runtime::spawn(async move {
        run_control_loop(app_clone, tunnel_id_clone, config, shutdown_rx).await;
    });

    Ok(FRPStartResult {
        success: true,
        tunnel_id,
        message: "Tunnel started".to_string(),
    })
}

#[tauri::command]
pub async fn frp_stop_tunnel(tunnel_id: String) -> Result<bool, String> {
    let mut processes = FRP_PROCESSES.lock().map_err(|e| e.to_string())?;

    if let Some(handle) = processes.get_mut(&tunnel_id) {
        if !handle.is_running {
            return Ok(false);
        }
        // Signal all tasks for this tunnel to shut down
        let _ = handle.shutdown_tx.send(true);
        handle.is_running = false;
        log::info!("Stopped tunnel client: {}", tunnel_id);
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub fn frp_get_status(tunnel_id: String) -> Result<FRPStatus, String> {
    let processes = FRP_PROCESSES.lock().map_err(|e| e.to_string())?;

    if let Some(handle) = processes.get(&tunnel_id) {
        Ok(FRPStatus {
            tunnel_id: handle.tunnel_id.clone(),
            is_running: handle.is_running,
            pid: None, // No subprocess in native implementation
        })
    } else {
        Ok(FRPStatus {
            tunnel_id,
            is_running: false,
            pid: None,
        })
    }
}

/// Called on app exit — gracefully shuts down all active tunnel connections
pub fn stop_all_tunnels() {
    if let Ok(mut processes) = FRP_PROCESSES.lock() {
        for (tunnel_id, handle) in processes.iter_mut() {
            if handle.is_running {
                log::info!("Stopping tunnel client on exit: {}", tunnel_id);
                let _ = handle.shutdown_tx.send(true);
                handle.is_running = false;
            }
        }
    }
}

// ──────────────────────────────────────────────────────────────────
// Core tunnel client logic
// ──────────────────────────────────────────────────────────────────

async fn emit_log(app: &tauri::AppHandle, tunnel_id: &str, msg: &str) {
    log::info!("[Tunnel {}] {}", tunnel_id, msg);
    let _ = app.emit(
        "frp-output",
        serde_json::json!({
            "tunnel_id": tunnel_id,
            "type": "stdout",
            "message": msg
        }),
    );
}

async fn run_control_loop(
    app: tauri::AppHandle,
    tunnel_id: String,
    config: FRPConfig,
    mut shutdown_rx: watch::Receiver<bool>,
) {
    let addr = format!("{}:{}", config.server_addr, config.control_port);

    // Connect to control server
    let stream = tokio::select! {
        result = TcpStream::connect(&addr) => {
            match result {
                Ok(s) => s,
                Err(e) => {
                    emit_log(&app, &tunnel_id, &format!("Failed to connect to {}: {}", addr, e)).await;
                    mark_stopped(&tunnel_id);
                    let _ = app.emit("frp-stopped", serde_json::json!({"tunnel_id": tunnel_id, "code": null}));
                    return;
                }
            }
        }
        _ = shutdown_rx.changed() => return,
    };

    let (read_half, write_half) = stream.into_split();
    // Arc<tokio::sync::Mutex<...>> so we can share the writer across spawned tasks
    let writer = Arc::new(tokio::sync::Mutex::new(write_half));
    let mut reader = BufReader::new(read_half).lines();

    // ── AUTH handshake ──
    {
        let msg = format!("AUTH {} {}\n", config.token, tunnel_id);
        let mut w = writer.lock().await;
        if let Err(e) = w.write_all(msg.as_bytes()).await {
            emit_log(&app, &tunnel_id, &format!("Auth write error: {}", e)).await;
            mark_stopped(&tunnel_id);
            let _ = app.emit("frp-stopped", serde_json::json!({"tunnel_id": tunnel_id, "code": null}));
            return;
        }
    }

    // Read server response (OK or ERROR)
    let first_line = tokio::select! {
        line = reader.next_line() => {
            match line {
                Ok(Some(l)) => l,
                Ok(None) => {
                    emit_log(&app, &tunnel_id, "Connection closed before auth response").await;
                    mark_stopped(&tunnel_id);
                    let _ = app.emit("frp-stopped", serde_json::json!({"tunnel_id": tunnel_id, "code": null}));
                    return;
                }
                Err(e) => {
                    emit_log(&app, &tunnel_id, &format!("Auth read error: {}", e)).await;
                    mark_stopped(&tunnel_id);
                    let _ = app.emit("frp-stopped", serde_json::json!({"tunnel_id": tunnel_id, "code": null}));
                    return;
                }
            }
        }
        _ = shutdown_rx.changed() => return,
    };

    if first_line.trim() != "OK" {
        let msg = first_line.trim_start_matches("ERROR ").to_string();
        emit_log(&app, &tunnel_id, &format!("Auth rejected: {}", msg)).await;
        mark_stopped(&tunnel_id);
        let _ = app.emit("frp-stopped", serde_json::json!({"tunnel_id": tunnel_id, "code": null}));
        return;
    }

    emit_log(&app, &tunnel_id, "Connected to tunnel server").await;
    let _ = app.emit("frp-connected", serde_json::json!({"tunnel_id": tunnel_id}));

    // ── Main event loop ──
    loop {
        tokio::select! {
            line_result = reader.next_line() => {
                match line_result {
                    Ok(Some(line)) => {
                        handle_server_message(
                            &app,
                            &tunnel_id,
                            &config.server_addr,
                            config.control_port,
                            &line,
                            Arc::clone(&writer),
                            shutdown_rx.clone(),
                        ).await;
                    }
                    Ok(None) => {
                        // Server closed the connection
                        emit_log(&app, &tunnel_id, "Connection closed by server").await;
                        break;
                    }
                    Err(e) => {
                        emit_log(&app, &tunnel_id, &format!("Read error: {}", e)).await;
                        break;
                    }
                }
            }
            _ = shutdown_rx.changed() => {
                emit_log(&app, &tunnel_id, "Tunnel stopped by user").await;
                break;
            }
        }
    }

    mark_stopped(&tunnel_id);
    let _ = app.emit(
        "frp-stopped",
        serde_json::json!({"tunnel_id": tunnel_id, "code": null}),
    );
}

async fn handle_server_message(
    app: &tauri::AppHandle,
    tunnel_id: &str,
    server_addr: &str,
    control_port: u16,
    line: &str,
    writer: Arc<tokio::sync::Mutex<tokio::net::tcp::OwnedWriteHalf>>,
    shutdown_rx: watch::Receiver<bool>,
) {
    let parts: Vec<&str> = line.splitn(4, ' ').collect();
    match parts.as_slice() {
        ["PING"] => {
            let mut w = writer.lock().await;
            let _ = w.write_all(b"PONG\n").await;
        }
        ["OPEN", conn_id, local_port_str] => {
            let local_port: u16 = match local_port_str.trim().parse() {
                Ok(p) => p,
                Err(_) => {
                    emit_log(app, tunnel_id, &format!("Invalid OPEN port: {}", local_port_str)).await;
                    return;
                }
            };
            let conn_id = conn_id.to_string();
            let server_addr = server_addr.to_string();
            let app_clone = app.clone();
            let tunnel_id_clone = tunnel_id.to_string();

            tauri::async_runtime::spawn(async move {
                data_relay_task(
                    &app_clone,
                    &tunnel_id_clone,
                    &conn_id,
                    &server_addr,
                    control_port,
                    local_port,
                    shutdown_rx,
                )
                .await;
            });
        }
        // UDP_PKT <conn_id> <local_port> <hex_payload>
        ["UDP_PKT", conn_id, local_port_str, hex_payload] => {
            let local_port: u16 = match local_port_str.trim().parse() {
                Ok(p) => p,
                Err(_) => return,
            };
            let conn_id = conn_id.to_string();
            let hex_payload = hex_payload.trim().to_string();
            let app_clone = app.clone();
            let tunnel_id_clone = tunnel_id.to_string();

            tauri::async_runtime::spawn(async move {
                udp_relay_task(
                    &app_clone,
                    &tunnel_id_clone,
                    &conn_id,
                    local_port,
                    &hex_payload,
                    writer,
                    shutdown_rx,
                )
                .await;
            });
        }
        _ => {
            // Unknown message — log it
            emit_log(app, tunnel_id, &format!("Server: {}", line)).await;
        }
    }
}

/// Opens a data relay channel for a new TCP player connection.
/// Connects to server control port, sends "DATA <conn_id>", then relays
/// bytes bidirectionally between server and the local service.
async fn data_relay_task(
    app: &tauri::AppHandle,
    tunnel_id: &str,
    conn_id: &str,
    server_addr: &str,
    control_port: u16,
    local_port: u16,
    mut shutdown_rx: watch::Receiver<bool>,
) {
    let addr = format!("{}:{}", server_addr, control_port);

    // Connect data channel to server
    let mut server_stream = tokio::select! {
        result = TcpStream::connect(&addr) => {
            match result {
                Ok(s) => s,
                Err(e) => {
                    emit_log(app, tunnel_id, &format!("[{}] Data channel connect error: {}", conn_id, e)).await;
                    return;
                }
            }
        }
        _ = shutdown_rx.changed() => return,
        _ = tokio::time::sleep(tokio::time::Duration::from_secs(15)) => {
            emit_log(app, tunnel_id, &format!("[{}] Data channel connect timeout", conn_id)).await;
            return;
        }
    };

    // Register this connection as a data channel
    let data_msg = format!("DATA {}\n", conn_id);
    if let Err(e) = server_stream.write_all(data_msg.as_bytes()).await {
        emit_log(app, tunnel_id, &format!("[{}] DATA write error: {}", conn_id, e)).await;
        return;
    }

    // Server responds with "OK\n" before switching to raw relay mode.
    // Read exactly until '\n' byte-by-byte to avoid consuming any relay data.
    {
        use tokio::io::AsyncReadExt;
        let mut response = Vec::with_capacity(8);
        loop {
            let mut byte = [0u8; 1];
            match server_stream.read_exact(&mut byte).await {
                Ok(_) => {
                    response.push(byte[0]);
                    if byte[0] == b'\n' { break; }
                    if response.len() > 64 { break; } // safety limit
                }
                Err(e) => {
                    emit_log(app, tunnel_id, &format!("[{}] DATA handshake read error: {}", conn_id, e)).await;
                    return;
                }
            }
        }
        let ok_line = String::from_utf8_lossy(&response);
        if ok_line.trim() != "OK" {
            emit_log(app, tunnel_id, &format!("[{}] DATA handshake rejected: {}", conn_id, ok_line.trim())).await;
            return;
        }
    }

    // Connect to local service
    let mut local_stream = tokio::select! {
        result = TcpStream::connect(("127.0.0.1", local_port)) => {
            match result {
                Ok(s) => s,
                Err(e) => {
                    emit_log(app, tunnel_id, &format!("[{}] Local connect error on port {}: {}", conn_id, local_port, e)).await;
                    return;
                }
            }
        }
        _ = shutdown_rx.changed() => return,
        _ = tokio::time::sleep(tokio::time::Duration::from_secs(10)) => {
            emit_log(app, tunnel_id, &format!("[{}] Local connect timeout on port {}", conn_id, local_port)).await;
            return;
        }
    };

    // Relay bytes bidirectionally until either side closes or shutdown requested
    tokio::select! {
        result = tokio::io::copy_bidirectional(&mut server_stream, &mut local_stream) => {
            if let Err(e) = result {
                // Connection reset / EOF are normal — only log unexpected errors
                if e.kind() != std::io::ErrorKind::ConnectionReset
                    && e.kind() != std::io::ErrorKind::BrokenPipe
                {
                    emit_log(app, tunnel_id, &format!("[{}] Relay error: {}", conn_id, e)).await;
                }
            }
        }
        _ = shutdown_rx.changed() => {}
    }
}

/// Handles a single UDP packet from a voice chat player:
/// decodes hex payload, forwards to local voice server, waits for reply, sends back.
async fn udp_relay_task(
    app: &tauri::AppHandle,
    tunnel_id: &str,
    conn_id: &str,
    local_port: u16,
    hex_payload: &str,
    writer: Arc<tokio::sync::Mutex<tokio::net::tcp::OwnedWriteHalf>>,
    mut shutdown_rx: watch::Receiver<bool>,
) {
    let data = match hex::decode(hex_payload) {
        Ok(d) => d,
        Err(e) => {
            emit_log(app, tunnel_id, &format!("[{}] UDP hex decode error: {}", conn_id, e)).await;
            return;
        }
    };

    let socket = match UdpSocket::bind("0.0.0.0:0").await {
        Ok(s) => s,
        Err(e) => {
            emit_log(app, tunnel_id, &format!("[{}] UDP bind error: {}", conn_id, e)).await;
            return;
        }
    };

    if let Err(e) = socket.send_to(&data, ("127.0.0.1", local_port)).await {
        emit_log(app, tunnel_id, &format!("[{}] UDP send error: {}", conn_id, e)).await;
        return;
    }

    // Wait for reply from local voice server (up to 5 seconds)
    let mut buf = vec![0u8; 65535];
    let recv_result = tokio::select! {
        r = socket.recv(&mut buf) => r,
        _ = shutdown_rx.changed() => return,
        _ = tokio::time::sleep(tokio::time::Duration::from_secs(5)) => return,
    };

    if let Ok(n) = recv_result {
        let reply_hex = hex::encode(&buf[..n]);
        let reply_msg = format!("UDP_REPLY {} {}\n", conn_id, reply_hex);
        let mut w = writer.lock().await;
        let _ = w.write_all(reply_msg.as_bytes()).await;
    }
}

/// Marks a tunnel as no longer running in the global state map
fn mark_stopped(tunnel_id: &str) {
    if let Ok(mut processes) = FRP_PROCESSES.lock() {
        if let Some(handle) = processes.get_mut(tunnel_id) {
            handle.is_running = false;
        }
    }
}
