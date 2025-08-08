import 'dotenv/config';
import path from 'path';
import fs from 'fs';
// Note: For Node ESM, import with explicit .js so dist/index.js resolves correctly
import { buildProofInputs, computeWeekStart, defaultPaths, loadMockTxs } from './computeInputs.js';
import { runWitnessAndProve, writeInputJson } from './prover.js';

async function main() {
  const paths = defaultPaths();
  const mockPath = paths.mock;
  const circuitsBuild = paths.circuitsBuild;

  const txs = loadMockTxs(mockPath);
  const referenceTs = txs.length ? txs[0].timestamp : Math.floor(Date.now() / 1000);
  const weekStart = Number(process.env.WEEK_START) || computeWeekStart(referenceTs);
  const inputs = buildProofInputs(txs, weekStart);

  console.log('Computed proof inputs:', inputs);
  writeInputJson(inputs, circuitsBuild);

  const { proofPath, publicSignalsPath } = runWitnessAndProve(circuitsBuild);
  console.log('✔️ Proof generated');

  const proof = JSON.parse(fs.readFileSync(proofPath, 'utf-8'));
  const publicSignals = JSON.parse(fs.readFileSync(publicSignalsPath, 'utf-8'));

  // Optional CLI summary
  console.log(`✔️ Proof: User spent $${inputs.total_spent} this week`);
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'proof.json'), JSON.stringify(proof, null, 2));
  fs.writeFileSync(path.join(outDir, 'public.json'), JSON.stringify(publicSignals, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


