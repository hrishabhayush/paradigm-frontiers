import React, { useState } from 'react'

type ProofResult = {
  inputs: { total_spent: number; week_start: number; hash_of_tx_list: string }
  proof: any
  publicSignals: any
}

export default function App() {
  const [amount, setAmount] = useState<string>('10')
  const [recipient, setRecipient] = useState<string>('0xrecipient')
  const [proofResult, setProofResult] = useState<ProofResult | null>(null)
  const [relayResult, setRelayResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])

  function addStep(msg: string) {
    setSteps((prev) => [...prev, msg])
  }

  async function generateProof() {
    setLoading(true)
    setError(null)
    setSteps([])
    addStep('Generating ZK proof…')
    try {
      const res = await fetch('http://localhost:3001/proof', { method: 'POST' })
      if (!res.ok) throw new Error(`Backend /proof error: ${res.status}`)
      const data = await res.json()
      setProofResult(data)
      console.log('Proof result', data)
      addStep('✔️ Proof generated')
    } finally {
      setLoading(false)
    }
  }

  async function submitPrivately() {
    if (!proofResult) return
    setLoading(true)
    setError(null)
    addStep('Submitting bundle to relayer…')
    try {
      const payload = {
        tx: '0xdead',
        proof: proofResult.proof,
        publicInputs: proofResult.publicSignals,
      }
      const res = await fetch('http://localhost:8080/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Relayer /bundle error: ${res.status}`)
      const data = await res.json()
      setRelayResult(data)
      console.log('Relay result', data)
      if (Array.isArray(data.logs)) {
        data.logs.forEach((l: string) => addStep(`✔️ ${l}`))
      }
      if (data.txHash) addStep(`✔️ Tx submitted: ${data.txHash}`)
    } catch (e: any) {
      setError(e?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'Inter, sans-serif' }}>
      <h1>zkAuction Wallet</h1>
      <p>Weekly limit: $100</p>

      <div style={{ display: 'grid', gap: 8 }}>
        <label>
          Amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label>
          Recipient
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} />
        </label>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <button onClick={generateProof} disabled={loading}>
          {loading ? 'Working…' : 'Generate ZK Proof'}
        </button>
        <button onClick={submitPrivately} disabled={loading || !proofResult}>
          {loading ? 'Working…' : 'Submit Privately'}
        </button>
      </div>
      {steps.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>Demo Steps</h3>
          <ol>
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}


      {proofResult && (
        <div style={{ marginTop: 24 }}>
          <h3>Proof Summary</h3>
          <pre>{JSON.stringify({ total_spent: proofResult.inputs.total_spent, week_start: proofResult.inputs.week_start }, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, color: 'red' }}>{error}</div>
      )}

      {relayResult && (
        <div style={{ marginTop: 24 }}>
          <h3>Relayer</h3>
          <pre>{JSON.stringify(relayResult, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}


