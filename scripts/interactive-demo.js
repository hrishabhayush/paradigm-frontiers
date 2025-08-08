#!/usr/bin/env node
/*
Interactive terminal demo for zk-wallet PoC
- Assumes backend (http://localhost:3001) and relayer (http://localhost:8080) are running
- Lets you enter amount, recipient, and schedule multiple private submissions
*/

const readline = require('readline')

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise((resolve) => rl.question(question, resolve))
  rl.close()
  return answer
}

async function healthCheck() {
  const back = await fetch('http://localhost:3001/health').then((r) => r.json()).catch(() => ({}))
  const rel = await fetch('http://localhost:8080/health').then((r) => r.json()).catch(() => ({}))
  console.log('\n[health] backend:', back, 'relayer:', rel)
}

async function generateProof() {
  const res = await fetch('http://localhost:3001/proof', { method: 'POST' })
  if (!res.ok) throw new Error(`/proof ${res.status}`)
  const data = await res.json()
  console.log('[proof] inputs:', { total_spent: data.inputs?.total_spent, week_start: data.inputs?.week_start })
  return data
}

async function submitPrivately({ tx, proof, publicInputs }) {
  const res = await fetch('http://localhost:8080/bundle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx, proof, publicInputs }),
  })
  if (!res.ok) throw new Error(`/bundle ${res.status}`)
  const out = await res.json()
  console.log('[relayer] result:', { accepted: out.accepted, winner: out.winner, bidGwei: out.bidGwei, txHash: out.txHash })
}

async function runOnce() {
  const amount = (await prompt('Amount (USD), default 1: ')) || '1'
  const recipient = (await prompt('Recipient (0x...), default 0xDEMO...: ')) || '0xDEMO...'
  await healthCheck()
  const proof = await generateProof()
  const tx = `Transfer $${amount} to ${recipient}`
  await submitPrivately({ tx, proof: proof.proof, publicInputs: proof.publicSignals })
}

async function runScheduler() {
  const countStr = (await prompt('How many submissions? (default 3): ')) || '3'
  const intervalStr = (await prompt('Interval seconds? (default 10): ')) || '10'
  const amount = (await prompt('Amount (USD), default 1: ')) || '1'
  const recipient = (await prompt('Recipient (0x...), default 0xDEMO...: ')) || '0xDEMO...'
  const count = Math.max(1, Number(countStr) || 3)
  const intervalMs = Math.max(1, Number(intervalStr) || 10) * 1000

  console.log(`\n[scheduler] ${count} runs every ${intervalMs / 1000}s`)
  for (let i = 1; i <= count; i++) {
    console.log(`\n[run ${i}/${count}]`)
    try {
      const proof = await generateProof()
      const tx = `Transfer $${amount} to ${recipient}`
      await submitPrivately({ tx, proof: proof.proof, publicInputs: proof.publicSignals })
    } catch (e) {
      console.error('[scheduler] error:', e?.message || e)
    }
    if (i < count) await new Promise((r) => setTimeout(r, intervalMs))
  }
}

async function main() {
  console.log('zk-wallet interactive demo (terminal)')
  console.log('Make sure backend (:3001) and relayer (:8080) are running in separate terminals.')
  while (true) {
    console.log('\nMenu:')
    console.log('  1) Health check')
    console.log('  2) Generate proof')
    console.log('  3) Submit privately (proof -> relayer)')
    console.log('  4) Scheduler (multiple submissions)')
    console.log('  5) Exit')
    const choice = await prompt('Select: ')
    try {
      if (choice === '1') await healthCheck()
      else if (choice === '2') await generateProof()
      else if (choice === '3') await runOnce()
      else if (choice === '4') await runScheduler()
      else if (choice === '5') break
    } catch (e) {
      console.error('[error]', e?.message || e)
    }
  }
  console.log('Goodbye!')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


