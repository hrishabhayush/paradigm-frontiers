### Porto Wallet Plugin Spec

Goals:
- Verify Groth16 proof on-chain via generated Solidity verifier
- Enforce execution path via `requireRelayer`
- Expose config: `spendLimit`, `relayerAddress`, `recoveryAddress`

#### External Interface (sketch)
```solidity
interface ISpendLimitPlugin {
    struct Config {
        uint256 spendLimit;       // e.g., 100 USD-denominated equivalent (demo-only)
        address relayerAddress;   // only this relayer may call execute
        address recoveryAddress;  // optional recovery path
    }

    function setConfig(Config calldata cfg) external;

    function executeWithProof(
        bytes calldata txData,
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external;
}
```

#### Behavior
- `executeWithProof` MUST revert unless `msg.sender == relayerAddress`
- Calls into `Verifier.verifyProof(...)` with provided proof + public inputs
- MUST revert if verifier returns false
- On success, proceeds with execution of `txData` (for demo, can emit event instead)

#### Events & Errors
- `event ProofVerified(address relayer)`
- `error InvalidRelayer(address sender)`
- `error InvalidProof()`

#### Testing
- Valid proof → pass
- Invalid proof → revert `InvalidProof()`
- Wrong relayer → revert `InvalidRelayer(msg.sender)`

### Related Docs
- Architecture: `docs/ARCHITECTURE.md`
- Plan & TODOs: `docs/PLAN.md`
- Relayer API: `docs/RELAYER_OPENAPI.yaml`

### External References
- Circom/snarkjs verifier export: `https://github.com/iden3/snarkjs#7-export-verifier-in-solidity`
- Porto SDK: `https://porto.sh`

