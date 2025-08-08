## zkAuction Wallet

Prove “I spent < $100 this week” privately; route tx via a mock auction relayer; enforce rules with a Porto wallet plugin.

### Quick Links
- Plan & TODOs: `docs/PLAN.md`
- Architecture: `docs/ARCHITECTURE.md`
- ZK Circuit Spec: `docs/ZK_CIRCUIT_SPEC.md`
- Relayer API: `docs/RELAYER_OPENAPI.yaml`
- Plugin Spec: `docs/PORTO_PLUGIN_SPEC.md`
- Frontend Spec: `docs/FRONTEND_SPEC.md`
- Integration Test Plan: `docs/INTEGRATION_TEST_PLAN.md`

### Demo Flow (2 min)
1) Set $100/wk limit in UI
2) Prepare mock tx → generate ZK proof (via button)
3) Submit privately → relayer logs auction
4) Wallet plugin verifies → tx goes through
5) Show decoded proof summary: “Spent $80 this week”

### Config
Copy `docs/ENV.example` to appropriate `.env` files per component once scaffolding is added.


