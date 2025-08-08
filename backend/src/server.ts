import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { buildProofInputs, computeWeekStart, defaultPaths, loadMockTxs } from './computeInputs.ts';
import { runWitnessAndProve, writeInputJson } from './prover.ts';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/proof', async (_req, res) => {
  try {
    const paths = defaultPaths();
    const txs = loadMockTxs(paths.mock);
    const referenceTs = txs.length ? txs[0].timestamp : Math.floor(Date.now() / 1000);
    const weekStart = Number(process.env.WEEK_START) || computeWeekStart(referenceTs);
    const inputs = buildProofInputs(txs, weekStart);
    const circuitsBuild = paths.circuitsBuild;
    writeInputJson(inputs, circuitsBuild);
    const { proofPath, publicSignalsPath } = runWitnessAndProve(circuitsBuild);
    const proof = JSON.parse(fs.readFileSync(proofPath, 'utf-8'));
    const publicSignals = JSON.parse(fs.readFileSync(publicSignalsPath, 'utf-8'));
    res.json({ inputs, proof, publicSignals });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

const port = Number(process.env.BACKEND_PORT) || 3001;
app.listen(port, () => {
  console.log(`Backend mock listening on http://localhost:${port}`);
});


