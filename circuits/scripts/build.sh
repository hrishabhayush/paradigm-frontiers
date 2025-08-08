#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT_DIR/circuits"

mkdir -p build

if ! command -v circom >/dev/null 2>&1; then
  echo "Error: circom CLI not found. Install via Rust:"
  echo "  brew install rustup || true"
  echo "  rustup-init -y && source ~/.cargo/env"
  echo "  cargo install --locked --git https://github.com/iden3/circom circom"
  echo "Or use Docker:"
  echo "  docker run --rm -v \"$PWD/..\":/work -w /work/circuits ghcr.io/iden3/circom:latest \\
    circom spend_limit.circom --r1cs --wasm --sym -o build"
  exit 127
fi

# Ensure circomlib is available
if [ ! -f "../node_modules/circomlib/circuits/comparators.circom" ]; then
  echo "Error: circomlib not found under node_modules. Run:"
  echo "  npm install"
  exit 127
fi

circom spend_limit.circom --r1cs --wasm --sym -o build -l ../node_modules

echo "Compiled circuit to circuits/build"


