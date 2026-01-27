use std::{env, path::PathBuf};

fn find_workspace_root() -> PathBuf {
    let mut current_dir = env::current_dir().unwrap();
    // Loop upwards until pnpm-workspace.yaml is found
    loop {
        if current_dir.join("pnpm-workspace.yaml").exists() {
            return current_dir;
        }
        if !current_dir.pop() {
            // Reached the root of the filesystem without finding pnpm-workspace.yaml
            panic!("Could not find workspace root (pnpm-workspace.yaml not found)");
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let workspace_root = find_workspace_root();

    let shared_proto_dir = workspace_root.join("shared/proto");
    let inventory_proto_file = shared_proto_dir.join("inventory.proto");

    tonic_build::configure()
        .build_server(true)
        .compile(
            &[inventory_proto_file.to_str().unwrap()],
            &[shared_proto_dir.to_str().unwrap()],
        )?;
    Ok(())
}
