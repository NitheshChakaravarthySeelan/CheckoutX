use std::{env, path::PathBuf};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let crate_root = PathBuf::from(env::var("CARGO_MANIFEST_DIR")?);

    // Adjust depth ONCE, commit it, never think again
    let workspace_root = crate_root
        .ancestors()
        .nth(3) // <- number of levels to repo root
        .expect("Failed to locate workspace root");

    let shared_proto_dir = workspace_root.join("shared/proto");
    let inventory_proto_file = shared_proto_dir.join("inventory.proto");

    tonic_build::configure().build_server(true).compile(
        &[inventory_proto_file.to_str().unwrap()],
        &[shared_proto_dir.to_str().unwrap()],
    )?;

    Ok(())
}

