/**
 * Deploy Marketplace Contract
 */

import { beginCell, toNano, Cell, Address } from '@ton/core';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';
import { NFTMarketplace, MarketplaceConfig } from '../wrappers/NFTMarketplace';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function deploy() {
  // Validate environment
  const mnemonic = process.env.TON_ADMIN_WALLET_MNEMONIC;
  if (!mnemonic) {
    throw new Error('TON_ADMIN_WALLET_MNEMONIC not set');
  }

  const network = process.env.TON_NETWORK || 'testnet';
  const endpoint = network === 'mainnet' 
    ? 'https://toncenter.com/api/v2/jsonRPC'
    : 'https://testnet.toncenter.com/api/v2/jsonRPC';

  // Initialize client
  const client = new TonClient({
    endpoint,
    apiKey: process.env.TON_API_KEY,
  });

  // Load wallet
  const key = await mnemonicToWalletKey(mnemonic.split(' '));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  const walletContract = client.open(wallet);

  console.log('Deployer wallet:', wallet.address.toString());

  // Check balance
  const balance = await walletContract.getBalance();
  console.log('Wallet balance:', balance.toString(), 'nanoTON');

  if (balance < toNano('1')) {
    throw new Error('Insufficient balance for deployment');
  }

  // Load compiled contract code
  const codePath = path.join(__dirname, '../build/nft_marketplace.cell');
  if (!fs.existsSync(codePath)) {
    throw new Error('Contract code not found. Run npm run build first.');
  }

  const code = Cell.fromBoc(fs.readFileSync(codePath))[0];

  // Configure marketplace
  const config: MarketplaceConfig = {
    adminAddress: wallet.address,
    depositWallet: wallet.address,
    withdrawWallet: wallet.address,
    virtualBalanceManager: wallet.address,
    marketplaceFeePercent: parseInt(process.env.MARKETPLACE_FEE_PERCENT || '250'),
    minWithdrawAmount: toNano('0.1'),
    isPaused: false,
  };

  // Create contract instance
  const marketplace = NFTMarketplace.createFromConfig(config, code);

  console.log('Marketplace address:', marketplace.address.toString());
  console.log('Network:', network);

  // Check if contract already deployed
  const existing = await client.getContractState(marketplace.address);
  if (existing.state.type === 'active') {
    console.log('Contract already deployed!');
    return;
  }

  // Deploy contract
  console.log('Deploying contract...');

  const seqno = await walletContract.getSeqno();
  
  await walletContract.sendTransfer({
    seqno,
    secretKey: key.secretKey,
    messages: [
      {
        info: {
          type: 'internal',
          dest: marketplace.address,
          value: { coins: toNano('0.5') },
          bounce: false,
        },
        init: marketplace.init,
        body: beginCell().endCell(),
      },
    ],
  });

  console.log('Deployment transaction sent!');
  console.log('Waiting for confirmation...');

  // Wait for deployment
  let attempts = 0;
  while (attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const state = await client.getContractState(marketplace.address);
    if (state.state.type === 'active') {
      console.log('Contract deployed successfully!');
      console.log('Contract address:', marketplace.address.toString());
      
      // Save deployment info
      const deploymentInfo = {
        network,
        address: marketplace.address.toString(),
        deployedAt: new Date().toISOString(),
        admin: wallet.address.toString(),
        feePercent: config.marketplaceFeePercent,
      };
      
      fs.writeFileSync(
        path.join(__dirname, '../deployment.json'),
        JSON.stringify(deploymentInfo, null, 2)
      );
      
      return;
    }
    
    attempts++;
    console.log(`Waiting... (${attempts}/30)`);
  }

  throw new Error('Deployment confirmation timeout');
}

deploy().catch(console.error);
