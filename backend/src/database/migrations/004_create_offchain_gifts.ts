import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Offchain gifts table (Telegram gifts)
  await knex.schema.createTable('offchain_gifts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('telegram_gift_id').notNullable();
    table.string('name').notNullable();
    table.decimal('value', 20, 9).notNullable().defaultTo(0);
    table.enum('status', ['deposited', 'withdrawn', 'pending', 'pending_withdrawal', 'rejected']).defaultTo('deposited');
    table.string('source').defaultTo('telegram');
    table.string('withdrawal_request_id');
    table.string('recipient_telegram_id');
    table.timestamp('withdrawn_at');
    table.timestamps(true, true);
    
    table.index('user_id');
    table.index('status');
    table.index('telegram_gift_id');
  });

  // Settings table
  await knex.schema.createTable('settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('marketplace_fee').defaultTo(250); // 2.5% in basis points
    table.decimal('min_listing_price', 20, 9).defaultTo(0.01);
    table.decimal('min_withdraw_amount', 20, 9).defaultTo(0.1);
    table.timestamps(true, true);
  });

  // Insert default settings
  await knex('settings').insert({
    marketplace_fee: 250,
    min_listing_price: 0.01,
    min_withdraw_amount: 0.1,
  });

  // Notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('type').notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.jsonb('data');
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.timestamps(true, true);
    
    table.index('user_id');
    table.index('is_read');
  });

  // Activities table
  await knex.schema.createTable('activities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('type').notNullable(); // sale, purchase, listing, bid, etc.
    table.uuid('nft_id').references('id').inTable('nfts').onDelete('SET NULL');
    table.decimal('amount', 20, 9);
    table.jsonb('metadata');
    table.timestamps(true, true);
    
    table.index('user_id');
    table.index('type');
  });

  // Deposits table
  await knex.schema.createTable('deposits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('nft_address').notNullable();
    table.uuid('category_id').references('id').inTable('categories');
    table.string('hash_comment').notNullable();
    table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending');
    table.string('tx_hash');
    table.timestamps(true, true);
    
    table.index('user_id');
    table.index('status');
  });

  // Withdrawals table
  await knex.schema.createTable('withdrawals', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('nft_id').references('id').inTable('nfts');
    table.string('to_address').notNullable();
    table.string('hash_comment').notNullable();
    table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
    table.string('tx_hash');
    table.timestamps(true, true);
    
    table.index('user_id');
    table.index('status');
  });

  // Bids table
  await knex.schema.createTable('bids', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('auction_id').references('id').inTable('auctions').onDelete('CASCADE');
    table.uuid('bidder_id').references('id').inTable('users').onDelete('CASCADE');
    table.decimal('amount', 20, 9).notNullable();
    table.timestamps(true, true);
    
    table.index('auction_id');
    table.index('bidder_id');
  });

  // Gifts table (NFT gifts)
  await knex.schema.createTable('gifts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sender_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('nft_id').references('id').inTable('nfts').onDelete('CASCADE');
    table.string('recipient_address').notNullable();
    table.text('message');
    table.enum('status', ['pending', 'sent', 'claimed', 'expired']).defaultTo('pending');
    table.timestamps(true, true);
    
    table.index('sender_id');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('gifts');
  await knex.schema.dropTableIfExists('bids');
  await knex.schema.dropTableIfExists('withdrawals');
  await knex.schema.dropTableIfExists('deposits');
  await knex.schema.dropTableIfExists('activities');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('settings');
  await knex.schema.dropTableIfExists('offchain_gifts');
}
