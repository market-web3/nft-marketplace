import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('wallet_address').unique().nullable().index();
    table.string('telegram_id').unique().nullable().index();
    table.string('telegram_username').nullable();
    table.string('nonce').notNullable();
    table.boolean('is_verified').defaultTo(false);
    table.decimal('virtual_balance', 39, 0).defaultTo(0);
    table.decimal('total_volume', 39, 0).defaultTo(0);
    table.integer('trade_count').defaultTo(0);
    table.jsonb('preferences').defaultTo('{}');
    table.boolean('is_banned').defaultTo(false);
    table.text('ban_reason').nullable();
    table.timestamp('last_login_at').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index(['is_verified', 'created_at']);
    table.index(['is_banned']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
