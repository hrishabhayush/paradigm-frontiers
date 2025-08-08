export type PortoConnectResult = {
  address?: string
}

export async function connectPorto(): Promise<PortoConnectResult> {
  try {
    // Dynamic import with runtime-computed specifier to avoid Vite resolving a missing package
    const pkg = ('por' + 'to') as string
    // @ts-ignore - vite-ignore prevents pre-bundling/analysis
    const mod: any = await import(/* @vite-ignore */ pkg)
    const Porto = mod?.Porto || mod?.default?.Porto || mod?.default
    if (!Porto) throw new Error('Porto SDK not found')
    const instance = await Porto.create()
    const address: string | undefined = instance?.account?.address || instance?.address
    return { address }
  } catch {
    return {}
  }
}


