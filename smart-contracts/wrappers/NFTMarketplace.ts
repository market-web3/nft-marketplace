/**
 * NFT Marketplace Contract Wrapper
 * TypeScript wrapper for TON FunC contract interaction
 */

import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Dictionary,
  Sender,
  SendMode,
  toNano,
} from '@ton/core';

// Operation codes matching the contract
export enum OpCodes {
  // Admin operations
  CreateCategory = 0x1,
  SetMarketplaceFee = 0x2,
  PauseMarketplace = 0x3,
  ResumeMarketplace = 0x4,
  EmergencyWithdraw = 0x5,
  
  // Listing operations
  CreateListing = 0x10,
  CancelListing = 0x11,
  BuyNFT = 0x12,
  
  // Auction operations
  CreateAuction = 0x20,
  PlaceBid = 0x21,
  EndAuction = 0x22,
  CancelAuction = 0x23,
  
  // Offer operations
  CreateOffer = 0x30,
  AcceptOffer = 0x31,
  RejectOffer = 0x32,
  CancelOffer = 0x33,
  
  // NFT operations
  DepositNFT = 0x40,
  WithdrawNFT = 0x41,
  
  // Balance operations
  DepositBalance = 0x50,
  WithdrawBalance = 0x51,
  
  // Query operations
  GetListing = 0x100,
  GetOffer = 0x101,
  GetAuction = 0x102,
  GetBalance = 0x103,
  GetStats = 0x104,
}

// Error codes matching the contract
export enum ErrorCodes {
  Unauthorized = 100,
  Paused = 101,
  InvalidPrice = 102,
  InvalidDuration = 103,
  ListingNotFound = 104,
  OfferNotFound = 105,
  AuctionNotFound = 106,
  InsufficientBalance = 107,
  NFTNotOwned = 108,
  CategoryExists = 109,
  CategoryNotFound = 110,
  BidTooLow = 111,
  AuctionEnded = 112,
  OfferExpired = 113,
}

export interface Listing {
  nftAddress: Address;
  seller: Address;
  price: bigint;
  categoryId: bigint;
  createdAt: number;
  expiresAt: number;
  listingType: number; // 0 = fixed, 1 = auction
  auctionConfig?: Cell;
}

export interface Offer {
  offerId: bigint;
  nftAddress: Address;
  buyer: Address;
  seller: Address;
  amount: bigint;
  createdAt: number;
  expiresAt: number;
  status: number; // 0=pending, 1=accepted, 2=rejected, 3=expired, 4=cancelled
}

export interface AuctionConfig {
  startPrice: bigint;
  reservePrice: bigint;
  minBidIncrement: bigint;
  startTime: number;
  endTime: number;
  highestBid: bigint;
  highestBidder: Address;
  bidCount: number;
  isActive: boolean;
}

export interface MarketplaceConfig {
  adminAddress: Address;
  depositWallet: Address;
  withdrawWallet: Address;
  virtualBalanceManager: Address;
  marketplaceFeePercent: number;
  minWithdrawAmount: bigint;
  isPaused: boolean;
}

