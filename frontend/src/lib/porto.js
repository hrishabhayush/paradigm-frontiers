export async function connectPorto() {
    try {
        // Dynamic import with runtime-computed specifier to avoid Vite resolving a missing package
        const pkg = ('por' + 'to');
        // @ts-ignore - vite-ignore prevents pre-bundling/analysis
        const mod = await import(/* @vite-ignore */ pkg);
        const Porto = mod?.Porto || mod?.default?.Porto || mod?.default;
        if (!Porto)
            throw new Error('Porto SDK not found');
        const instance = await Porto.create();
        const address = instance?.account?.address || instance?.address;
        return { address };
    }
    catch {
        return {};
    }
}
