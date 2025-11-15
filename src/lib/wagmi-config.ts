import { createConfig, http } from 'wagmi'
import { polygon } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [polygon],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Polysentience',
        url: 'https://Polysentience.app',
        iconUrl: '/polymarket.png',
      },
    }),
    injected({
      target: 'metaMask',
    }),
    injected(), // fallback for any injected wallet
  ],
  transports: {
    [polygon.id]: http('https://polygon-rpc.com'),
  },
})