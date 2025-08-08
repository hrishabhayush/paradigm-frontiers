### Integration Test Plan (Happy Path)

Objective: Demonstrate end-to-end flow with clear logs.

Steps:
1) Prepare mock tx history in `mock/txs.json`
2) Run backend script to compute weekly spend and generate `{ proof, publicSignals }`
3) Frontend requests proof → receives `{ proof, publicSignals }`
4) Frontend posts `{ tx, proof, publicInputs }` to Relayer `/bundle`
5) Relayer logs auction and “submits” tx
6) On-chain (or mocked) plugin verifies proof and accepts execution

Expected logs:
- "✔️ ZK Proof valid"
- "✔️ Auction complete"
- "✔️ Wallet plugin accepted tx"

Negative test (optional): overspend or tampered proof should revert at plugin.


