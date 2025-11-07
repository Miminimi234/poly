/**
 * Solana Integration Types
 */

export interface SolanaConfig {
  rpcUrl: string;
  chainId: number;
  gasPriceMultiplier: number;
  maxGasLimit: number;
  timeout: number;
}

export interface SolanaWalletConfig {
  privateKey: string;
  providerUrl: string;
  chainId?: number;
}

export interface SolanaToken {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

export interface SolanaTransaction {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: number;
  gasPrice?: string;
}

export interface SolanaTransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
  blockNumber?: number;
}

// Common Solana tokens
export const SOLANA_TOKENS: Record<string, SolanaToken> = {
  USDT: {
    address: '0x55d398326f99059fF775485246999027B3197955',
    symbol: 'USDT',
    decimals: 18,
    name: 'Tether USD'
  },
  USDC: {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    symbol: 'USDC',
    decimals: 18,
    name: 'USD Coin'
  },
  SOL: {
    address: '0x0000000000000000000000000000000000000000', // Native token
    symbol: 'SOL',
    decimals: 18,
    name: 'Solana'
  }
};

// Solana Network Configuration
export const SOLANA_NETWORKS = {
  MAINNET: {
    chainId: 56,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    name: 'Solana Mainnet'
  },
  TESTNET: {
    chainId: 97,
    rpcUrl: 'https://api.testnet.solana.com',
    name: 'Solana Testnet'
  }
};
