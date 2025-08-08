### ZK Spending Limit Circuit Spec

Goal: Prove “I spent < $100 this week” without revealing dapp, token, or tx details.

#### Inputs
- Private: `total_spent` (uint)
- Public: `week_start` (unix timestamp), `hash_of_tx_list` (felt/field element)

#### Constraint
- `total_spent < 100`

#### Notes (demo simplification)
- Relationship between `hash_of_tx_list` and `total_spent` is not enforced inside the circuit for the demo; it is computed off-chain and committed by hash for narrative continuity
- This makes the circuit minimal and the proving fast

#### Circom Sketch
```circom
template SpendLimit() {
    signal input total_spent;          // private
    signal input week_start;           // public
    signal input hash_of_tx_list;      // public

    // Enforce total_spent < 100
    component isLess = LessThan(32);
    isLess.in[0] <== total_spent;
    isLess.in[1] <== 100;

    // Constrain result to 1
    isLess.out === 1;
}
```

#### Proving System
- Groth16 (snarkjs)
- Outputs: `proof` and `publicSignals = [week_start, hash_of_tx_list]` (note: `total_spent` remains private)

#### CLI Flow (reference)
1. Compile: `circom spend_limit.circom --r1cs --wasm --sym`
2. Powers of Tau: `snarkjs powersoftau new bn128 12 pot12_0000.ptau` ...
3. Setup: `snarkjs groth16 setup spend_limit.r1cs pot12_final.ptau spend_limit_0000.zkey`
4. Contribute: `snarkjs zkey contribute ...`
5. Export verification key: `snarkjs zkey export verificationkey`
6. Generate witness & proof: `snarkjs groth16 prove ...`
7. Verify: `snarkjs groth16 verify ...`
8. Export Solidity verifier: `snarkjs zkey export verifier ...`

#### Acceptance
- Using `docs/PROOF_INPUT_EXAMPLE.json`, a proof verifies locally and in the Solidity verifier.

#### Related Docs
- Implementation Plan: `docs/PLAN.md`
- Architecture Overview: `docs/ARCHITECTURE.md`

#### References
- Circom docs: `https://docs.circom.io`
- snarkjs (Groth16): `https://github.com/iden3/snarkjs`
- circomlib: `https://github.com/iden3/circomlib`
- Noir (alternative): `https://docs.noir-lang.org`


