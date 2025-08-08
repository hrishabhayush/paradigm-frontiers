"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { WagmiProvider, createConfig, http } from "wagmi";
import { devPortoConnector } from "./devPortoConnector";
import { baseSepolia } from "wagmi/chains";
const queryClient = new QueryClient();
export function Providers({ children }) {
    const [config, setConfig] = useState(null);
    useEffect(() => {
        (async () => {
            // Build the module ids dynamically so Vite doesn't try to pre-resolve them.
            const id = ['p', 'o', 'r', 't', 'o'].join('');
            const wagmiId = id + '/wagmi';
            try {
                const ui = await import(/* @vite-ignore */ id).catch(() => null);
                const mod = await import(/* @vite-ignore */ wagmiId).catch(() => null);
                if (ui && mod) {
                    const { Dialog, Mode } = ui;
                    const { porto } = mod;
                    const live = createConfig({
                        chains: [baseSepolia],
                        connectors: [
                            porto({ mode: Mode.dialog({ renderer: Dialog.popup() }) }),
                            devPortoConnector(),
                        ],
                        transports: { [baseSepolia.id]: http() },
                    });
                    setConfig(live);
                    return;
                }
            }
            catch { }
            // Fallback: run without connectors if Porto SDK cannot be loaded at runtime.
            const fallback = createConfig({
                chains: [baseSepolia],
                connectors: [devPortoConnector()],
                transports: { [baseSepolia.id]: http() },
            });
            setConfig(fallback);
        })();
    }, []);
    if (!config)
        return null;
    return (_jsx(WagmiProvider, { config: config, children: _jsxs(QueryClientProvider, { client: queryClient, children: [children, _jsx(Toaster, {})] }) }));
}
