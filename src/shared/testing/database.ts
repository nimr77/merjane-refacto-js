import SqliteDatabase from 'better-sqlite3';
import {drizzle} from 'drizzle-orm/better-sqlite3';
import * as schema from '@/core/db/schema.js';

export function createTestDatabase() {
	const sqlite = new SqliteDatabase(':memory:');
	sqlite.pragma('foreign_keys = ON');
	sqlite.exec(`
		CREATE TABLE products (
			id INTEGER PRIMARY KEY NOT NULL,
			lead_time INTEGER NOT NULL,
			available INTEGER NOT NULL,
			type TEXT NOT NULL,
			name TEXT NOT NULL,
			expiry_date INTEGER,
			season_start_date INTEGER,
			season_end_date INTEGER
		);
		CREATE TABLE orders (id INTEGER PRIMARY KEY NOT NULL);
		CREATE TABLE orders_to_products (
			order_id INTEGER NOT NULL REFERENCES orders(id),
			product_id INTEGER NOT NULL REFERENCES products(id),
			PRIMARY KEY (order_id, product_id)
		);
	`);
	return {database: drizzle(sqlite, {schema}), close: () => sqlite.close()};
}
