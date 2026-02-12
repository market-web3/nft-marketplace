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

// Operation codes
const OP = {
  CREATE_CATEGORY: 0x1001,
  SET_FEE: 0x1002,
  SET_MIN_WITHDRAW: 0x1003,
  MINT_NFT: 0x2001,
  BATCH_MINT: 0x2002,
  LIST_NFT: 0x2003,
  AUCTION_NFT: 0x2004,
  PLACE_BID: 0x2005,
  BUY_NFT: 0x2006,
  MAKE_OFFER: 0x2007,
  ACCEPT_OFFER: 0x2008,
  CANCEL_SALE: 0x2009,
  VIRTUAL_DEPOSIT: 0x3001,
  VIRTUAL_WITHDRAW: 0x3002,
  NFT_WITHDRAW: 0x7002,
  SEND_GIFT: 0x6001,
};

export interface NFTMarketplaceConfig {
  adminAddress: Address;
  depositWallet: Address;
  withdrawWallet: Address;
  virtualBalanceManager: Address;
  marketplaceFeePercent: number;
  minWithdrawAmount: bigint;
}

export function nftMarketplaceConfigToCell(config: NFTMarketplaceConfig): Cell {
  return beginCell()
    .storeAddress(config.adminAddress)
    .storeAddress(config.depositWallet)
    .storeAddress(config.withdrawWallet)
    .storeAddress(config.virtualBalanceManager)
    .storeUint(config.marketplaceFeePercent, 16)
    .storeCoins(config.minWithdrawAmount)
    .storeCoins(0) // total_volume
    .storeUint(0, 64) // total_trades
    .storeDict(null) // nft_categories
    .endCell();
}

export class NFTMarketplace implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new NFTMarketplace(address);
  }

  static createFromConfig(config: NFTMarketplaceConfig, code: Cell, workchain = 0) {
    const data = nftMarketplaceConfigToCell(config);
    const init = { code, data };
    return new NFTMarketplace(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  // Admin operations
  async sendCreateCategory(
    provider: ContractProvider,
    via: Sender,
    opts: {
      categoryName: string;
      highloadWallet: Address;
      categoryId: bigint;
      value?: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value || toNano('0.1'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.CREATE_CATEGORY, 32)
        .storeUint(0, 64) // query_id
        .storeRef(beginCell().storeStringTail(opts.categoryName).endCell())
        .storeAddress(opts.highloadWallet)
        .storeUint(opts.categoryId, 256)
        .endCell(),
    });
  }

  async sendSetFee(
    provider: ContractProvider,
    via: Sender,
    opts: {
      feePercent: number;
      value?: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.SET_FEE, 32)
        .storeUint(0, 64)
        .storeUint(opts.feePercent, 16)
        .endCell(),
    });
  }

  // NFT operations
  async sendMintNft(
    provider: ContractProvider,
    via: Sender,
    opts: {
      categoryId: bigint;
      nftIndex: bigint;
      nftData: Cell;
      value?: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.MINT_NFT, 32)
        .storeUint(0, 64)
        .storeUint(opts.categoryId, 256)
        .storeUint(opts.nftIndex, 64)
        .storeRef(opts.nftData)
        .endCell(),
    });
  }

  async sendListNft(
    provider: ContractProvider,
    via: Sender,
    opts: {
      nftAddress: Address;
      categoryId: bigint;
      price: bigint;
      saleEndTime: bigint;
      value?: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.LIST_NFT, 32)
        .storeUint(0, 64)
        .storeAddress(opts.nftAddress)
        .storeUint(opts.categoryId, 256)
        .storeCoins(opts.price)
        .storeUint(opts.saleEndTime, 64)
        .endCell(),
    });
  }

  async sendAuctionNft(
    provider: ContractProvider,
    via: Sender,
    opts: {
      nftAddress: Address;
      categoryId: bigint;
      startPrice: bigint;
      reservePrice: bigint;
      minBidIncrement: bigint;
      auctionEndTime: bigint;
      value?: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.AUCTION_NFT, 32)
        .storeUint(0, 64)
        .storeAddress(opts.nftAddress)
        .storeUint(opts.categoryId, 256)
        .storeCoins(opts.startPrice)
        .storeCoins(opts.reservePrice)
        .storeCoins(opts.minBidIncrement)
        .storeUint(opts.auctionEndTime, 64)
        .endCell(),
    });
  }

  async sendBuyNft(
    provider: ContractProvider,
    via: Sender,
    opts: {
      nftAddress: Address;
      seller: Address;
      price: bigint;
      categoryId: bigint;
      hashComment: string;
      value?: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value || opts.price + toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.BUY_NFT, 32)
        .storeUint(0, 64)
        .storeAddress(opts.nftAddress)
        .storeAddress(opts.seller)
        .storeCoins(opts.price)
        .storeUint(opts.categoryId, 256)
        .storeRef(beginCell().storeStringTail(opts.hashComment).endCell())
        .endCell(),
    });
  }

  async sendPlaceBid(
    provider: ContractProvider,
    via: Sender,
    opts: {
      auctionId: Address;
      bidAmount: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.bidAmount,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.PLACE_BID, 32)
        .storeUint(0, 64)
        .storeAddress(opts.auctionId)
        .endCell(),
    });
  }

  async sendMakeOffer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      nftAddress: Address;
      offerPrice: bigint;
      offerExpiry: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.offerPrice,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.MAKE_OFFER, 32)
        .storeUint(0, 64)
        .storeAddress(opts.nftAddress)
        .storeCoins(opts.offerPrice)
        .storeUint(opts.offerExpiry, 64)
        .endCell(),
    });
  }

  async sendVirtualDeposit(
    provider: ContractProvider,
    via: Sender,
    opts: {
      amount: bigint;
      hashComment: string;
    }
  ) {
    await provider.internal(via, {
      value: opts.amount,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.VIRTUAL_DEPOSIT, 32)
        .storeUint(0, 64)
        .storeRef(beginCell().storeStringTail(opts.hashComment).endCell())
        .endCell(),
    });
  }

  async sendVirtualWithdraw(
    provider: ContractProvider,
    via: Sender,
    opts: {
      amount: bigint;
      hashComment: string;
      value?: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP.VIRTUAL_WITHDRAW, 32)
        .storeUint(0, 64)
        .storeCoins(opts.amount)
        .storeRef(beginCell().storeStringTail(opts.hashComment).endCell())
        .endCell(),
    });
  }

  // Get methods
  async getMarketplaceInfo(provider: ContractProvider) {
    const result = await provider.get('get_marketplace_info', []);
    return {
      feePercent: result.stack.readNumber(),
      minWithdraw: result.stack.readBigNumber(),
      totalVolume: result.stack.readBigNumber(),
      totalTrades: result.stack.readNumber(),
      admin: result.stack.readAddress(),
      depositWallet: result.stack.readAddress(),
      withdrawWallet: result.stack.readAddress(),
      vbm: result.stack.readAddress(),
    };
  }

  async getCategoryInfo(provider: ContractProvider, categoryId: bigint) {
    const result = await provider.get('get_category_info', [
      { type: 'int', value: categoryId },
    ]);
    return {
      name: result.stack.readString(),
      wallet: result.stack.readAddress(),
      total: result.stack.readNumber(),
      active: result.stack.readNumber(),
    };
  }

  async getCategoriesCount(provider: ContractProvider) {
    const result = await provider.get('get_categories_count', []);
    return result.stack.readNumber();
  }
}
