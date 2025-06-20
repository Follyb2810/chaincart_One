optimize = """docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.16.0
"""

optimize = "cosmwasm-opt ./target/wasm32-unknown-unknown/release/escrow_contract.wasm && mkdir -p artifacts && mv ./target/wasm32-unknown-unknown/release/escrow_contract.wasm ./artifacts/escrow_contract.wasm"

[lib]
crate-type = ["cdylib", "rlib"]


Deployed hash: 377BA2EAE01647E9A90DD32FC298BAB6BCFBE58CFE58571EFF45588BDABAFBF3
TXID = 