import { createConnector } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'

export function devPortoConnector() {
  const address = (localStorage.getItem('dev.address') as `0x${string}`) ||
    ('0x000000000000000000000000000000000000dEaD' as `0x${string}`)

  const provider = {
    request: async ({ method, params }: { method: string; params?: any }) => {
      switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts':
          return [address]
        case 'eth_chainId':
          return `0x${baseSepolia.id.toString(16)}`
        case 'personal_sign':
        case 'eth_sign':
          return '0x' + '0'.repeat(130)
        default:
          return null
      }
    },
  }

  return createConnector((config) => ({
    id: 'xyz.ithaca.porto',
    name: 'Porto (Dev)',
    type: 'mock',
    async isAuthorized() {
      // Treat presence of a dev address as authorization signal
      const dev = localStorage.getItem('dev.address')
      return Boolean(dev)
    },
    async connect() {
      return {
        accounts: [address],
        chainId: baseSepolia.id,
      }
    },
    async disconnect() {
      return
    },
    async getAccounts() {
      return [address]
    },
    async getChainId() {
      return baseSepolia.id
    },
    async getProvider() {
      return provider as any
    },
    onAccountsChanged() {},
    onChainChanged() {},
    onDisconnect() {},
  }))
}


