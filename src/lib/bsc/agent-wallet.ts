/**
 * BSC Agent Wallet - BSC wallet management for autonomous agents
 * Handles USDT/USDC transactions and EIP-712 signing for x402 payments
 */

import { ethers } from 'ethers';
import { randomBytes } from 'crypto';
import type { BSCWalletConfig, BSCTransactionResult } from './types';

export interface BSCBalance {
  bnb: string;
  usdt: string;
  usdc: string;
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface EIP712Message {
  from: string;
  to: string;
  amount: string;
  currency: string;
  nonce: string;
  timestamp: number;
}

export class BSCAgentWallet {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private config: BSCWalletConfig;
  private nonce: number;

  // BSC token contracts
  private readonly USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
  private readonly USDC_CONTRACT = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d';

  // ERC20 ABI for token operations
  private readonly ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)'
  ];

  constructor(config: BSCWalletConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.providerUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.nonce = 0;
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get wallet configuration
   */
  getConfig(): BSCWalletConfig {
    return { ...this.config };
  }

  /**
   * Get BNB balance
   */
  async getBNBBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get BNB balance:', error);
      return '0';
    }
  }

  /**
   * Get token balance (USDT, USDC, etc.)
   */
  async getTokenBalance(tokenAddress: string): Promise<string> {
    try {
      const contract = new ethers.Contract(tokenAddress, this.ERC20_ABI, this.provider);
      const balance = await contract.balanceOf(this.wallet.address);
      const decimals = await contract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error(`Failed to get token balance for ${tokenAddress}:`, error);
      return '0';
    }
  }

  /**
   * Get all balances (BNB, USDT, USDC)
   */
  async getAllBalances(): Promise<BSCBalance> {
    const [bnb, usdt, usdc] = await Promise.all([
      this.getBNBBalance(),
      this.getTokenBalance(this.USDT_CONTRACT),
      this.getTokenBalance(this.USDC_CONTRACT)
    ]);

    return { bnb, usdt, usdc };
  }

  /**
   * Check if wallet can afford a transaction
   */
  async canAfford(amount: string, currency: string): Promise<boolean> {
    try {
      const balance = await this.getBalance(currency);
      const balanceBN = BigInt(ethers.parseUnits(balance, 18));
      const amountBN = BigInt(ethers.parseUnits(amount, 18));
      
      return balanceBN >= amountBN;
    } catch (error) {
      console.error('Failed to check affordability:', error);
      return false;
    }
  }

  /**
   * Get balance for a specific currency
   */
  async getBalance(currency: string): Promise<string> {
    switch (currency.toLowerCase()) {
      case 'bnb':
        return await this.getBNBBalance();
      case 'usdt':
        return await this.getTokenBalance(this.USDT_CONTRACT);
      case 'usdc':
        return await this.getTokenBalance(this.USDC_CONTRACT);
      default:
        throw new Error(`Unsupported currency: ${currency}`);
    }
  }

  /**
   * Transfer BNB
   */
  async transferBNB(to: string, amount: string): Promise<BSCTransactionResult> {
    try {
      const gasPrice = await this.getAdjustedGasPrice();
      const gasLimit = 21000;

      const transaction = {
        to,
        value: ethers.parseEther(amount),
        gasLimit,
        gasPrice
      };

      const tx = await this.wallet.sendTransaction(transaction);
      const receipt = await tx.wait();
      if (!receipt) {
        return {
          success: false,
          error: 'Transaction receipt not available'
        };
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'BNB transfer failed'
      };
    }
  }

  /**
   * Transfer tokens (USDT, USDC, etc.)
   */
  async transferTokens(
    amount: string,
    currency: string,
    to: string
  ): Promise<BSCTransactionResult> {
    try {
      const tokenAddress = this.getTokenAddress(currency);
      const contract = new ethers.Contract(tokenAddress, this.ERC20_ABI, this.wallet);

      const decimals = await contract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);
      const gasPrice = await this.getAdjustedGasPrice();

      const tx = await contract.transfer(to, amountWei, {
        gasPrice
      });

      const receipt = await tx.wait();
      if (!receipt) {
        return {
          success: false,
          error: 'Transaction receipt not available'
        };
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token transfer failed'
      };
    }
  }

  /**
   * Sign a message using EIP-712
   */
  async signEIP712Message(domain: EIP712Domain, message: EIP712Message): Promise<string> {
    try {
      const types = {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ],
        Message: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'string' },
          { name: 'currency', type: 'string' },
          { name: 'nonce', type: 'string' },
          { name: 'timestamp', type: 'uint256' }
        ]
      };

      const signature = await this.wallet.signTypedData(domain, types, message);
      return signature;
    } catch (error) {
      console.error('EIP-712 signing failed:', error);
      throw error;
    }
  }

  /**
   * Sign a simple message
   */
  async signMessage(message: string): Promise<string> {
    try {
      return await this.wallet.signMessage(message);
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  }

  /**
   * Verify a signature
   */
  async verifySignature(message: string, signature: string): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === this.wallet.address.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get adjusted gas price with multiplier
   */
  private async getAdjustedGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      const baseGasPrice = feeData.gasPrice || BigInt(5000000000); // 5 gwei default
      return baseGasPrice * BigInt(110) / BigInt(100); // 10% multiplier
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return BigInt(5000000000); // Fallback to 5 gwei
    }
  }

  /**
   * Get token address for currency
   */
  private getTokenAddress(currency: string): string {
    switch (currency.toLowerCase()) {
      case 'usdt':
        return this.USDT_CONTRACT;
      case 'usdc':
        return this.USDC_CONTRACT;
      default:
        throw new Error(`Unsupported currency: ${currency}`);
    }
  }

  /**
   * Estimate transaction cost
   */
  async estimateTransactionCost(
    to: string,
    amount: string,
    currency: string = 'BNB'
  ): Promise<string> {
    try {
      const gasPrice = await this.getAdjustedGasPrice();
      const gasLimit = currency === 'BNB' ? 21000 : 100000; // Higher limit for token transfers
      
      const cost = gasPrice * BigInt(gasLimit);
      return ethers.formatEther(cost);
    } catch (error) {
      console.error('Failed to estimate transaction cost:', error);
      return '0';
    }
  }

  /**
   * Get transaction history (placeholder - would need to implement with BSC API)
   */
  async getTransactionHistory(limit: number = 10): Promise<any[]> {
    // This would typically query a BSC API or indexer
    // For now, return empty array
    return [];
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<any> {
    try {
      return await this.provider.getTransaction(hash);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: string): Promise<any> {
    try {
      return await this.provider.getTransactionReceipt(hash);
    } catch (error) {
      console.error('Failed to get transaction receipt:', error);
      return null;
    }
  }

  /**
   * Create wallet for testnet
   */
  static createTestnetWallet(privateKey: string): BSCAgentWallet {
    const config: BSCWalletConfig = {
      privateKey,
      providerUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      chainId: 97
    };
    return new BSCAgentWallet(config);
  }

  /**
   * Create wallet for mainnet
   */
  static createMainnetWallet(privateKey: string): BSCAgentWallet {
    const config: BSCWalletConfig = {
      privateKey,
      providerUrl: 'https://bsc-dataseed1.binance.org/',
      chainId: 56
    };
    return new BSCAgentWallet(config);
  }

  /**
   * Generate a new wallet
   */
  static generateWallet(): { wallet: BSCAgentWallet; privateKey: string } {
    const randomWallet = ethers.Wallet.createRandom();
    const wallet = new BSCAgentWallet({
      privateKey: randomWallet.privateKey,
      providerUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      chainId: 97
    });
    return { wallet, privateKey: randomWallet.privateKey };
  }

  /**
   * Create EIP-712 domain for x402 payments
   */
  createEIP712Domain(): EIP712Domain {
    const chainId = this.config.chainId ?? 56;
    return {
      name: 'x402-payment',
      version: '1',
      chainId,
      verifyingContract: '0x0000000000000000000000000000000000000000' // Placeholder
    };
  }

  /**
   * Create EIP-712 message for x402 payments
   */
  createEIP712Message(
    to: string,
    amount: string,
    currency: string
  ): EIP712Message {
    return {
      from: this.wallet.address,
      to,
      amount,
      currency,
      nonce: randomBytes(16).toString('hex'),
      timestamp: Date.now()
    };
  }
}
