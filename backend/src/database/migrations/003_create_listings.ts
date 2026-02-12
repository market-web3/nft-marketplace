import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Listings (Fixed price and Auction)
  await knex.schema.createTable('listings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('nft_id').references('id').inTable('nfts').notNullable();
    table.uuid('seller_id').references('id').inTable('users').notNullable();
    table.enum('type', ['fixed', 'auction']).notNullable();
    table.decimal('price', 39, 0).notNullable();
    table.decimal('start_price', 39, 0).nullable();
    table.decimal('reserve_price', 39, 0).nullable();
    table.decimal('min_bid_increment', 39, 0).nullable();
    table.timestamp('start_time').nullable();
    table.timestamp('end_time').nullable();
    table.enum('status', ['active', 'sold', 'cancelled', 'expired']).defaultTo('active');
    table.uuid('highest_bidder_id').references('id').inTable('users').nullable();
    table.decimal('highest_bid', 39, 0).nullable();
    table.integer('bid_count').defaultTo(0);
    table.timestamp('cancelled_at').nullable();
    table.timestamp('completed_at').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index(['status', 'end_time']);
    table.index(['seller_id', 'status']);
    table.index(['nft_id', 'status']);
    table.index(['type', 'status']);
    table.index(['price']);
  });

  // Bids
  await knex.schema.createTable('bids', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('listing_id').references('id').inTable('listings').notNullable();
    table.uuid('bidder_id').references('id').inTable('users').notNullable();
    table.decimal('amount', 39, 0).notNullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.boolean('is_refunded').defaultTo(false);
    table.timestamp('refunded_at').nullable();
    table.string('transaction_hash').nullable();

    table.index(['listing_id', 'timestamp']);
    table.index(['bidder_id']);
  });

  // Offers
  await knex.schema.createTable('offers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('nft_id').references('id').inTable('nfts').notNullable();
    table.uuid('buyer_id').references('id').inTable('users').notNullable();
    table.uuid('seller_id').references('id').inTable('users').notNullable();
    table.decimal('price', 39, 0).notNullable();
    table.timestamp('expires_at').notNullable();
    table.enum('status', ['pending', 'accepted', 'rejected', 'expired', 'cancelled']).defaultTo('pending');
    table.timestamp('responded_at').nullable();
    table.string('transaction_hash').nullable();
    table.timestamps(true, true);

    table.index(['nft_id', 'status']);
    table.index(['buyer_id', 'status']);
    table.index(['seller_id', 'status']);
    table.index(['expires_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('offers');
  await knex.schema.dropTableIfExists('bids');
  await knex.schema.dropTableIfExists('listings');
}
