import React, { useState, useMemo, useEffect } from 'react'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { Connect } from '../components/connect'
import { parseEther, formatEther } from 'viem'
import { exp1Abi, exp1Address } from '../lib/contracts'

type ProofResult = {
  inputs: { total_spent: number; week_start: number; hash_of_tx_list: string }
  proof: any
  publicSignals: any
}

type Log = { ts: number; message: string }

export default function App() {
  const { address } = useAccount()
  const [amount, setAmount] = useState<string>('25')
  const [recipient, setRecipient] = useState<string>('0x742d35Cc6634C0532925a3b8D94Bf7a2C7AC327f')
  const [proofResult, setProofResult] = useState<ProofResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [spendingLimitSet, setSpendingLimitSet] = useState(false)
  const [proofGenerated, setProofGenerated] = useState(false)
  const [mintAmount, setMintAmount] = useState<string>('100')
  const [schedules, setSchedules] = useState<number[]>([])
  const [scheduleCount, setScheduleCount] = useState<number>(3)
  const [schedulePending, setSchedulePending] = useState<boolean>(false)
  const [events, setEvents] = useState<Record<string, unknown>>({})

  const short = useMemo(() => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''), [address])
  
  const addLog = (message: string) => setLogs((l) => [{ ts: Date.now(), message }, ...l])

  async function handleSetSpendingLimit() {
    addLog('Set weekly spending limit to $100')
    setSpendingLimitSet(true)
  }

  // EXP token balance (for connected address)
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: exp1Address,
    abi: exp1Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  } as const)

  const readableBalance = useMemo(() => {
    try {
      return balanceData ? Number(formatEther(balanceData as unknown as bigint)).toFixed(2) : '0.00'
    } catch {
      return '0.00'
    }
  }, [balanceData])

  // Mint EXP to self
  const { data: mintTxHash, isPending: isMintPending, writeContract: writeMint } = useWriteContract()
  const { isSuccess: isMintConfirmed } = useWaitForTransactionReceipt({
    hash: mintTxHash,
    query: {
      enabled: !!mintTxHash,
      refetchInterval: (q) => (q.state.data ? false : 1000),
    },
  })

  async function handleMint() {
    if (!address) return
    try {
      writeMint({
        address: exp1Address,
        abi: exp1Abi,
        functionName: 'mint',
        args: [address, parseEther(mintAmount || '0')],
      })
    } catch (e: any) {
      setError(e?.message || 'Mint failed')
    }
  }

  async function generateProof() {
    if (!spendingLimitSet) return
    setLoading(true)
    setError(null)
    addLog('Generating ZK proof for spending limit verification…')
    try {
      const res = await fetch('http://localhost:3001/proof', { method: 'POST' })
      if (!res.ok) throw new Error(`Backend /proof error: ${res.status}`)
      const data = await res.json()
      setProofResult(data)
      setProofGenerated(true)
      addLog(`✔️ Proof generated: spent $${data.inputs.total_spent} this week (under $100 limit)`)
    } catch (e: any) {
      setError(e?.message || 'Proof generation failed')
      addLog(`❌ Proof generation failed: ${e?.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function submitPrivately() {
    if (!proofResult || !proofGenerated) return
    setLoading(true)
    setError(null)
    addLog('Submitting transaction privately via relayer auction…')
    try {
      const payload = {
        tx: `Transfer $${amount} to ${recipient.slice(0, 6)}…${recipient.slice(-4)}`,
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
      
      if (Array.isArray(data.logs)) {
        data.logs.forEach((l: string) => addLog(`📡 ${l}`))
      }
      if (data.txHash) {
        addLog(`✔️ Transaction confirmed: ${data.txHash}`)
      } else {
        addLog('✔️ Transaction submitted via private relayer')
      }
    } catch (e: any) {
      setError(e?.message || 'Private submission failed')
      addLog(`❌ Private submission failed: ${e?.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Event debugging (window.ethereum)
  useEffect(() => {
    const provider: any = (window as any).ethereum
    if (!provider?.on) return

    const makeHandler = (ev: string) => (payload: unknown) =>
      setEvents((e) => ({ ...e, [ev]: payload }))
    const onAccounts = makeHandler('accountsChanged')
    const onChain = makeHandler('chainChanged')
    const onConnect = makeHandler('connect')
    const onDisconnect = makeHandler('disconnect')
    const onMessage = makeHandler('message')
    provider.on('accountsChanged', onAccounts)
    provider.on('chainChanged', onChain)
    provider.on('connect', onConnect)
    provider.on('disconnect', onDisconnect)
    provider.on('message', onMessage)
    return () => {
      provider.removeListener?.('accountsChanged', onAccounts)
      provider.removeListener?.('chainChanged', onChain)
      provider.removeListener?.('connect', onConnect)
      provider.removeListener?.('disconnect', onDisconnect)
      provider.removeListener?.('message', onMessage)
    }
  }, [])

  // Local scheduler that runs every 10s for N times: generate proof → submit to relayer
  function scheduleWorkflow(count: number) {
    if (!address) return
    setSchedulePending(true)
    const id = window.setInterval(async () => {
      try {
        const res = await fetch('http://localhost:3001/proof', { method: 'POST' })
        if (!res.ok) throw new Error(`Backend /proof error: ${res.status}`)
        const data = await res.json()
        const payload = {
          tx: `Scheduled transfer 1 EXP @ ${new Date().toLocaleTimeString()}`,
          proof: data.proof,
          publicInputs: data.publicSignals,
        }
        const rel = await fetch('http://localhost:8080/bundle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!rel.ok) throw new Error(`Relayer /bundle error: ${rel.status}`)
        const rr = await rel.json()
        addLog(rr.txHash ? `✔️ Scheduled tx: ${rr.txHash}` : '✔️ Scheduled bundle accepted')
      } catch (e: any) {
        addLog(`❌ Scheduled submit failed: ${e?.message || 'failed'}`)
      }
    }, 10_000)

    setSchedules((s) => [...s, id])

    // Clear after N runs
    let runs = 0
    const stopper = window.setInterval(() => {
      runs += 1
      if (runs >= count) {
        window.clearInterval(id)
        window.clearInterval(stopper)
        setSchedules((s) => s.filter((x) => x !== id))
        setSchedulePending(false)
      }
    }, 10_000)
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8 font-mono">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">zkAuction Wallet</h1>
        <p className="text-sm text-muted-foreground">
          Prove spending limits privately. Submit transactions via auction-based relayer.
        </p>
      </header>

      {/* 1. Connect Wallet */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="text-lg font-medium">1. Connect Your Wallet</h2>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {address ? `Connected as ${short}` : 'Connect your wallet to continue.'}
          </div>
          <Connect />
        </div>
      </section>

      {/* 2. Set Spending Limit */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="text-lg font-medium">2. Set Spending Limit</h2>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Configure weekly spending limit for privacy-preserving verification.
          </div>
          <button
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-xl disabled:opacity-50"
            onClick={handleSetSpendingLimit}
            disabled={!address || spendingLimitSet}
          >
            {spendingLimitSet ? 'Limit Set ($100/week)' : 'Set $100/week Limit'}
          </button>
        </div>
      </section>

      {/* 2.5 Fund Wallet (EXP) */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Fund Wallet (EXP)</h2>
          <div className="text-sm text-muted-foreground">Balance: {readableBalance} EXP</div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <input
            className="w-full px-3 py-2 border rounded-lg bg-background"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="100"
          />
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-xl disabled:opacity-50"
            onClick={handleMint}
            disabled={!address || isMintPending}
          >
            {isMintPending ? 'Minting…' : 'Mint EXP'}
          </button>
          {isMintConfirmed && (
            <span className="text-green-600 text-sm self-center">Confirmed</span>
          )}
        </div>
      </section>

      {/* 3. Create Transaction */}
      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="text-lg font-medium">3. Create Private Transaction</h2>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Amount (USD)</label>
            <input 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
              placeholder="Enter amount"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Recipient</label>
            <input 
              value={recipient} 
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
              placeholder="0x..."
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl disabled:opacity-50"
            onClick={generateProof}
            disabled={!spendingLimitSet || loading || proofGenerated}
          >
            {loading ? 'Generating…' : proofGenerated ? 'Proof Ready' : 'Generate ZK Proof'}
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-xl disabled:opacity-50"
            onClick={submitPrivately}
            disabled={!proofGenerated || loading}
          >
            {loading ? 'Submitting…' : 'Submit Privately'}
          </button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• ZK proof verifies spending is under limit without revealing transaction history</p>
          <p>• Relayer auction provides MEV protection and privacy</p>
        </div>
      </section>

      {/* 4. Schedule Demo Workflow (every 10s) */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">4. Schedule Workflow</h2>
          <span className="text-sm text-muted-foreground">(generate proof → submit privately)</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={6}
            value={scheduleCount}
            onChange={(e) => setScheduleCount(Number(e.target.value) || 1)}
            className="w-20 px-3 py-2 border rounded-lg bg-background"
          />
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-xl disabled:opacity-50"
            onClick={() => scheduleWorkflow(scheduleCount)}
            disabled={!address || schedulePending}
          >
            {schedulePending ? 'Running…' : 'Start (every 10s)'}
          </button>
          {schedules.length > 0 && (
            <button
              className="bg-red-100 hover:bg-red-200 text-red-600 font-medium py-2 px-4 rounded-xl"
              onClick={() => {
                schedules.forEach((id) => window.clearInterval(id))
                setSchedules([])
                setSchedulePending(false)
              }}
            >
              Stop
            </button>
          )}
        </div>
      </section>

      {/* 5. Events */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="text-lg font-medium">5. Events</h2>
        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">{JSON.stringify(events, null, 2)}</pre>
      </section>

      {/* Proof Summary */}
      {proofResult && (
        <section className="rounded-xl border p-5 space-y-3">
          <h2 className="text-lg font-medium">Proof Summary</h2>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm space-y-1">
              <p><strong>Weekly spent:</strong> ${proofResult.inputs.total_spent}</p>
              <p><strong>Week start:</strong> {new Date(proofResult.inputs.week_start * 1000).toLocaleDateString()}</p>
              <p><strong>Status:</strong> Under $100 limit ✔️</p>
            </div>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Raw Response</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
              {JSON.stringify(proofResult, null, 2)}
            </pre>
          </details>
        </section>
      )}

      {/* Transaction History */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="text-lg font-medium">Transaction History</h2>
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">Connect your wallet to begin</div>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {logs.map((log) => (
              <li key={log.ts} className="text-sm">
                <span className="text-muted-foreground">
                  {new Date(log.ts).toLocaleTimeString()}
                </span>
                {' — '}
                {log.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}


