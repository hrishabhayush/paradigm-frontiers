#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT_DIR/circuits/build"

# Create input from docs example
cat > input.json << 'JSON'
{
  "total_spent": 80,
  "week_start": 1698624000,
  "hash_of_tx_list": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
JSON

node spend_limit_js/generate_witness.js spend_limit_js/spend_limit.wasm input.json witness.wtns
snarkjs groth16 prove spend_limit_0001.zkey witness.wtns proof.json public.json

echo "Proof and public signals written to circuits/build"


