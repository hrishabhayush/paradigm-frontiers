## zkAuction Wallet

- Slides: [Canva Presentation](https://www.canva.com/design/DAGvgtwGzHI/Zz5aUzi20jpIg7V9n4znZg/view?utm_content=DAGvgtwGzHI&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h28f7088062)

Prove “I spent < $100 this week” privately; route tx via a mock auction relayer; enforce rules with a Porto wallet plugin.

### Screen recording
- Direct link: [`assets/demo.mov`](assets/demo.mov)

<video src="assets/demo.mov" controls muted playsinline style="max-width: 720px; width: 100%;"></video>

### Quick Links
- Plan & TODOs: `docs/PLAN.md`
- Architecture: `docs/ARCHITECTURE.md`
- ZK Circuit Spec: `docs/ZK_CIRCUIT_SPEC.md`
- Relayer API: `docs/RELAYER_OPENAPI.yaml`
- Plugin Spec: `docs/PORTO_PLUGIN_SPEC.md`
- Frontend Spec: `docs/FRONTEND_SPEC.md`
- Integration Test Plan: `docs/INTEGRATION_TEST_PLAN.md`

### References
- Circom: `https://docs.circom.io`
- snarkjs: `https://github.com/iden3/snarkjs`
- circomlib: `https://github.com/iden3/circomlib`
- Noir: `https://docs.noir-lang.org`
- Flashbots Protect: `https://docs.flashbots.net/flashbots-protect/overview`
- Porto SDK: `https://porto.sh`

### Smart contract (short)
- `contracts/src/SpendLimitPlugin.sol`
  - Inherits `Groth16Verifier` for the spending-limit zk-SNARK.
  - `Config { spendLimit, relayerAddress, recoveryAddress }` with `setConfig`.
  - `executeWithProof(...)`: only `relayerAddress` may call; verifies Groth16 proof; emits `ProofVerified` on success (policy gate hook).

### Contracts
```bash
cd contracts && npm i && npx hardhat test
```

### Run demo (terminal)
- Interactive (enter amount/recipient, scheduler):
  ```bash
  # In two terminals
  (cd backend && npm run serve)
  (cd relayer && npm start)
  # Then in repo root
  npm run demo:interactive
  ```

### On‑chain (testnet)
Set in `relayer/.env`, then `npm start` in `relayer/`:
```
RELAYER_RPC_URL=https://sepolia.infura.io/v3/<key>
RELAYER_PRIVATE_KEY=0x<funded_test_pk>
RELAYER_EXPLORER_TX_PREFIX=https://sepolia.etherscan.io/tx/
```

