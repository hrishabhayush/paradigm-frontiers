"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { WagmiProvider, createConfig, http } from "wagmi";
import { devPortoConnector } from "./devPortoConnector";
import { baseSepolia } from "wagmi/chains";

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    (async () => {
      // Build the module ids dynamically so Vite doesn't try to pre-resolve them.
      const id = (['p','o','r','t','o'] as const).join('')
      const wagmiId = id + '/wagmi'
      try {
        const ui: any = await import(/* @vite-ignore */ (id as any)).catch(() => null)
        const mod: any = await import(/* @vite-ignore */ (wagmiId as any)).catch(() => null)
        if (ui && mod) {
          const { Dialog, Mode } = ui
          const { porto } = mod
          const live = createConfig({
            chains: [baseSepolia],
            connectors: [
              porto({ mode: Mode.dialog({ renderer: Dialog.popup() }) }),
              devPortoConnector(),
            ],
            transports: { [baseSepolia.id]: http() },
          })
          setConfig(live)
          return
        }
      } catch {}

      // Fallback: run without connectors if Porto SDK cannot be loaded at runtime.
      const fallback = createConfig({
        chains: [baseSepolia],
        connectors: [devPortoConnector()],
        transports: { [baseSepolia.id]: http() },
      })
      setConfig(fallback)
    })()
  }, [])

  if (!config) return null;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
