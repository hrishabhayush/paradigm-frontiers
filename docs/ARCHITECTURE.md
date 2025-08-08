### Architecture

End-to-end flow for the demo:
- Frontend collects tx intent and requests a proof from the backend mock
- Backend aggregates mock tx history and calls the ZK prover
- Relayer receives `{ tx, proof, publicInputs }`, simulates an auction, and submits
- Porto wallet plugin verifies the proof on-chain and enforces relayer requirement

```mermaid
flowchart LR
  User["User UI
  (React)"] --> FE["Frontend (Porto SDK)"]
  FE -->|Request proof| BE["Backend Spending Tracker\n(Node, mocked)"]
  BE -->|{proof, publicSignals}| FE
  FE -->|POST /bundle\n{tx, proof, publicInputs}| RL["Relayer (HTTP)\nMock Auction"]
  RL -->|Submit tx| Chain[(Blockchain)]
  subgraph Wallet
    PLG["Porto Plugin\n(Verifier + Rules)"]
  end
  Chain -.-> PLG
```

### Trust and Privacy Notes
- Backend sees raw mock tx history; in a real system, this would be locally computed or using private computation
- Relayer sees tx + proof; tx should be privacy-preserving (e.g., via private mempool)
- On-chain plugin verifies only proof validity and relayer authorization; no sensitive details are revealed

### Data Contracts (high-level)
- Proof Request: `{ week_start, tx_hash_list | hash_of_tx_list }` (mock uses hash only)
- Proof Response: `{ proof, publicSignals }`
- Relay Bundle: `{ tx, proof, publicInputs }`

### Operational Boundaries
- Each component is independently runnable with a single command
- Logs provide an auditable trail across boundaries

### Related Docs
- Plan & TODOs: `docs/PLAN.md`
- ZK Circuit Spec: `docs/ZK_CIRCUIT_SPEC.md`
- Relayer API: `docs/RELAYER_OPENAPI.yaml`
- Plugin Spec: `docs/PORTO_PLUGIN_SPEC.md`
- Frontend Spec: `docs/FRONTEND_SPEC.md`

### External References
- Flashbots Protect: `https://docs.flashbots.net/flashbots-protect/overview`
- MEV-Share: `https://docs.flashbots.net/flashbots-mev-share/overview`
- Porto SDK: `https://porto.sh`

