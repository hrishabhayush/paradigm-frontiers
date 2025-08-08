import { Value } from 'ox'
import { baseSepolia } from 'wagmi/chains'
import { exp1Address } from './contracts'

export const permissions = () =>
  ({
    expiry: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    permissions: {
      calls: [{ to: exp1Address as any }],
      spend: [
        {
          limit: Value.fromEther('100'),
          period: 'hour',
          token: exp1Address as any,
        },
      ],
    },
  }) as const
