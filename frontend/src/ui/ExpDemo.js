import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { Connect } from '../components/connect';
export function ExpDemo() {
    const { address } = useAccount();
    const [logs, setLogs] = useState([]);
    const [proofLoading, setProofLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [proofResult, setProofResult] = useState(null);
    const [relayResult, setRelayResult] = useState(null);
    const [showRawProof, setShowRawProof] = useState(false);
    const [showRawRelay, setShowRawRelay] = useState(false);
    const add = (message) => setLogs((l) => [{ ts: Date.now(), message }, ...l]);
    async function handleGenerateProof() {
        setProofLoading(true);
        setShowRawProof(false);
        add('Generating ZK proof (< $100 weekly)');
        try {
            const res = await fetch('http://localhost:3001/proof', { method: 'POST' });
            if (!res.ok)
                throw new Error(`/proof ${res.status}`);
            const data = await res.json();
            setProofResult(data);
            add('✔ Proof generated');
        }
        catch (e) {
            add(`✖ Proof error: ${e?.message || 'failed'}`);
        }
        finally {
            setProofLoading(false);
        }
    }
    async function handleSubmitPrivately() {
        if (!proofResult)
            return;
        setSubmitLoading(true);
        setShowRawRelay(false);
        add('Submitting privately via relayer');
        try {
            const payload = {
                tx: '0xdead',
                proof: proofResult.proof,
                publicInputs: proofResult.publicSignals,
            };
            const res = await fetch('http://localhost:8080/bundle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok)
                throw new Error(`/bundle ${res.status}`);
            const data = await res.json();
            setRelayResult(data);
            add(data.txHash ? `✔ Tx submitted: ${data.txHash}` : '✔ Bundle accepted');
        }
        catch (e) {
            add(`✖ Relay error: ${e?.message || 'failed'}`);
        }
        finally {
            setSubmitLoading(false);
        }
    }
    const short = useMemo(() => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''), [address]);
    return (_jsxs("div", { className: "mx-auto max-w-3xl p-6 space-y-8", children: [_jsxs("header", { className: "space-y-2", children: [_jsx("h1", { className: "text-3xl font-semibold", children: "zkAuction Wallet Demo" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Inspired by Ithaca EXP-0003, adapted to: Sign In \u2192 Generate ZK Proof \u2192 Submit Privately." })] }), _jsxs("section", { className: "rounded-xl border p-5 space-y-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "1. Initialize an Account" }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("div", { className: "text-sm text-muted-foreground", children: address ? `Signed in as ${short}` : 'Register or Sign In (Porto passkey).' }), _jsx(Connect, {})] })] }), _jsxs("section", { className: "rounded-xl border p-5 space-y-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "2. Generate ZK Proof (spent < $100 this week)" }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("div", { className: "text-sm text-muted-foreground", children: "Calls backend /proof and shows the result." }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-xl disabled:opacity-50", onClick: handleGenerateProof, disabled: !address || proofLoading, children: proofLoading ? 'Working…' : 'Generate Proof' }), _jsx("button", { className: "bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-xl disabled:opacity-50", onClick: () => setShowRawProof((s) => !s), disabled: !proofResult, children: showRawProof ? 'Hide Raw' : 'Raw Response' })] })] }), showRawProof && proofResult && (_jsx("pre", { className: "mt-3 text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto", children: JSON.stringify(proofResult, null, 2) }))] }), _jsxs("section", { className: "rounded-xl border p-5 space-y-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "3. Submit Privately (Relayer)" }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("div", { className: "text-sm text-muted-foreground", children: "Posts to relayer /bundle with proof + inputs." }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-xl disabled:opacity-50", onClick: handleSubmitPrivately, disabled: !address || !proofResult || submitLoading, children: submitLoading ? 'Working…' : 'Submit Privately' }), _jsx("button", { className: "bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-xl disabled:opacity-50", onClick: () => setShowRawRelay((s) => !s), disabled: !relayResult, children: showRawRelay ? 'Hide Raw' : 'Raw Response' })] })] }), showRawRelay && relayResult && (_jsx("pre", { className: "mt-3 text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto", children: JSON.stringify(relayResult, null, 2) }))] }), _jsxs("section", { className: "rounded-xl border p-5 space-y-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "Transaction History" }), logs.length === 0 ? (_jsx("div", { className: "text-sm text-muted-foreground", children: "Sign in to get started" })) : (_jsx("ul", { className: "space-y-2", children: logs.map((l) => (_jsxs("li", { className: "text-sm", children: [new Date(l.ts).toLocaleTimeString(), " \u2014 ", l.message] }, l.ts))) }))] })] }));
}
