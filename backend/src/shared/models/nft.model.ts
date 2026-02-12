/**
 * NFT Model
 */

import { Knex } from 'knex';

export interface INFT {
  id: string;
  address: string;
  collectionId: string | null;
  categoryId: string;
  index: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  metadata: Record<string, any>;
  ownerId: string;
  creatorId: string;
  mintedAt: Date;
  isOnChain: boolean;
  isOffchainGift: boolean;
  status: NFTStatus;
  rarity: number | null;
  attributes: INFTAttribute[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INFTAttribute {
  traitType: string;
  value: string;
  displayType?: string;
}

export type NFTStatus = 
  | 'in_wallet'      // In user's wallet
  | 'deposited'      // Deposited to marketplace
  | 'listed'         // Listed for sale
  | 'auction'        // In auction
  | 'offered'        // Has pending offers
  | 'sold'           // Recently sold
  | 'withdrawn'      // Withdrawn from marketplace
  | 'offchain';      // Offchain gift

export interface INFTCategory {
  id: string;
  name: string;
  highloadWalletAddress: string;
  contractAddress: string;
  totalNfts: number;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface INFTCollection {
  id: string;
  address: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  royaltyPercent: number;
  totalItems: number;
  ownerId: string;
  createdAt: Date;
}

export class NFTModel {
  private static tableName = 'nfts';
  private static categoriesTable = 'nft_categories';
  private static collectionsTable = 'nft_collections';

  static async findById(knex: Knex, id: string): Promise<INFT | null> {
    const nft = await knex(this.tableName).where({ id }).first();
    return nft ? this.parseNFT(nft) : null;
  }

  static async findByAddress(knex: Knex, address: string): Promise<INFT | null> {
    const nft = await knex(this.tableName)
      .where({ address: address.toLowerCase() })
      .first();
    return nft ? this.parseNFT(nft) : null;
  }

  static async findByOwner(
    knex: Knex,
    ownerId: string,
    filters?: {
      status?: NFTStatus;
      categoryId?: string;
      isOnChain?: boolean;
      isOffchainGift?: boolean;
    },
    pagination?: { limit: number; offset: number }
  ): Promise<{ items: INFT[]; total: number }> {
    let query = knex(this.tableName).where({ ownerId });

    if (filters?.status) {
      query = query.where({ status: filters.status });
    }
    if (filters?.categoryId) {
      query = query.where({ categoryId: filters.categoryId });
    }
    if (filters?.isOnChain !== undefined) {
      query = query.where({ isOnChain: filters.isOnChain });
    }
    if (filters?.isOffchainGift !== undefined) {
      query = query.where({ isOffchainGift: filters.isOffchainGift });
    }

    const totalQuery = query.clone();
    const total = await totalQuery.count('id as count').first();

    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }

    query = query.orderBy('createdAt', 'desc');
    const nfts = await query;

    return {
      items: nfts.map(this.parseNFT),
      total: parseInt(total?.count as string, 10) || 0,
    };
  }

  static async create(knex: Knex, data: Partial<INFT>): Promise<INFT> {
    const [nft] = await knex(this.tableName)
      .insert({
        ...data,
        metadata: JSON.stringify(data.metadata || {}),
        attributes: JSON.stringify(data.attributes || []),
        status: data.status || 'in_wallet',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning('*');
    return this.parseNFT(nft);
  }

  static async update(knex: Knex, id: string, data: Partial<INFT>): Promise<INFT | null> {
    const updateData: any = { ...data, updatedAt: new Date() };
    
    if (data.metadata) {
      updateData.metadata = JSON.stringify(data.metadata);
    }
    if (data.attributes) {
      updateData.attributes = JSON.stringify(data.attributes);
    }

    const [nft] = await knex(this.tableName)
      .where({ id })
      .update(updateData)
      .returning('*');
    
    return nft ? this.parseNFT(nft) : null;
  }

  static async updateStatus(
    knex: Knex,
    id: string,
    status: NFTStatus
  ): Promise<boolean> {
    const result = await knex(this.tableName)
      .where({ id })
      .update({ status, updatedAt: new Date() });
    return result > 0;
  }

  static async updateOwner(
    knex: Knex,
    id: string,
    newOwnerId: string
  ): Promise<boolean> {
    const result = await knex(this.tableName)
      .where({ id })
      .update({ 
        ownerId: newOwnerId, 
        status: 'in_wallet',
        updatedAt: new Date() 
      });
    return result > 0;
  }

  static async search(
    knex: Knex,
    query: string,
    filters?: {
      categoryId?: string;
      minPrice?: string;
      maxPrice?: string;
      status?: NFTStatus;
      attributes?: Record<string, string>;
    },
    pagination?: { limit: number; offset: number }
  ): Promise<{ items: INFT[]; total: number }> {
    let dbQuery = knex(this.tableName)
      .where('name', 'ilike', `%${query}%`)
      .orWhere('description', 'ilike', `%${query}%`);

    if (filters?.categoryId) {
      dbQuery = dbQuery.where({ categoryId: filters.categoryId });
    }
    if (filters?.status) {
      dbQuery = dbQuery.where({ status: filters.status });
    }

    const totalQuery = dbQuery.clone();
    const total = await totalQuery.count('id as count').first();

    if (pagination) {
      dbQuery = dbQuery.limit(pagination.limit).offset(pagination.offset);
    }

    dbQuery = dbQuery.orderBy('createdAt', 'desc');
    const nfts = await dbQuery;

    return {
      items: nfts.map(this.parseNFT),
      total: parseInt(total?.count as string, 10) || 0,
    };
  }

  static async getByCategory(
    knex: Knex,
    categoryId: string,
    pagination?: { limit: number; offset: number }
  ): Promise<{ items: INFT[]; total: number }> {
    let query = knex(this.tableName).where({ categoryId });

    const totalQuery = query.clone();
    const total = await totalQuery.count('id as count').first();

    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }

    const nfts = await query.orderBy('createdAt', 'desc');

    return {
      items: nfts.map(this.parseNFT),
      total: parseInt(total?.count as string, 10) || 0,
    };
  }

  // Category methods
  static async createCategory(
    knex: Knex,
    data: Partial<INFTCategory>
  ): Promise<INFTCategory> {
    const [category] = await knex(this.categoriesTable)
      .insert({
        ...data,
        metadata: JSON.stringify(data.metadata || {}),
        totalNfts: 0,
        isActive: true,
        createdAt: new Date(),
      })
      .returning('*');
    return this.parseCategory(category);
  }

  static async getCategoryById(knex: Knex, id: string): Promise<INFTCategory | null> {
    const category = await knex(this.categoriesTable).where({ id }).first();
    return category ? this.parseCategory(category) : null;
  }

  static async getAllCategories(knex: Knex): Promise<INFTCategory[]> {
    const categories = await knex(this.categoriesTable)
      .where({ isActive: true })
      .orderBy('createdAt', 'desc');
    return categories.map(this.parseCategory);
  }

  static async incrementCategoryCount(
    knex: Knex,
    categoryId: string
  ): Promise<boolean> {
    const result = await knex(this.categoriesTable)
      .where({ id: categoryId })
      .increment('total_nfts', 1);
    return result > 0;
  }

  // Collection methods
  static async createCollection(
    knex: Knex,
    data: Partial<INFTCollection>
  ): Promise<INFTCollection> {
    const [collection] = await knex(this.collectionsTable)
      .insert({
        ...data,
        totalItems: 0,
        createdAt: new Date(),
      })
      .returning('*');
    return this.parseCollection(collection);
  }

  static async getCollectionById(
    knex: Knex,
    id: string
  ): Promise<INFTCollection | null> {
    const collection = await knex(this.collectionsTable).where({ id }).first();
    return collection ? this.parseCollection(collection) : null;
  }

  private static parseNFT(row: any): INFT {
    return {
      id: row.id,
      address: row.address,
      collectionId: row.collection_id,
      categoryId: row.category_id,
      index: row.index,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      externalUrl: row.external_url,
      metadata: typeof row.metadata === 'string' 
        ? JSON.parse(row.metadata) 
        : row.metadata,
      ownerId: row.owner_id,
      creatorId: row.creator_id,
      mintedAt: row.minted_at,
      isOnChain: row.is_on_chain,
      isOffchainGift: row.is_offchain_gift,
      status: row.status,
      rarity: row.rarity,
      attributes: typeof row.attributes === 'string'
        ? JSON.parse(row.attributes)
        : row.attributes || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static parseCategory(row: any): INFTCategory {
    return {
      id: row.id,
      name: row.name,
      highloadWalletAddress: row.highload_wallet_address,
      contractAddress: row.contract_address,
      totalNfts: row.total_nfts,
      isActive: row.is_active,
      metadata: typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : row.metadata,
      createdAt: row.created_at,
    };
  }

  private static parseCollection(row: any): INFTCollection {
    return {
      id: row.id,
      address: row.address,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      externalUrl: row.external_url,
      royaltyPercent: row.royalty_percent,
      totalItems: row.total_items,
      ownerId: row.owner_id,
      createdAt: row.created_at,
    };
  }
}
