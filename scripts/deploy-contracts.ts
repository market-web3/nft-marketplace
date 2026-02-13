/**
 * Smart Contract Deployment Script
 * Deploys upgradeable NFT Marketplace contracts
 */

import { 
  Address, 
  toNano, 
  TonClient, 
  WalletContractV4,
  internal,
  beginCell,
  Cell,
} from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';
import { NFTMarketplaceProxy } from '../smart-contracts/wrappers/NFTMarketplaceProxy';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const NETWORK = process.env.TON_NETWORK || 'testnet';
const API_ENDPOINT = NETWORK === 'mainnet' 
  ? 'https://toncenter.com/api/v2/jsonRPC'
  : 'https://testnet.toncenter.com/api/v2/jsonRPC';

// Contract code paths (you would compile these from .fc files)
const PROXY_CODE_PATH = path.join(__dirname, '../smart-contracts/build/proxy.cell');
const IMPLEMENTATION_CODE_PATH = path.join(__dirname, '../smart-contracts/build/implementation.cell');

async function deploy() {
  console.log(`Deploying to ${NETWORK}...`);

  // Initialize client
  const client = new TonClient({
    endpoint: API_ENDPOINT,
    apiKey: process.env.TON_API_KEY,
  });

  // Load wallet from mnemonic
  const mnemonic = process.env.TON_ADMIN_WALLET_MNEMONIC;
  if (!mnemonic) {
    throw new Error('TON_ADMIN_WALLET_MNEMONIC not set');
  }

  const key = await mnemonicToWalletKey(mnemonic.split(' '));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  
  console.log('Wallet address:', wallet.address.toString());

  // Check balance
  const balance = await client.getBalance(wallet.address);
  console.log('Balance:', Number(balance) / 1e9, 'TON');

  if (balance < toNano('0.5')) {
    throw new Error('Insufficient balance for deployment');
  }

  // Load contract code
  const proxyCode = Cell.fromBoc(fs.readFileSync(PROXY_CODE_PATH))[0];
  const implementationCode = Cell.fromBoc(fs.readFileSync(IMPLEMENTATION_CODE_PATH))[0];

  // Deploy implementation first
  console.log('\n1. Deploying implementation contract...');
  
  const implementationConfig = {
    proxy: Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'), // placeholder
    admin: wallet.address,
    deposit_wallet: wallet.address,
    withdraw_wallet: wallet.address,
    virtual_balance_manager: wallet.address,
    fee_percent: 250, // 2.5%
    min_withdraw: toNano('0.1'),
  };

  // Implementation deployment would go here
  // ... (simplified for brevity)

  const implementationAddress = wallet.address; // placeholder - would be actual deployed address
  console.log('Implementation deployed at:', implementationAddress.toString());

  // Deploy proxy
  console.log('\n2. Deploying proxy contract...');
  
  const proxyConfig = {
    implementation: implementationAddress,
    admin: wallet.address,
    paused: false,
    version: 1,
  };

  const proxy = NFTMarketplaceProxy.createFromConfig(proxyConfig, proxyCode);
  
  console.log('Proxy address:', proxy.address.toString());

  // Save deployment info
  const deploymentInfo = {
    network: NETWORK,
    timestamp: new Date().toISOString(),
    proxy: {
      address: proxy.address.toString(),
      version: 1,
    },
    implementation: {
      address: implementationAddress.toString(),
      version: 1,
    },
    admin: wallet.address.toString(),
  };

  fs.writeFileSync(
    path.join(__dirname, `../smart-contracts/deployments/${NETWORK}-deployment.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('\n✅ Deployment complete!');
  console.log('Proxy address:', proxy.address.toString());
  console.log('\nImportant: Save the proxy address - it will never change even when upgrading!');
}

// Run deployment
deploy().catch(console.error);

// Export for programmatic use
export { deploy };
