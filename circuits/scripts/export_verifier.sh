#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT_DIR/circuits/build"

snarkjs zkey export solidityverifier spend_limit_0001.zkey Verifier.sol
mkdir -p "$ROOT_DIR/contracts"
mv Verifier.sol "$ROOT_DIR/contracts/Verifier.sol"

echo "Exported Solidity verifier to contracts/Verifier.sol"


