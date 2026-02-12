import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
  toNano,
} from '@ton/core';

const OP = {
  TRANSFER: 0x5fcc3d14,
  GET_STATIC_DATA: 0x2fcb26a2,
  GET_ROYALTY_PARAMS: 0x693d3950,
  OWNERSHIP_ASSIGNED: 0x05138d91,
  EXCESSES: 0xd53276db,
  TRANSFER_NOTIFICATION: 0x7362d09c,
};

export interface NFTItemConfig {
  index: bigint;
  collectionAddress: Address;
  ownerAddress: Address;
  content: Cell;
  royaltyParams: Cell;
}

export function nftItemConfigToCell(config: NFTItemConfig): Cell {
  return beginCell()
    .storeUint(config.index, 64)
    .storeAddress(config.collectionAddress)
    .storeAddress(config.ownerAddress)
    .storeRef(config.content)
    .storeRef(config.royaltyParams)
    .storeUint(1, 1) // is_initialized
    .endCell();
}

export class NFTItem implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new NFTItem(address);
  }

  static createFromConfig(config: NFTItemConfig, code: Cell, workchain = 0) {
    const data = nftItemConfigToCell(config);
    const init = { code, data };
    return new NFTItem(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendTransfer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      newOwner: Address;
      responseDestination: Address;
      forwardAmount?: bigint;
      forwardPayload?: Cell;
      value?: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.TRANSFER, 32)
        .storeUint(0, 64) // query_id
        .storeAddress(opts.newOwner)
        .storeAddress(opts.responseDestination)
        .storeUint(0, 1) // custom_payload empty
        .storeCoins(opts.forwardAmount || 0)
        .storeUint(opts.forwardPayload ? 1 : 0, 1)
        .storeMaybeRef(opts.forwardPayload)
        .endCell(),
    });
  }

  async sendGetStaticData(
    provider: ContractProvider,
    via: Sender,
    opts?: { value?: bigint }
  ) {
    await provider.internal(via, {
      value: opts?.value || toNano('0.01'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.GET_STATIC_DATA, 32)
        .storeUint(0, 64)
        .endCell(),
    });
  }

  async getNftData(provider: ContractProvider) {
    const result = await provider.get('get_nft_data', []);
    return {
      initialized: result.stack.readNumber(),
      index: result.stack.readBigNumber(),
      collection: result.stack.readAddress(),
      owner: result.stack.readAddress(),
    };
  }

  async getNftOwner(provider: ContractProvider) {
    const result = await provider.get('get_nft_owner', []);
    return result.stack.readAddress();
  }

  async getNftCollection(provider: ContractProvider) {
    const result = await provider.get('get_nft_collection', []);
    return result.stack.readAddress();
  }

  async getRoyaltyParams(provider: ContractProvider) {
    const result = await provider.get('get_royalty_params', []);
    return result.stack.readCell();
  }
}
