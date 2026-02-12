/**
 * Contract Deployment Script
 * Deploys all smart contracts to TON blockchain
 */

import { TonClient, WalletContractV4, internal, toNano, Address } from '@ton/ton';
import { mnemonicNew, mnemonicToWalletKey } from '@ton/crypto';
import * as fs from 'fs';
import * as path from 'path';
import { NFTMarketplace, nftMarketplaceConfigToCell } from '../smart-contracts/wrappers/NFTMarketplace';

interface DeploymentConfig {
  network: 'mainnet' | 'testnet';
  endpoint: string;
  apiKey?: string;
}

const NETWORKS: Record<string, DeploymentConfig> = {
  testnet: {
    network: 'testnet',
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
  },
  mainnet: {
    network: 'mainnet',
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  },
};

class ContractDeployer {
  private client: TonClient;
  private wallet: WalletContractV4;
  private keyPair: any;

  constructor(config: DeploymentConfig) {
    this.client = new TonClient({
      endpoint: config.endpoint,
      apiKey: config.apiKey,
    });
  }

  async initializeWallet(mnemonic: string[]) {
    this.keyPair = await mnemonicToWalletKey(mnemonic);
    this.wallet = WalletContractV4.create({
      publicKey: this.keyPair.publicKey,
      workchain: 0,
    });
    console.log('Wallet address:', this.wallet.address.toString());
  }

  async loadCode(contractName: string): Promise<Buffer> {
    const buildPath = path.join(__dirname, '../smart-contracts/build');
    return fs.readFileSync(path.join(buildPath, `${contractName}.cell`));
  }

  async deployMarketplace(config: {
    adminAddress: Address;
    depositWallet: Address;
    withdrawWallet: Address;
    virtualBalanceManager: Address;
    feePercent: number;
    minWithdraw: bigint;
  }) {
    console.log('Deploying NFT Marketplace...');

    const code = await this.loadCode('nft_marketplace');
    const { Cell } = await import('@ton/core');
    const codeCell = Cell.fromBoc(code)[0];

    const marketplace = NFTMarketplace.createFromConfig(config, codeCell);

    const contract = this.client.open(marketplace);
    const seqno = await this.wallet.getSeqno();

    await contract.sendDeploy(
      this.wallet.sender(this.keyPair.secretKey),
      toNano('0.1')
    );

    console.log('Marketplace deployed at:', marketplace.address.toString());
    
    return marketplace.address.toString();
  }

  async createCategory(
    marketplaceAddress: Address,
    config: {
      categoryName: string;
      highloadWallet: Address;
      categoryId: bigint;
    }
  ) {
    console.log('Creating NFT category:', config.categoryName);

    const { Cell } = await import('@ton/core');
    const code = await this.loadCode('nft_marketplace');
    const codeCell = Cell.fromBoc(code)[0];

    const marketplace = NFTMarketplace.createFromAddress(marketplaceAddress);
    const contract = this.client.open(marketplace);

    await contract.sendCreateCategory(
      this.wallet.sender(this.keyPair.secretKey),
      {
        categoryName: config.categoryName,
        highloadWallet: config.highloadWallet,
        categoryId: config.categoryId,
        value: toNano('0.1'),
      }
    );

    console.log('Category created successfully');
  }

  async saveDeploymentInfo(data: any) {
    const deploymentPath = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }

    const fileName = `${data.network}-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(
      path.join(deploymentPath, fileName),
      JSON.stringify(data, null, 2)
    );
    console.log('Deployment info saved to:', fileName);
  }
}

async function main() {
  const network = process.argv[2] || 'testnet';
  const config = NETWORKS[network];

  if (!config) {
    console.error('Unknown network:', network);
    process.exit(1);
  }

  const mnemonic = process.env.MNEMONIC?.split(' ') || [];
  if (mnemonic.length !== 24) {
    console.error('Invalid mnemonic. Must be 24 words.');
    process.exit(1);
  }

  const deployer = new ContractDeployer(config);
  await deployer.initializeWallet(mnemonic);

  // Example deployment configuration
  const deployConfig = {
    adminAddress: Address.parse(process.env.ADMIN_ADDRESS || ''),
    depositWallet: Address.parse(process.env.DEPOSIT_WALLET || ''),
    withdrawWallet: Address.parse(process.env.WITHDRAW_WALLET || ''),
    virtualBalanceManager: Address.parse(process.env.VBM_ADDRESS || ''),
    feePercent: 250, // 2.5%
    minWithdraw: toNano('0.1'),
  };

  try {
    const marketplaceAddress = await deployer.deployMarketplace(deployConfig);

    await deployer.saveDeploymentInfo({
      network,
      timestamp: new Date().toISOString(),
      contracts: {
        marketplace: marketplaceAddress,
      },
    });

    console.log('Deployment completed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ContractDeployer };
