import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useConnect, useConnectors } from 'wagmi';
export function Connect() {
    const { connect } = useConnect();
    const connectors = useConnectors();
    return (_jsx("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: connectors?.map((connector) => (_jsxs("button", { onClick: () => connect({ connector }), children: ["Connect (", connector.name, ")"] }, connector.uid))) }));
}
