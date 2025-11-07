/**
 * Solana Wallet Integration
 * Handles wallet operations for Solana
 */

import { ethers } from 'ethers';
import {
  SOLANA_NETWORKS,
  SOLANA_TOKENS,
  SolanaConfig,
  SolanaTransaction,
  SolanaTransactionResult,
  SolanaWalletConfig
} from './types';

export class SolanaWallet {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private config: SolanaConfig;

  constructor(walletConfig: SolanaWalletConfig, config: SolanaConfig) {
    this.provider = new ethers.JsonRpcProvider(walletConfig.providerUrl);
    this.wallet = new ethers.Wallet(walletConfig.privateKey, this.provider);
    this.config = config;
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get SOL balance
   */
  async getSOLBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Get token balance (USDT, USDC, etc.)
   */
  async getTokenBalance(tokenSymbol: string): Promise<string> {
    const token = SOLANA_TOKENS[tokenSymbol];
    if (!token) {
      throw new Error(`Token ${tokenSymbol} not supported`);
    }

    // For native SOL
    if (tokenSymbol === 'SOL') {
      return this.getSOLBalance();
    }

    // For ERC20 tokens
    const contract = new ethers.Contract(
      token.address,
      [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ],
      this.provider
    );

    const balance = await contract.balanceOf(this.wallet.address);
    return ethers.formatUnits(balance, token.decimals);
  }

  /**
   * Send SOL transaction
   */
  async sendSOL(to: string, amount: string): Promise<SolanaTransactionResult> {
    try {
      const gasPrice = await this.getAdjustedGasPrice();

      const transaction: SolanaTransaction = {
        to,
        value: ethers.parseEther(amount).toString(),
        gasLimit: 21000,
        gasPrice: gasPrice.toString()
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
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send ERC20 token transaction
   */
  async sendToken(tokenSymbol: string, to: string, amount: string): Promise<SolanaTransactionResult> {
    try {
      const token = SOLANA_TOKENS[tokenSymbol];
      if (!token) {
        throw new Error(`Token ${tokenSymbol} not supported`);
      }

      const contract = new ethers.Contract(
        token.address,
        [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function decimals() view returns (uint8)'
        ],
        this.wallet
      );

      const amountWei = ethers.parseUnits(amount, token.decimals);
      const gasPrice = await this.getAdjustedGasPrice();

      const tx = await contract.transfer(to, amountWei, {
        gasPrice: gasPrice
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
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get adjusted gas price with multiplier
   */
  private async getAdjustedGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    const baseGasPrice = feeData.gasPrice || BigInt(5000000000); // 5 gwei default
    return baseGasPrice * BigInt(Math.floor(this.config.gasPriceMultiplier * 100)) / BigInt(100);
  }

  /**
   * Estimate transaction cost
   */
  async estimateTransactionCost(transaction: SolanaTransaction): Promise<string> {
    try {
      const gasPrice = await this.getAdjustedGasPrice();
      const gasLimit = transaction.gasLimit || 21000;

      const cost = gasPrice * BigInt(gasLimit);
      return ethers.formatEther(cost);
    } catch (error) {
      throw new Error(`Failed to estimate transaction cost: ${error}`);
    }
  }

  /**
   * Check if wallet has sufficient balance for transaction
   */
  async hasSufficientBalance(amount: string, tokenSymbol: string = 'SOL'): Promise<boolean> {
    try {
      const balance = await this.getTokenBalance(tokenSymbol);
      const balanceBN = BigInt(ethers.parseUnits(balance, tokenSymbol === 'SOL' ? 18 : SOLANA_TOKENS[tokenSymbol].decimals));
      const amountBN = BigInt(ethers.parseUnits(amount, tokenSymbol === 'SOL' ? 18 : SOLANA_TOKENS[tokenSymbol].decimals));

      return balanceBN >= amountBN;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create wallet instance for testnet
   */
  static createTestnetWallet(privateKey: string): SolanaWallet {
    const walletConfig: SolanaWalletConfig = {
      privateKey,
      providerUrl: SOLANA_NETWORKS.TESTNET.rpcUrl
    };

    const config: SolanaConfig = {
      rpcUrl: SOLANA_NETWORKS.TESTNET.rpcUrl,
      chainId: SOLANA_NETWORKS.TESTNET.chainId,
      gasPriceMultiplier: 1.1,
      maxGasLimit: 300000,
      timeout: 30000
    };

    return new SolanaWallet(walletConfig, config);
  }

  /**
   * Create wallet instance for mainnet
   */
  static createMainnetWallet(privateKey: string): SolanaWallet {
    const walletConfig: SolanaWalletConfig = {
      privateKey,
      providerUrl: SOLANA_NETWORKS.MAINNET.rpcUrl
    };

    const config: SolanaConfig = {
      rpcUrl: SOLANA_NETWORKS.MAINNET.rpcUrl,
      chainId: SOLANA_NETWORKS.MAINNET.chainId,
      gasPriceMultiplier: 1.1,
      maxGasLimit: 300000,
      timeout: 30000
    };

    return new SolanaWallet(walletConfig, config);
  }
}
