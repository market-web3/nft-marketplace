import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('wallet_address').notNullable().unique();
    table.string('username').unique();
    table.text('avatar_url');
    table.text('bio');
    table.enum('role', ['user', 'admin']).defaultTo('user');
    table.string('telegram_id').unique();
    table.string('telegram_username');
    table.boolean('is_banned').defaultTo(false);
    table.text('ban_reason');
    table.timestamp('banned_at');
    table.uuid('banned_by').references('id').inTable('users');
    table.bigInteger('total_volume').defaultTo(0);
    table.integer('total_sales').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('last_active');
  });

  // Categories table
  await knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description');
    table.text('image_url');
    table.string('highload_wallet');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // NFTs table
  await knex.schema.createTable('nfts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('address').notNullable().unique();
    table.string('name').notNullable();
    table.text('description');
    table.text('image_url').notNullable();
    table.uuid('category_id').references('id').inTable('categories');
    table.uuid('owner_id').references('id').inTable('users').notNullable();
    table.uuid('creator_id').references('id').inTable('users').notNullable();
    table.string('collection_address');
    table.jsonb('metadata');
    table.enum('status', ['active', 'listed', 'sold', 'deposited', 'withdrawn', 'burned']).defaultTo('active');
    table.string('deposit_tx_hash');
    table.string('withdraw_tx_hash');
    table.boolean('is_featured').defaultTo(false);
    table.timestamp('featured_at');
    table.integer('views').defaultTo(0);
    table.integer('likes').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Listings table
  await knex.schema.createTable('listings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('nft_id').references('id').inTable('nfts').notNullable();
    table.uuid('seller_id').references('id').inTable('users').notNullable();
    table.enum('type', ['fixed', 'auction']).defaultTo('fixed');
    table.bigInteger('price').notNullable();
    table.bigInteger('reserve_price');
    table.enum('status', ['pending', 'active', 'sold', 'expired', 'cancelled', 'rejected']).defaultTo('pending');
    table.timestamp('starts_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    table.timestamp('sold_at');
    table.bigInteger('final_price');
    table.uuid('buyer_id').references('id').inTable('users');
    table.text('rejection_reason');
    table.timestamp('approved_at');
    table.uuid('approved_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Auctions table
  await knex.schema.createTable('auctions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('listing_id').references('id').inTable('listings').notNullable();
    table.bigInteger('start_price').notNullable();
    table.bigInteger('reserve_price');
    table.bigInteger('min_bid_increment').defaultTo(100000000); // 0.1 TON
    table.bigInteger('highest_bid').defaultTo(0);
    table.uuid('highest_bidder_id').references('id').inTable('users');
    table.integer('bid_count').defaultTo(0);
    table.timestamp('starts_at').notNullable();
    table.timestamp('ends_at').notNullable();
    table.enum('status', ['active', 'completed', 'expired', 'cancelled']).defaultTo('active');
    table.boolean('notified_ending').defaultTo(false);
    table.timestamp('ended_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Bids table
  await knex.schema.createTable('bids', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('auction_id').references('id').inTable('auctions').notNullable();
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.bigInteger('amount').notNullable();
    table.string('transaction_hash').notNullable();
    table.enum('status', ['active', 'outbid', 'refunded', 'won']).defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Offers table
  await knex.schema.createTable('offers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('nft_id').references('id').inTable('nfts').notNullable();
    table.uuid('buyer_id').references('id').inTable('users').notNullable();
    table.uuid('seller_id').references('id').inTable('users').notNullable();
    table.bigInteger('amount').notNullable();
    table.string('transaction_hash');
    table.timestamp('expires_at').notNullable();
    table.enum('status', ['pending', 'active', 'accepted', 'rejected', 'expired', 'cancelled']).defaultTo('pending');
    table.timestamp('accepted_at');
    table.timestamp('rejected_at');
    table.text('rejection_reason');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Transactions table
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('hash').notNullable().unique();
    table.string('blockchain_hash').unique();
    table.enum('type', ['deposit', 'withdrawal', 'purchase', 'sale', 'offer', 'auction_bid', 'auction_win', 'fee', 'royalty']).notNullable();
    table.uuid('nft_id').references('id').inTable('nfts');
    table.uuid('from_user_id').references('id').inTable('users');
    table.uuid('to_user_id').references('id').inTable('users');
    table.bigInteger('amount').notNullable();
    table.bigInteger('fee');
    table.enum('status', ['pending', 'confirmed', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.integer('block_height');
    table.integer('confirmation_count').defaultTo(0);
    table.text('error');
    table.timestamp('confirmed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.string('type').notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.jsonb('data');
    table.jsonb('channels');
    table.enum('status', ['pending', 'sent', 'failed']).defaultTo('pending');
    table.timestamp('read_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Settings table
  await knex.schema.createTable('settings', (table) => {
    table.string('key').primary();
    table.jsonb('value').notNullable();
    table.text('description');
    table.boolean('is_public').defaultTo(false);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').references('id').inTable('users');
  });

  // Telegram gifts table
  await knex.schema.createTable('telegram_gifts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('gift_id').notNullable().unique();
    table.string('name').notNullable();
    table.text('description');
    table.text('image_url');
    table.uuid('owner_id').references('id').inTable('users').notNullable();
    table.string('telegram_from_id');
    table.string('telegram_from_username');
    table.enum('status', ['deposited', 'withdrawn', 'listed']).defaultTo('deposited');
    table.timestamp('deposited_at').defaultTo(knex.fn.now());
    table.timestamp('withdrawn_at');
    table.string('withdrawal_tx_hash');
  });

  // Activity log table
  await knex.schema.createTable('activity_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.string('type').notNullable();
    table.jsonb('data');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Indexes
  await knex.schema.raw('CREATE INDEX idx_nfts_owner ON nfts(owner_id)');
  await knex.schema.raw('CREATE INDEX idx_nfts_category ON nfts(category_id)');
  await knex.schema.raw('CREATE INDEX idx_nfts_status ON nfts(status)');
  await knex.schema.raw('CREATE INDEX idx_listings_seller ON listings(seller_id)');
  await knex.schema.raw('CREATE INDEX idx_listings_status ON listings(status)');
  await knex.schema.raw('CREATE INDEX idx_listings_nft ON listings(nft_id)');
  await knex.schema.raw('CREATE INDEX idx_transactions_from ON transactions(from_user_id)');
  await knex.schema.raw('CREATE INDEX idx_transactions_to ON transactions(to_user_id)');
  await knex.schema.raw('CREATE INDEX idx_transactions_status ON transactions(status)');
  await knex.schema.raw('CREATE INDEX idx_notifications_user ON notifications(user_id)');
  await knex.schema.raw('CREATE INDEX idx_bids_auction ON bids(auction_id)');
  await knex.schema.raw('CREATE INDEX idx_offers_nft ON offers(nft_id)');
  await knex.schema.raw('CREATE INDEX idx_offers_buyer ON offers(buyer_id)');
  await knex.schema.raw('CREATE INDEX idx_offers_seller ON offers(seller_id)');

  // Insert default settings
  await knex('settings').insert([
    { key: 'marketplace_fee', value: '250', description: 'Marketplace fee in basis points (2.5%)', is_public: true },
    { key: 'min_listing_price', value: '10000000', description: 'Minimum listing price in nanotons (0.01 TON)', is_public: true },
    { key: 'min_auction_duration', value: '7', description: 'Minimum auction duration in days', is_public: true },
    { key: 'max_auction_duration', value: '365', description: 'Maximum auction duration in days', is_public: true },
    { key: 'min_offer_duration', value: '1', description: 'Minimum offer duration in hours', is_public: true },
    { key: 'max_offer_duration', value: '30', description: 'Maximum offer duration in days', is_public: true },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('activity_log');
  await knex.schema.dropTableIfExists('telegram_gifts');
  await knex.schema.dropTableIfExists('settings');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('offers');
  await knex.schema.dropTableIfExists('bids');
  await knex.schema.dropTableIfExists('auctions');
  await knex.schema.dropTableIfExists('listings');
  await knex.schema.dropTableIfExists('nfts');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('users');
}
