import SqliteDatabase from 'better-sqlite3';
import {drizzle} from 'drizzle-orm/better-sqlite3';
import {CONFIG} from '../configuration/index.js';
import * as schema from './schema.js';
import {ProductType} from '@/features/inventory/shared/index.js';

const sqlite = new SqliteDatabase(CONFIG.get('db').url);
const database = drizzle(sqlite, {schema});
const day = 86_400_000;
const now = Date.now();
const dateIn = (days: number) => new Date(now + (days * day));

try {
	database.transaction(tx => {
		if (tx.select().from(schema.products).get() ?? tx.select().from(schema.orders).get()) {
			throw new Error('Demo data requires an empty database. Existing data has not been changed.');
		}

		const items = tx.insert(schema.products).values([
			{
				name: 'Extra virgin olive oil', type: ProductType.Normal, available: 24, leadTime: 3,
			},
			{
				name: 'Atlas blend coffee', type: ProductType.Normal, available: 12, leadTime: 5,
			},
			{
				name: 'Moroccan mint tea', type: ProductType.Normal, available: 0, leadTime: 2,
			},
			{
				name: 'Summer watermelon', type: ProductType.Seasonal, available: 18, leadTime: 4, seasonStartDate: dateIn(-10), seasonEndDate: dateIn(30),
			},
			{
				name: 'First harvest grapes', type: ProductType.Seasonal, available: 0, leadTime: 7, seasonStartDate: dateIn(10), seasonEndDate: dateIn(60),
			},
			{
				name: 'Market fresh figs', type: ProductType.Seasonal, available: 0, leadTime: 5, seasonStartDate: dateIn(-20), seasonEndDate: dateIn(2),
			},
			{
				name: 'Fresh whole milk', type: ProductType.Expirable, available: 14, leadTime: 1, expiryDate: dateIn(7),
			},
			{
				name: 'Farmhouse butter', type: ProductType.Expirable, available: 0, leadTime: 3, expiryDate: dateIn(20),
			},
			{
				name: 'Natural yogurt', type: ProductType.Expirable, available: 6, leadTime: 2, expiryDate: dateIn(-1),
			},
		]).returning().all();
		for (const group of [items.slice(0, 3), items.slice(3, 6), items.slice(6, 9)]) {
			const order = tx.insert(schema.orders).values({}).returning().get();
			tx.insert(schema.ordersToProducts).values(group.map(product => ({orderId: order.id, productId: product.id}))).run();
		}
	});
	console.log('Demo inventory created: 9 products, 3 orders.');
} finally {
	sqlite.close();
}
