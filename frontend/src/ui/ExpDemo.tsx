import React, { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { Connect } from '../components/connect'

type Log = { ts: number; message: string }

export function ExpDemo() {
  const { address } = useAccount()
  const [logs, setLogs] = useState<Log[]>([])
  const [proofLoading, setProofLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [proofResult, setProofResult] = useState<any | null>(null)
  const [relayResult, setRelayResult] = useState<any | null>(null)
  const [showRawProof, setShowRawProof] = useState(false)
  const [showRawRelay, setShowRawRelay] = useState(false)

  const add = (message: string) => setLogs((l) => [{ ts: Date.now(), message }, ...l])

  async function handleGenerateProof() {
    setProofLoading(true)
    setShowRawProof(false)
    add('Generating ZK proof (< $100 weekly)')
    try {
      const res = await fetch('http://localhost:3001/proof', { method: 'POST' })
      if (!res.ok) throw new Error(`/proof ${res.status}`)
      const data = await res.json()
      setProofResult(data)
      add('✔ Proof generated')
    } catch (e: any) {
      add(`✖ Proof error: ${e?.message || 'failed'}`)
    } finally {
      setProofLoading(false)
    }
  }

  async function handleSubmitPrivately() {
    if (!proofResult) return
    setSubmitLoading(true)
    setShowRawRelay(false)
    add('Submitting privately via relayer')
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
      if (!res.ok) throw new Error(`/bundle ${res.status}`)
      const data = await res.json()
      setRelayResult(data)
      add(data.txHash ? `✔ Tx submitted: ${data.txHash}` : '✔ Bundle accepted')
    } catch (e: any) {
      add(`✖ Relay error: ${e?.message || 'failed'}`)
    } finally {
      setSubmitLoading(false)
    }
  }

  const short = useMemo(() => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''), [address])

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">zkAuction Wallet Demo</h1>
        <p className="text-sm text-muted-foreground">
          Inspired by Ithaca EXP-0003, adapted to: Sign In → Generate ZK Proof → Submit Privately.
        </p>
      </header>

      {/* 1. Initialize an Account */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="text-lg font-medium">1. Initialize an Account</h2>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {address ? `Signed in as ${short}` : 'Register or Sign In (Porto passkey).'}
          </div>
          <Connect />
        </div>
      </section>

      {/* 2. Generate ZK Proof */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="text-lg font-medium">2. Generate ZK Proof (spent &lt; $100 this week)</h2>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">Calls backend /proof and shows the result.</div>
          <div className="flex items-center gap-2">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-xl disabled:opacity-50"
              onClick={handleGenerateProof}
              disabled={!address || proofLoading}
            >
              {proofLoading ? 'Working…' : 'Generate Proof'}
            </button>
            <button
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-xl disabled:opacity-50"
              onClick={() => setShowRawProof((s) => !s)}
              disabled={!proofResult}
            >
              {showRawProof ? 'Hide Raw' : 'Raw Response'}
            </button>
          </div>
        </div>
        {showRawProof && proofResult && (
          <pre className="mt-3 text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
{JSON.stringify(proofResult, null, 2)}
          </pre>
        )}
      </section>

      {/* 3. Submit Privately */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="text-lg font-medium">3. Submit Privately (Relayer)</h2>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">Posts to relayer /bundle with proof + inputs.</div>
          <div className="flex items-center gap-2">
            <button
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-xl disabled:opacity-50"
              onClick={handleSubmitPrivately}
              disabled={!address || !proofResult || submitLoading}
            >
              {submitLoading ? 'Working…' : 'Submit Privately'}
            </button>
            <button
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-xl disabled:opacity-50"
              onClick={() => setShowRawRelay((s) => !s)}
              disabled={!relayResult}
            >
              {showRawRelay ? 'Hide Raw' : 'Raw Response'}
            </button>
          </div>
        </div>
        {showRawRelay && relayResult && (
          <pre className="mt-3 text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
{JSON.stringify(relayResult, null, 2)}
          </pre>
        )}
      </section>

      {/* Transaction History */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="text-lg font-medium">Transaction History</h2>
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sign in to get started</div>
        ) : (
          <ul className="space-y-2">
            {logs.map((l) => (
              <li key={l.ts} className="text-sm">
                {new Date(l.ts).toLocaleTimeString()} — {l.message}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}


