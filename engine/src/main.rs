use clap::Parser;
use mjolnir_engine::{server::ws_server, EngineConfig};
use std::net::SocketAddr;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[derive(Parser, Debug)]
#[command(author, version, about = "Mjolnir High-Performance Load Testing Engine", long_about = None)]
struct Cli {
    /// Port to run the WebSocket IPC server on
    #[arg(short, long, default_value_t = 4567)]
    port: u16,

    /// Execution mode: 'standalone', 'master', or 'worker'
    #[arg(short, long, default_value = "standalone")]
    mode: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize structured logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .with_target(false)
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .expect("Failed to set tracing subscriber");

    let cli = Cli::parse();
    info!("⚡ Starting Mjolnir Engine Core v0.1.0...");
    info!("Mode: {}, IPC Port: {}", cli.mode, cli.port);

    let config = EngineConfig {
        port: cli.port,
        mode: cli.mode.clone(),
    };

    let addr = SocketAddr::from(([127, 0, 0, 1], config.port));
    info!("Binding IPC WebSocket Server to {}", addr);

    // Start WebSocket Server
    ws_server::start_server(addr, config).await?;

    Ok(())
}
