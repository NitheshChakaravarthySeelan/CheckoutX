// services/inventory/inventory-read/src/lib.rs
// Library root. Declares all other modules.

pub mod api;
pub mod config;
pub mod domain;
pub mod error;
pub mod infrastructure;
pub mod telemetry;

pub mod inventory_proto {
    include!(concat!(env!("OUT_DIR"), "/inventory.rs"));
}
