### Proposed Repository Structure (for scaffolding)

Top-level
- `circuits/` — Circom sources, build artifacts, scripts
- `contracts/` — Solidity verifier + Porto plugin
- `backend/` — Mock spending tracker + prover wrapper (TS)
- `relayer/` — Mock auction relayer HTTP server (TS)
- `frontend/` — React app (Porto SDK integration)
- `mock/` — Static JSON inputs (e.g., `txs.json`)
- `out/` — Generated artifacts (proofs, public signals)
- `docs/` — Specifications and planning (this folder)

Within components (suggested)
- `backend/`
  - `src/index.ts` — HTTP endpoints to request proof (optional)
  - `src/computeInputs.ts` — Aggregates mock txs to weekly spend
  - `src/prover.ts` — CLI/JS wrapper for snarkjs prove/verify
  - `.env`
- `relayer/`
  - `src/server.ts` — `/health`, `/bundle`
  - `src/auction.ts` — mock bidding logic
  - `.env`
- `contracts/`
  - `Verifier.sol` — generated
  - `SpendLimitPlugin.sol` — Porto plugin
  - `test/` — unit tests
- `circuits/`
  - `spend_limit.circom`
  - `build/` — r1cs, wasm, zkey
  - `scripts/` — powers of tau, setup, export verifier
- `frontend/`
  - `src/pages/` or `src/app/` — Connect, Send USDC, Proof, Submit
  - `src/lib/relayer.ts` — POST /bundle client
  - `src/lib/backend.ts` — Proof request client

Naming anchors (for future prompts)
- Circuit: `circuits/spend_limit.circom`
- Example inputs: `docs/PROOF_INPUT_EXAMPLE.json`
- Relayer API: `docs/RELAYER_OPENAPI.yaml`
- Env template: `docs/ENV.example`


