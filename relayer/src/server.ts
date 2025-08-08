import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/bundle', (req, res) => {
  const { tx, proof, publicInputs } = req.body || {};
  console.log('Relayer received tx');
  if (!tx || !proof || !publicInputs) {
    return res.status(400).json({ error: 'invalid payload' });
  }

  // Simulate 2+ mock searchers bidding
  const bids = [
    { who: 'searcher-a', gwei: Math.floor(Math.random() * 5) + 3 },
    { who: 'searcher-b', gwei: Math.floor(Math.random() * 5) + 3 },
  ];
  const winner = bids.reduce((a, b) => (a.gwei >= b.gwei ? a : b));
  console.log(`Searcher A bid ${bids[0].gwei} GWEI, B bid ${bids[1].gwei} GWEI → ${winner.who} wins`);

  // Mock "submission" to chain
  const txHash = '0x' + crypto.randomBytes(32).toString('hex');
  console.log('Tx submitted to chain', txHash);

  return res.json({ accepted: true, winner: winner.who, bidGwei: winner.gwei, txHash, logs: [
    'Relayer received tx',
    `Searcher A bid ${bids[0].gwei} GWEI, B bid ${bids[1].gwei} GWEI → ${winner.who} wins`,
    'Tx submitted to chain'
  ]});
});

const port = Number(process.env.RELAYER_PORT) || 8080;
app.listen(port, () => {
  console.log(`Relayer listening on http://localhost:${port}`);
});


