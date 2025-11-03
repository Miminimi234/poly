/**
 * BSC Wallet Integration
 * Handles wallet operations for Binance Smart Chain
 */

import { ethers } from 'ethers';
import { 
  BSCConfig, 
  BSCWalletConfig, 
  BSCTransaction, 
  BSCTransactionResult,
  BSC_TOKENS,
  BSC_NETWORKS 
} from './types';

export class BSCWallet {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private config: BSCConfig;

  constructor(walletConfig: BSCWalletConfig, config: BSCConfig) {
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
   * Get BNB balance
   */
  async getBNBBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Get token balance (USDT, USDC, etc.)
   */
  async getTokenBalance(tokenSymbol: string): Promise<string> {
    const token = BSC_TOKENS[tokenSymbol];
    if (!token) {
      throw new Error(`Token ${tokenSymbol} not supported`);
    }

    // For native BNB
    if (token.address === '0x0000000000000000000000000000000000000000') {
      return this.getBNBBalance();
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
   * Send BNB transaction
   */
  async sendBNB(to: string, amount: string): Promise<BSCTransactionResult> {
    try {
      const gasPrice = await this.getAdjustedGasPrice();
      
      const transaction: BSCTransaction = {
        to,
        value: ethers.parseEther(amount).toString(),
        gasLimit: 21000,
        gasPrice: gasPrice.toString()
      };

      const tx = await this.wallet.sendTransaction(transaction);
      const receipt = await tx.wait();

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
  async sendToken(tokenSymbol: string, to: string, amount: string): Promise<BSCTransactionResult> {
    try {
      const token = BSC_TOKENS[tokenSymbol];
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
  async estimateTransactionCost(transaction: BSCTransaction): Promise<string> {
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
  async hasSufficientBalance(amount: string, tokenSymbol: string = 'BNB'): Promise<boolean> {
    try {
      const balance = await this.getTokenBalance(tokenSymbol);
      const balanceBN = BigInt(ethers.parseUnits(balance, tokenSymbol === 'BNB' ? 18 : BSC_TOKENS[tokenSymbol].decimals));
      const amountBN = BigInt(ethers.parseUnits(amount, tokenSymbol === 'BNB' ? 18 : BSC_TOKENS[tokenSymbol].decimals));
      
      return balanceBN >= amountBN;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create wallet instance for testnet
   */
  static createTestnetWallet(privateKey: string): BSCWallet {
    const walletConfig: BSCWalletConfig = {
      privateKey,
      providerUrl: BSC_NETWORKS.TESTNET.rpcUrl
    };

    const config: BSCConfig = {
      rpcUrl: BSC_NETWORKS.TESTNET.rpcUrl,
      chainId: BSC_NETWORKS.TESTNET.chainId,
      gasPriceMultiplier: 1.1,
      maxGasLimit: 300000,
      timeout: 30000
    };

    return new BSCWallet(walletConfig, config);
  }

  /**
   * Create wallet instance for mainnet
   */
  static createMainnetWallet(privateKey: string): BSCWallet {
    const walletConfig: BSCWalletConfig = {
      privateKey,
      providerUrl: BSC_NETWORKS.MAINNET.rpcUrl
    };

    const config: BSCConfig = {
      rpcUrl: BSC_NETWORKS.MAINNET.rpcUrl,
      chainId: BSC_NETWORKS.MAINNET.chainId,
      gasPriceMultiplier: 1.1,
      maxGasLimit: 300000,
      timeout: 30000
    };

    return new BSCWallet(walletConfig, config);
  }
}

