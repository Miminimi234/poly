/**
 * BSC (Binance Smart Chain) Integration Types
 */

export interface BSCConfig {
  rpcUrl: string;
  chainId: number;
  gasPriceMultiplier: number;
  maxGasLimit: number;
  timeout: number;
}

export interface BSCWalletConfig {
  privateKey: string;
  providerUrl: string;
}

export interface BSCToken {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

export interface BSCTransaction {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: number;
  gasPrice?: string;
}

export interface BSCTransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
  blockNumber?: number;
}

// Common BSC tokens
export const BSC_TOKENS: Record<string, BSCToken> = {
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
  BNB: {
    address: '0x0000000000000000000000000000000000000000', // Native token
    symbol: 'BNB',
    decimals: 18,
    name: 'Binance Coin'
  }
};

// BSC Network Configuration
export const BSC_NETWORKS = {
  MAINNET: {
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    name: 'BSC Mainnet'
  },
  TESTNET: {
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    name: 'BSC Testnet'
  }
};

