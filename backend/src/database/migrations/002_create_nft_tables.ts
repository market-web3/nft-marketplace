import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // NFT Categories
  await knex.schema.createTable('nft_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('highload_wallet_address').notNullable();
    table.string('contract_address').nullable();
    table.integer('total_nfts').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);

    table.index(['is_active']);
  });

  // NFT Collections
  await knex.schema.createTable('nft_collections', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('address').unique().notNullable();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.string('image_url').nullable();
    table.string('external_url').nullable();
    table.decimal('royalty_percent', 5, 2).defaultTo(0);
    table.integer('total_items').defaultTo(0);
    table.uuid('owner_id').references('id').inTable('users').nullable();
    table.timestamps(true, true);

    table.index(['owner_id']);
  });

  // NFTs
  await knex.schema.createTable('nfts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('address').unique().notNullable();
    table.uuid('collection_id').references('id').inTable('nft_collections').nullable();
    table.uuid('category_id').references('id').inTable('nft_categories').nullable();
    table.string('index').notNullable();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.string('image_url').nullable();
    table.string('external_url').nullable();
    table.jsonb('metadata').defaultTo('{}');
    table.uuid('owner_id').references('id').inTable('users').notNullable();
    table.uuid('creator_id').references('id').inTable('users').notNullable();
    table.timestamp('minted_at').notNullable();
    table.boolean('is_on_chain').defaultTo(true);
    table.boolean('is_offchain_gift').defaultTo(false);
    table.enum('status', [
      'in_wallet',
      'deposited',
      'listed',
      'auction',
      'offered',
      'sold',
      'withdrawn',
      'offchain'
    ]).defaultTo('in_wallet');
    table.decimal('rarity', 5, 2).nullable();
    table.jsonb('attributes').defaultTo('[]');
    table.timestamps(true, true);

    // Indexes
    table.index(['owner_id', 'status']);
    table.index(['category_id']);
    table.index(['collection_id']);
    table.index(['status', 'created_at']);
    table.index(['name'], undefined, { method: 'gin', opclass: 'gin_trgm_ops' });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('nfts');
  await knex.schema.dropTableIfExists('nft_collections');
  await knex.schema.dropTableIfExists('nft_categories');
}
