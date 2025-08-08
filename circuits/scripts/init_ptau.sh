#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT_DIR/circuits/build"

# Initialize Powers of Tau (small size sufficient for demo)
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="first" -v -e="demo"
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

echo "Prepared pot12_final.ptau"