export class NFTMarketplace implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address): NFTMarketplace {
    return new NFTMarketplace(address);
  }

  static createFromConfig(config: MarketplaceConfig, code: Cell, workchain = 0): NFTMarketplace {
    const data = beginCell()
      .storeAddress(config.adminAddress)
      .storeAddress(config.depositWallet)
      .storeAddress(config.withdrawWallet)
      .storeAddress(config.virtualBalanceManager)
      .storeUint(config.marketplaceFeePercent, 16)
      .storeCoins(config.minWithdrawAmount)
      .storeCoins(0) // total_volume
      .storeUint(0, 64) // total_trades
      .storeUint(0, 64) // total_nfts
      .storeUint(config.isPaused ? 1 : 0, 1)
      .storeDict(Dictionary.empty()) // nft_categories
      .storeDict(Dictionary.empty()) // active_listings
      .storeDict(Dictionary.empty()) // active_offers
      .storeDict(Dictionary.empty()) // auctions
      .endCell();

    const init = { code, data };
    const address = contractAddress(workchain, init);

    return new NFTMarketplace(address, init);
  }

  // Admin Operations
  async sendCreateCategory(
    provider: ContractProvider,
    via: Sender,
    opts: {
      categoryId: bigint;
      categoryName: string;
      highloadWallet: Address;
      value?: bigint;
    }
  ): Promise<void> {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.CreateCategory, 32)
        .storeUint(0, 64) // query_id
        .storeUint(opts.categoryId, 256)
        .storeRef(beginCell().storeStringTail(opts.categoryName).endCell())
        .storeAddress(opts.highloadWallet)
        .endCell(),
    });
  }

  async sendSetMarketplaceFee(
    provider: ContractProvider,
    via: Sender,
    opts: {
      feePercent: number;
      value?: bigint;
    }
  ): Promise<void> {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.SetMarketplaceFee, 32)
        .storeUint(0, 64)
        .storeUint(opts.feePercent, 16)
        .endCell(),
    });
  }

  async sendPauseMarketplace(
    provider: ContractProvider,
    via: Sender,
    opts: { value?: bigint } = {}
  ): Promise<void> {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.PauseMarketplace, 32)
        .storeUint(0, 64)
        .endCell(),
    });
  }

  async sendResumeMarketplace(
    provider: ContractProvider,
    via: Sender,
    opts: { value?: bigint } = {}
  ): Promise<void> {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.ResumeMarketplace, 32)
        .storeUint(0, 64)
        .endCell(),
    });
  }

  // Listing Operations
  async sendCreateListing(
    provider: ContractProvider,
    via: Sender,
    opts: {
      nftAddress: Address;
      price: bigint;
      categoryId: bigint;
      expiresAt: number;
      value?: bigint;
    }
  ): Promise<void> {
    await provider.internal(via, {
      value: opts.value || toNano('0.1'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.CreateListing, 32)
        .storeUint(0, 64)
        .storeAddress(opts.nftAddress)
        .storeCoins(opts.price)
        .storeUint(opts.categoryId, 256)
        .storeUint(opts.expiresAt, 64)
        .endCell(),
    });
  }

  async sendCancelListing(
    provider: ContractProvider,
    via: Sender,
    opts: {
      listingId: bigint;
      value?: bigint;
    }
  ): Promise<void> {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.CancelListing, 32)
        .storeUint(0, 64)
        .storeUint(opts.listingId, 256)
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
  ): Promise<void> {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.BuyNFT, 32)
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
      startPrice: bigint;
      reservePrice: bigint;
      minBidIncrement: bigint;
      durationDays: number;
      value?: bigint;
    }
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const endTime = now + opts.durationDays * 86400;

    await provider.internal(via, {
      value: opts.value || toNano('0.1'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.CreateAuction, 32)
        .storeUint(0, 64)
        .storeAddress(opts.nftAddress)
        .storeCoins(opts.startPrice)
        .storeCoins(opts.reservePrice)
        .storeCoins(opts.minBidIncrement)
        .storeUint(now, 64)
        .storeUint(endTime, 64)
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
  ): Promise<void> {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.PlaceBid, 32)
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
      value?: bigint;
    }
  ): Promise<void> {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.EndAuction, 32)
        .storeUint(0, 64)
        .storeUint(opts.auctionId, 256)
        .endCell(),
    });
  }

  // Offer Operations
  async sendCreateOffer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      nftAddress: Address;
      seller: Address;
      durationHours: number;
      value: bigint;
    }
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + opts.durationHours * 3600;

    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.CreateOffer, 32)
        .storeUint(0, 64)
        .storeAddress(opts.nftAddress)
        .storeAddress(opts.seller)
        .storeUint(expiresAt, 64)
        .endCell(),
    });
  }

  async sendAcceptOffer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      offerId: bigint;
      value?: bigint;
    }
  ): Promise<void> {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.AcceptOffer, 32)
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
      value?: bigint;
    }
  ): Promise<void> {
    await provider.internal(via, {
      value: opts.value || toNano('0.05'),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCodes.RejectOffer, 32)
        .storeUint(0, 64)
        .storeUint(opts.offerId, 256)
        .endCell(),
    });
  }

  // Getters
  async getListing(provider: ContractProvider, listingId: bigint): Promise<Listing | null> {
    const result = await provider.get('get_listing', [
      { type: 'int', value: listingId },
    ]);
    
    if (result.stack.length < 6) return null;

    return {
      nftAddress: result.stack[0].cell.beginParse().loadAddress(),
      seller: result.stack[1].cell.beginParse().loadAddress(),
      price: result.stack[2].value,
      categoryId: result.stack[3].value,
      createdAt: Number(result.stack[4].value),
      expiresAt: Number(result.stack[5].value),
      listingType: result.stack[6] ? Number(result.stack[6].value) : 0,
    };
  }

  async getMarketplaceData(provider: ContractProvider): Promise<{
    adminAddress: Address;
    feePercent: number;
    totalVolume: bigint;
    totalTrades: bigint;
    isPaused: boolean;
  }> {
    const result = await provider.get('get_marketplace_data', []);
    
    return {
      adminAddress: result.stack[0].cell.beginParse().loadAddress(),
      feePercent: Number(result.stack[4].value),
      totalVolume: result.stack[6].value,
      totalTrades: result.stack[7].value,
      isPaused: result.stack[9].value === 1n,
    };
  }

  async getBalance(provider: ContractProvider, address: Address): Promise<bigint> {
    const result = await provider.get('get_balance', [
      { type: 'slice', cell: beginCell().storeAddress(address).endCell() },
    ]);
    
    return result.stack[0].value;
  }
}
