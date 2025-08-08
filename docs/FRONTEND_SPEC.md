### Frontend Spec (React + Porto SDK)

Primary screens:
1) Connect Wallet + Set Weekly Limit ($100)
2) Send USDC: amount, recipient
3) Generate ZK Proof (button) → shows spinner + result summary
4) Submit Privately (button) → posts to Relayer, shows logs + tx hash

Key interactions:
- Connect via Porto SDK (mock network acceptable)
- `Generate ZK Proof` calls backend mock endpoint to compute inputs and run prover
- `Submit Privately` calls Relayer `/bundle` with `{ tx, proof, publicInputs }`
- On success, show “Tx Confirmed” and optional decoded proof inputs

Minimal state:
- `connectedAddress`
- `weeklyLimit = 100`
- `form: { amount, recipient }`
- `proofResult: { proof, publicSignals } | null`
- `relayResult: { txHash, logs } | null`

Telemetry/logging:
- Console logs for each step to support the narrated demo

### Related Docs
- Architecture: `docs/ARCHITECTURE.md`
- Plan & TODOs: `docs/PLAN.md`
- Relayer API: `docs/RELAYER_OPENAPI.yaml`

### External References
- Porto SDK: `https://porto.sh`

