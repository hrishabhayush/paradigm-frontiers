#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT_DIR/circuits/build"

snarkjs groth16 verify verification_key.json public.json proof.json

echo "✔️ ZK Proof valid"


