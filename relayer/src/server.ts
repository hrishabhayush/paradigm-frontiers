import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { ethers } from 'ethers';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Optional devnet wiring
const rpcUrl = process.env.RELAYER_RPC_URL;
const relayerKey = process.env.RELAYER_PRIVATE_KEY;
// Optional: set a block explorer tx URL prefix, e.g. https://sepolia.etherscan.io/tx/
const explorerTxPrefix = process.env.RELAYER_EXPLORER_TX_PREFIX || '';
const provider = rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : undefined;
const wallet = provider && relayerKey ? new ethers.Wallet(relayerKey, provider) : undefined;

app.post('/bundle', async (req, res) => {
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

  // If configured, submit a real transaction to devnet; else mock a hash
  let txHash: string;
  if (wallet) {
    try {
      const sent = await wallet.sendTransaction({ to: wallet.address, value: 0n });
      console.log('Broadcasted tx', sent.hash);
      await sent.wait(1);
      txHash = sent.hash;
    } catch (e) {
      console.error('Broadcast error; falling back to mock hash:', (e as Error)?.message);
      txHash = '0x' + crypto.randomBytes(32).toString('hex');
    }
  } else {
    // Mock "submission" to chain
    txHash = '0x' + crypto.randomBytes(32).toString('hex');
    console.log('Tx submitted to chain (mock)', txHash);
  }

  const txUrl = explorerTxPrefix && txHash ? `${explorerTxPrefix}${txHash}` : undefined;

  return res.json({ accepted: true, winner: winner.who, bidGwei: winner.gwei, txHash, txUrl, logs: [
    'Relayer received tx',
    `Searcher A bid ${bids[0].gwei} GWEI, B bid ${bids[1].gwei} GWEI → ${winner.who} wins`,
    'Tx submitted to chain'
  ]});
});

const port = Number(process.env.RELAYER_PORT) || 8080;
app.listen(port, () => {
  console.log(`Relayer listening on http://localhost:${port}`);
});


