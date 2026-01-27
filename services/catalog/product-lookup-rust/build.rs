use std::{env, path::PathBuf};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Absolute path to services/catalog/product-lookup-rust
    let crate_root =
        PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set"));

    // Resolve shared/proto relative to this crate
    let shared_proto_dir = crate_root
        .join("../../../shared/proto")
        .canonicalize()
        .expect("Failed to locate shared/proto");

    let product_lookup_proto_file = shared_proto_dir.join("product_lookup.proto");

    tonic_build::configure().build_server(true).compile(
        &[product_lookup_proto_file.to_str().unwrap()],
        &[shared_proto_dir.to_str().unwrap()],
    )?;

    Ok(())
}
