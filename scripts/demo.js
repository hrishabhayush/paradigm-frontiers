#!/usr/bin/env node
const { spawn } = require('child_process')

function wait(ms) { return new Promise((r) => setTimeout(r, ms)) }
function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts })
    p.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)))
  })
}

async function main() {
  const root = process.cwd()
  const backend = spawn('bash', ['-lc', 'npm run serve'], { cwd: root + '/backend', stdio: 'inherit' })
  const relayer = spawn('bash', ['-lc', 'npm start'], { cwd: root + '/relayer', stdio: 'inherit' })

  // Wait for ports to open
  await wait(2500)

  console.log('\n--- HEALTH CHECKS ---')
  await run('curl', ['-sS', 'http://localhost:3001/health'])
  await run('curl', ['-sS', 'http://localhost:8080/health'])

  console.log('\n\n--- GENERATE PROOF ---')
  await run('curl', ['-sS', '-X', 'POST', 'http://localhost:3001/proof'])

  console.log('\n\n--- SUBMIT PRIVATELY (AUCTION) ---')
  const proofToBundle = `curl -sS -X POST http://localhost:3001/proof | jq '{tx:"Transfer $1 to 0xDEMO...", proof:.proof, publicInputs:.publicSignals}' | curl -sS -X POST http://localhost:8080/bundle -H 'Content-Type: application/json' -d @-`
  await run('bash', ['-lc', proofToBundle])

  // Leave servers running for a short while for the recording
  console.log('\nKeeping services up for 20s for recording...')
  await wait(20000)
  backend.kill('SIGINT')
  relayer.kill('SIGINT')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


