#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR=$(cd "${0:A:h}/.." && pwd)

function section() {
  print -P "\n%F{blue}=== $1 ===%f\n"
}

section "Start backend & relayer"
(
  cd "$ROOT_DIR/backend"
  npm run serve &
  echo $! > "$ROOT_DIR/.pid-backend"
)
(
  cd "$ROOT_DIR/relayer"
  npm start &
  echo $! > "$ROOT_DIR/.pid-relayer"
)

sleep 2

section "Health checks"
curl -sS http://localhost:3001/health | jq '.'
curl -sS http://localhost:8080/health | jq '.'

section "Generate proof (ZK enforcement: spent ≤ limit)"
curl -sS -X POST http://localhost:3001/proof | jq '{inputs:.inputs | {total_spent, week_start}}'

section "Submit privately to auction relayer"
curl -sS -X POST http://localhost:3001/proof \
 | jq '{tx:"Transfer $1 to 0xDEMO...", proof:.proof, publicInputs:.publicSignals}' \
 | curl -sS -X POST http://localhost:8080/bundle -H 'Content-Type: application/json' -d @- \
 | jq '{accepted, winner, bidGwei, txHash}'

section "Permission manager (mock)"
print -P "Granting scoped permissions: { calls:[exp1], spend:[100 EXP/hour] }"

section "Stop services"
kill $(cat "$ROOT_DIR/.pid-backend") || true
kill $(cat "$ROOT_DIR/.pid-relayer") || true
rm -f "$ROOT_DIR/.pid-backend" "$ROOT_DIR/.pid-relayer"
print -P "%F{green}Done.%f"


