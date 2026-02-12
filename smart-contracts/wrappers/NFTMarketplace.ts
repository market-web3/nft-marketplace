import { 
  Address, 
  beginCell, 
  Cell, 
  Contract, 
  contractAddress, 
  ContractProvider, 
  Sender, 
  SendMode,
  TupleItemInt,
  TupleItemSlice
} from '@ton/core';

// Operation codes matching the smart contract
const OP_CODES = {
  CREATE_CATEGORY: 0x1001,
  SET_FEE: 0x1002,
  PAUSE_MARKETPLACE: 0x1007,
  LIST_NFT: 0x2003,
  BUY_NFT: 0x2006,
  CREATE_AUCTION: 0x2101,
  PLACE_BID: 0x2005,
  END_AUCTION: 0x2102,
  MAKE_OFFER: 0x2007,
  ACCEPT_OFFER: 0x2008,
  REJECT_OFFER: 0x2009,
  CANCEL_OFFER: 0x200A,
  CANCEL_EXPIRED_OFFER: 0x200B,
} as const;

export type NFTMarketplaceConfig = {
  adminAddress: Address;
  depositWallet: Address;
  withdrawWallet: Address;
  virtualBalanceManager: Address;
  marketplaceFeePercent: number;
  minWithdrawAmount: bigint;
};

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
    .storeUint(0, 64) // total_nfts
    .storeUint(0, 1) // is_paused
    .storeDict(null) // nft_categories
    .storeDict(null) // active_listings
    .storeDict(null) // active_offers
    .storeDict(null) // auctions
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

  // Admin Operations
  async sendCreateCategory(
    provider: ContractProvider,
    via: Sender,
    opts: {
      categoryId: bigint;
      categoryName: string;
      highloadWallet: Address;
      value: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_CODES.CREATE_CATEGORY, 32)
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
      value: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_CODES.SET_FEE, 32)
        .storeUint(0, 64)
        .storeUint(opts.feePercent, 16)
        .endCell(),
    });
  }

  // Listing Operations
  async sendListNFT(
    provider: ContractProvider,
    via: Sender,
    opts: {
      nftAddress: Address;
      categoryId: bigint;
      price: bigint;
      value: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_CODES.LIST_NFT, 32)
        .storeUint(0, 64)
        .storeAddress(opts.nftAddress)
        .storeUint(opts.categoryId, 256)
        .storeCoins(opts.price)
        .endCell(),
    });
  }

  async sendBuyNFT(
    provider: ContractProvider,
    via: Sender,
    opts: {
      listingId: bigint;
      value: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_CODES.BUY_NFT, 32)
        .storeUint(0, 64)
        .storeUint(opts.listingId, 256)
        .endCell(),
    });
  }

  // Auction Operations
  async sendCreateAuction(
    provider: ContractProvider,
    via: Sender,
    opts: {
      nftAddress: Address;
      categoryId: bigint;
      startPrice: bigint;
      reservePrice: bigint;
      minBidIncrement: bigint;
      durationDays: number;
      value: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_CODES.CREATE_AUCTION, 32)
        .storeUint(0, 64)
        .storeAddress(opts.nftAddress)
        .storeUint(opts.categoryId, 256)
        .storeCoins(opts.startPrice)
        .storeCoins(opts.reservePrice)
        .storeCoins(opts.minBidIncrement)
        .storeUint(opts.durationDays, 16)
        .endCell(),
    });
  }

  async sendPlaceBid(
    provider: ContractProvider,
    via: Sender,
    opts: {
      auctionId: bigint;
      value: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_CODES.PLACE_BID, 32)
        .storeUint(0, 64)
        .storeUint(opts.auctionId, 256)
        .endCell(),
    });
  }

  async sendEndAuction(
    provider: ContractProvider,
    via: Sender,
    opts: {
      auctionId: bigint;
      value: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_CODES.END_AUCTION, 32)
        .storeUint(0, 64)
        .storeUint(opts.auctionId, 256)
        .endCell(),
    });
  }

  // Offer Operations
  async sendMakeOffer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      nftAddress: Address;
      seller: Address;
      offerAmount: bigint;
      durationHours: number;
      value: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_CODES.MAKE_OFFER, 32)
        .storeUint(0, 64)
        .storeAddress(opts.nftAddress)
        .storeAddress(opts.seller)
        .storeCoins(opts.offerAmount)
        .storeUint(opts.durationHours, 16)
        .endCell(),
    });
  }

  async sendAcceptOffer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      offerId: bigint;
      value: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_CODES.ACCEPT_OFFER, 32)
        .storeUint(0, 64)
        .storeUint(opts.offerId, 256)
        .endCell(),
    });
  }

  async sendRejectOffer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      offerId: bigint;
      value: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OP_CODES.REJECT_OFFER, 32)
        .storeUint(0, 64)
        .storeUint(opts.offerId, 256)
        .endCell(),
    });
  }

  // Get Methods
  async getMarketplaceInfo(provider: ContractProvider): Promise<{
    fee: number;
    minWithdraw: bigint;
    volume: bigint;
    trades: number;
    admin: Address;
    deposit: Address;
    withdraw: Address;
    vbm: Address;
    totalNfts: number;
    isPaused: number;
  }> {
    const result = await provider.get('get_marketplace_info', []);
    return {
      fee: (result.stack[0] as TupleItemInt).value,
      minWithdraw: (result.stack[1] as TupleItemInt).value,
      volume: (result.stack[2] as TupleItemInt).value,
      trades: Number((result.stack[3] as TupleItemInt).value),
      admin: (result.stack[4] as TupleItemSlice).cell.asSlice().loadAddress(),
      deposit: (result.stack[5] as TupleItemSlice).cell.asSlice().loadAddress(),
      withdraw: (result.stack[6] as TupleItemSlice).cell.asSlice().loadAddress(),
      vbm: (result.stack[7] as TupleItemSlice).cell.asSlice().loadAddress(),
      totalNfts: Number((result.stack[8] as TupleItemInt).value),
      isPaused: Number((result.stack[9] as TupleItemInt).value),
    };
  }

  async getAuctionInfo(provider: ContractProvider, auctionId: bigint): Promise<{
    startPrice: bigint;
    reservePrice: bigint;
    minBidIncrement: bigint;
    highestBid: bigint;
    bidCount: number;
    timeRemaining: number;
    highestBidder: Address;
    isActive: number;
    startTime: number;
    endTime: number;
  }> {
    const result = await provider.get('get_auction_info', [
      { type: 'int', value: auctionId } as TupleItemInt,
    ]);
    return {
      startPrice: (result.stack[0] as TupleItemInt).value,
      reservePrice: (result.stack[1] as TupleItemInt).value,
      minBidIncrement: (result.stack[2] as TupleItemInt).value,
      highestBid: (result.stack[3] as TupleItemInt).value,
      bidCount: Number((result.stack[4] as TupleItemInt).value),
      timeRemaining: Number((result.stack[5] as TupleItemInt).value),
      highestBidder: (result.stack[6] as TupleItemSlice).cell.asSlice().loadAddress(),
      isActive: Number((result.stack[7] as TupleItemInt).value),
      startTime: Number((result.stack[8] as TupleItemInt).value),
      endTime: Number((result.stack[9] as TupleItemInt).value),
    };
  }
}
