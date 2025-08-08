import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from 'react';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { Connect } from '../components/connect';
import { parseEther, formatEther } from 'viem';
import { exp1Abi, exp1Address } from '../lib/contracts';
export default function App() {
    const { address } = useAccount();
    const [amount, setAmount] = useState('25');
    const [recipient, setRecipient] = useState('0x742d35Cc6634C0532925a3b8D94Bf7a2C7AC327f');
    const [proofResult, setProofResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const [spendingLimitSet, setSpendingLimitSet] = useState(false);
    const [proofGenerated, setProofGenerated] = useState(false);
    const [mintAmount, setMintAmount] = useState('100');
    const [schedules, setSchedules] = useState([]);
    const [scheduleCount, setScheduleCount] = useState(3);
    const [schedulePending, setSchedulePending] = useState(false);
    const [events, setEvents] = useState({});
    const short = useMemo(() => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''), [address]);
    const addLog = (message) => setLogs((l) => [{ ts: Date.now(), message }, ...l]);
    async function handleSetSpendingLimit() {
        addLog('Set weekly spending limit to $100');
        setSpendingLimitSet(true);
    }
    // EXP token balance (for connected address)
    const { data: balanceData, refetch: refetchBalance } = useReadContract({
        address: exp1Address,
        abi: exp1Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });
    const readableBalance = useMemo(() => {
        try {
            return balanceData ? Number(formatEther(balanceData)).toFixed(2) : '0.00';
        }
        catch {
            return '0.00';
        }
    }, [balanceData]);
    // Mint EXP to self
    const { data: mintTxHash, isPending: isMintPending, writeContract: writeMint } = useWriteContract();
    const { isSuccess: isMintConfirmed } = useWaitForTransactionReceipt({
        hash: mintTxHash,
        query: {
            enabled: !!mintTxHash,
            refetchInterval: (q) => (q.state.data ? false : 1000),
        },
    });
    async function handleMint() {
        if (!address)
            return;
        try {
            writeMint({
                address: exp1Address,
                abi: exp1Abi,
                functionName: 'mint',
                args: [address, parseEther(mintAmount || '0')],
            });
        }
        catch (e) {
            setError(e?.message || 'Mint failed');
        }
    }
    async function generateProof() {
        if (!spendingLimitSet)
            return;
        setLoading(true);
        setError(null);
        addLog('Generating ZK proof for spending limit verification…');
        try {
            const res = await fetch('http://localhost:3001/proof', { method: 'POST' });
            if (!res.ok)
                throw new Error(`Backend /proof error: ${res.status}`);
            const data = await res.json();
            setProofResult(data);
            setProofGenerated(true);
            addLog(`✔️ Proof generated: spent $${data.inputs.total_spent} this week (under $100 limit)`);
        }
        catch (e) {
            setError(e?.message || 'Proof generation failed');
            addLog(`❌ Proof generation failed: ${e?.message}`);
        }
        finally {
            setLoading(false);
        }
    }
    async function submitPrivately() {
        if (!proofResult || !proofGenerated)
            return;
        setLoading(true);
        setError(null);
        addLog('Submitting transaction privately via relayer auction…');
        try {
            const payload = {
                tx: `Transfer $${amount} to ${recipient.slice(0, 6)}…${recipient.slice(-4)}`,
                proof: proofResult.proof,
                publicInputs: proofResult.publicSignals,
            };
            const res = await fetch('http://localhost:8080/bundle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok)
                throw new Error(`Relayer /bundle error: ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data.logs)) {
                data.logs.forEach((l) => addLog(`📡 ${l}`));
            }
            if (data.txHash) {
                addLog(`✔️ Transaction confirmed: ${data.txHash}`);
            }
            else {
                addLog('✔️ Transaction submitted via private relayer');
            }
        }
        catch (e) {
            setError(e?.message || 'Private submission failed');
            addLog(`❌ Private submission failed: ${e?.message}`);
        }
        finally {
            setLoading(false);
        }
    }
    // Event debugging (window.ethereum)
    useEffect(() => {
        const provider = window.ethereum;
        if (!provider?.on)
            return;
        const makeHandler = (ev) => (payload) => setEvents((e) => ({ ...e, [ev]: payload }));
        const onAccounts = makeHandler('accountsChanged');
        const onChain = makeHandler('chainChanged');
        const onConnect = makeHandler('connect');
        const onDisconnect = makeHandler('disconnect');
        const onMessage = makeHandler('message');
        provider.on('accountsChanged', onAccounts);
        provider.on('chainChanged', onChain);
        provider.on('connect', onConnect);
        provider.on('disconnect', onDisconnect);
        provider.on('message', onMessage);
        return () => {
            provider.removeListener?.('accountsChanged', onAccounts);
            provider.removeListener?.('chainChanged', onChain);
            provider.removeListener?.('connect', onConnect);
            provider.removeListener?.('disconnect', onDisconnect);
            provider.removeListener?.('message', onMessage);
        };
    }, []);
    // Local scheduler that runs every 10s for N times: generate proof → submit to relayer
    function scheduleWorkflow(count) {
        if (!address)
            return;
        setSchedulePending(true);
        const id = window.setInterval(async () => {
            try {
                const res = await fetch('http://localhost:3001/proof', { method: 'POST' });
                if (!res.ok)
                    throw new Error(`Backend /proof error: ${res.status}`);
                const data = await res.json();
                const payload = {
                    tx: `Scheduled transfer 1 EXP @ ${new Date().toLocaleTimeString()}`,
                    proof: data.proof,
                    publicInputs: data.publicSignals,
                };
                const rel = await fetch('http://localhost:8080/bundle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!rel.ok)
                    throw new Error(`Relayer /bundle error: ${rel.status}`);
                const rr = await rel.json();
                addLog(rr.txHash ? `✔️ Scheduled tx: ${rr.txHash}` : '✔️ Scheduled bundle accepted');
            }
            catch (e) {
                addLog(`❌ Scheduled submit failed: ${e?.message || 'failed'}`);
            }
        }, 10000);
        setSchedules((s) => [...s, id]);
        // Clear after N runs
        let runs = 0;
        const stopper = window.setInterval(() => {
            runs += 1;
            if (runs >= count) {
                window.clearInterval(id);
                window.clearInterval(stopper);
                setSchedules((s) => s.filter((x) => x !== id));
                setSchedulePending(false);
            }
        }, 10000);
    }
    return (_jsxs("div", { className: "mx-auto max-w-4xl p-6 space-y-8 font-mono", children: [_jsxs("header", { className: "space-y-2", children: [_jsx("h1", { className: "text-3xl font-semibold", children: "zkAuction Wallet" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Prove spending limits privately. Submit transactions via auction-based relayer." })] }), _jsxs("section", { className: "rounded-xl border p-5 space-y-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "1. Connect Your Wallet" }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("div", { className: "text-sm text-muted-foreground", children: address ? `Connected as ${short}` : 'Connect your wallet to continue.' }), _jsx(Connect, {})] })] }), _jsxs("section", { className: "rounded-xl border p-5 space-y-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "2. Set Spending Limit" }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("div", { className: "text-sm text-muted-foreground", children: "Configure weekly spending limit for privacy-preserving verification." }), _jsx("button", { className: "bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-xl disabled:opacity-50", onClick: handleSetSpendingLimit, disabled: !address || spendingLimitSet, children: spendingLimitSet ? 'Limit Set ($100/week)' : 'Set $100/week Limit' })] })] }), _jsxs("section", { className: "rounded-xl border p-5 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "Fund Wallet (EXP)" }), _jsxs("div", { className: "text-sm text-muted-foreground", children: ["Balance: ", readableBalance, " EXP"] })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-[1fr_auto_auto]", children: [_jsx("input", { className: "w-full px-3 py-2 border rounded-lg bg-background", value: mintAmount, onChange: (e) => setMintAmount(e.target.value), placeholder: "100" }), _jsx("button", { className: "bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-xl disabled:opacity-50", onClick: handleMint, disabled: !address || isMintPending, children: isMintPending ? 'Minting…' : 'Mint EXP' }), isMintConfirmed && (_jsx("span", { className: "text-green-600 text-sm self-center", children: "Confirmed" }))] })] }), _jsxs("section", { className: "rounded-xl border p-5 space-y-4", children: [_jsx("h2", { className: "text-lg font-medium", children: "3. Create Private Transaction" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Amount (USD)" }), _jsx("input", { value: amount, onChange: (e) => setAmount(e.target.value), className: "w-full px-3 py-2 border rounded-lg bg-background", placeholder: "Enter amount" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Recipient" }), _jsx("input", { value: recipient, onChange: (e) => setRecipient(e.target.value), className: "w-full px-3 py-2 border rounded-lg bg-background", placeholder: "0x..." })] })] }), _jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [_jsx("button", { className: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl disabled:opacity-50", onClick: generateProof, disabled: !spendingLimitSet || loading || proofGenerated, children: loading ? 'Generating…' : proofGenerated ? 'Proof Ready' : 'Generate ZK Proof' }), _jsx("button", { className: "bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-xl disabled:opacity-50", onClick: submitPrivately, disabled: !proofGenerated || loading, children: loading ? 'Submitting…' : 'Submit Privately' })] }), _jsxs("div", { className: "text-xs text-muted-foreground space-y-1", children: [_jsx("p", { children: "\u2022 ZK proof verifies spending is under limit without revealing transaction history" }), _jsx("p", { children: "\u2022 Relayer auction provides MEV protection and privacy" })] })] }), _jsxs("section", { className: "rounded-xl border p-5 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "4. Schedule Workflow" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "(generate proof \u2192 submit privately)" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "number", min: 1, max: 6, value: scheduleCount, onChange: (e) => setScheduleCount(Number(e.target.value) || 1), className: "w-20 px-3 py-2 border rounded-lg bg-background" }), _jsx("button", { className: "bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-xl disabled:opacity-50", onClick: () => scheduleWorkflow(scheduleCount), disabled: !address || schedulePending, children: schedulePending ? 'Running…' : 'Start (every 10s)' }), schedules.length > 0 && (_jsx("button", { className: "bg-red-100 hover:bg-red-200 text-red-600 font-medium py-2 px-4 rounded-xl", onClick: () => {
                                    schedules.forEach((id) => window.clearInterval(id));
                                    setSchedules([]);
                                    setSchedulePending(false);
                                }, children: "Stop" }))] })] }), _jsxs("section", { className: "rounded-xl border p-5 space-y-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "5. Events" }), _jsx("pre", { className: "mt-2 p-2 bg-muted rounded text-xs overflow-x-auto", children: JSON.stringify(events, null, 2) })] }), proofResult && (_jsxs("section", { className: "rounded-xl border p-5 space-y-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "Proof Summary" }), _jsx("div", { className: "bg-muted p-4 rounded-lg", children: _jsxs("div", { className: "text-sm space-y-1", children: [_jsxs("p", { children: [_jsx("strong", { children: "Weekly spent:" }), " $", proofResult.inputs.total_spent] }), _jsxs("p", { children: [_jsx("strong", { children: "Week start:" }), " ", new Date(proofResult.inputs.week_start * 1000).toLocaleDateString()] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " Under $100 limit \u2714\uFE0F"] })] }) }), _jsxs("details", { className: "text-xs", children: [_jsx("summary", { className: "cursor-pointer text-muted-foreground", children: "Raw Response" }), _jsx("pre", { className: "mt-2 p-2 bg-muted rounded text-xs overflow-x-auto", children: JSON.stringify(proofResult, null, 2) })] })] })), _jsxs("section", { className: "rounded-xl border p-5 space-y-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "Transaction History" }), logs.length === 0 ? (_jsx("div", { className: "text-sm text-muted-foreground", children: "Connect your wallet to begin" })) : (_jsx("ul", { className: "space-y-2 max-h-48 overflow-y-auto", children: logs.map((log) => (_jsxs("li", { className: "text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: new Date(log.ts).toLocaleTimeString() }), ' — ', log.message] }, log.ts))) }))] }), error && (_jsxs("div", { className: "rounded-xl border border-red-200 bg-red-50 p-4 text-red-700", children: [_jsx("strong", { children: "Error:" }), " ", error] }))] }));
}
