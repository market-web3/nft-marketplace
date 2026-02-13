import { 
  Address, 
  beginCell, 
  Cell, 
  Contract, 
  contractAddress, 
  ContractProvider, 
  Sender, 
  SendMode,
  toNano 
} from '@ton/core';

// Operation codes
const OP_UPGRADE_IMPLEMENTATION = 0x0001;
const OP_CHANGE_ADMIN = 0x0002;
const OP_PAUSE_MARKETPLACE = 0x1007;
const OP_RESUME_MARKETPLACE = 0x1008;
const OP_EMERGENCY_WITHDRAW = 0x1009;

export type ProxyConfig = {
  implementation: Address;
  admin: Address;
  paused: boolean;
  version: number;
};

export function proxyConfigToCell(config: ProxyConfig): Cell {
  return beginCell()
    .storeAddress(config.implementation)
    .storeAddress(config.admin)
    .storeUint(config.paused ? 1 : 0, 1)
    .storeUint(config.version, 32)
    .endCell();
}

export class NFTMarketplaceProxy implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new NFTMarketplaceProxy(address);
  }

  static createFromConfig(config: ProxyConfig, code: Cell, workchain = 0) {
    const data = proxyConfigToCell(config);
    const init = { code, data };
    return new NFTMarketplaceProxy(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  // Admin functions
  async sendUpgradeImplementation(
    provider: ContractProvider,
    via: Sender,
    newImplementation: Address
  ) {
    await provider.internal(via, {
      value: toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_UPGRADE_IMPLEMENTATION, 32)
        .storeUint(0, 64) // query_id
        .storeAddress(newImplementation)
        .endCell(),
    });
  }

  async sendChangeAdmin(
    provider: ContractProvider,
    via: Sender,
    newAdmin: Address
  ) {
    await provider.internal(via, {
      value: toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_CHANGE_ADMIN, 32)
        .storeUint(0, 64)
        .storeAddress(newAdmin)
        .endCell(),
    });
  }

  async sendPause(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_PAUSE_MARKETPLACE, 32)
        .storeUint(0, 64)
        .endCell(),
    });
  }

  async sendUnpause(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_RESUME_MARKETPLACE, 32)
        .storeUint(0, 64)
        .endCell(),
    });
  }

  async sendEmergencyWithdraw(
    provider: ContractProvider,
    via: Sender,
    amount: bigint
  ) {
    await provider.internal(via, {
      value: toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_EMERGENCY_WITHDRAW, 32)
        .storeUint(0, 64)
        .storeCoins(amount)
        .endCell(),
    });
  }

  // Get methods
  async getProxyInfo(provider: ContractProvider) {
    const result = await provider.get('get_proxy_info', []);
    return {
      implementation: result.stack.readAddress(),
      admin: result.stack.readAddress(),
      paused: result.stack.readNumber() === 1,
      version: result.stack.readNumber(),
    };
  }

  async getImplementation(provider: ContractProvider) {
    const result = await provider.get('get_implementation', []);
    return result.stack.readAddress();
  }

  async getVersion(provider: ContractProvider) {
    const result = await provider.get('get_version', []);
    return result.stack.readNumber();
  }

  async isPaused(provider: ContractProvider) {
    const result = await provider.get('is_paused', []);
    return result.stack.readNumber() === 1;
  }
}
