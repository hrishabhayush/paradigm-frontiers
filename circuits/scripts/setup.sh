#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT_DIR/circuits/build"

snarkjs groth16 setup spend_limit.r1cs pot12_final.ptau spend_limit_0000.zkey
snarkjs zkey contribute spend_limit_0000.zkey spend_limit_0001.zkey --name="first" -e="demo"
snarkjs zkey export verificationkey spend_limit_0001.zkey verification_key.json

echo "Setup complete; zkey and verification key ready"


