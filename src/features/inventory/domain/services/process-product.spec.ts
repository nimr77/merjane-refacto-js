import {describe, expect, it} from 'vitest';
import {StockNotificationType} from '../enums/stock-notification-type.js';
import {type Product} from '../models/product.js';
import {processProduct} from './process-product.js';
import {ProductType} from '@/features/inventory/domain/enums/product-type.js';

const NOW = new Date('2026-06-15T12:00:00Z');
const DAY = 86_400_000;
const normal: Product = {
	id: 1, name: 'Cable', type: ProductType.Normal, available: 3, leadTime: 5,
};
const seasonal: Product = {
	...normal, type: ProductType.Seasonal,
	seasonStartDate: new Date(NOW.getTime() - DAY),
	seasonEndDate: new Date(NOW.getTime() + (10 * DAY)),
};
const expirable: Product = {...normal, type: ProductType.Expirable, expiryDate: new Date(NOW.getTime() + DAY)};

describe('Product availability', () => {
	it.each([
		['normal stock', normal, 2, undefined],
		['last normal unit', {...normal, available: 1}, 0, undefined],
		['normal shortage', {...normal, available: 0}, 0, StockNotificationType.Delay],
		['normal immediate restock', {...normal, available: 0, leadTime: 0}, 0, StockNotificationType.Delay],
		['in-season stock', seasonal, 2, undefined],
		['season starts now', {...seasonal, seasonStartDate: NOW}, 2, undefined],
		['season ends now', {...seasonal, seasonEndDate: NOW}, 2, undefined],
		['restock during season', {...seasonal, available: 0}, 0, StockNotificationType.Delay],
		['restock at season end', {...seasonal, available: 0, leadTime: 10}, 0, StockNotificationType.Delay],
		['restock after season', {...seasonal, available: 0, leadTime: 11}, 0, StockNotificationType.Unavailable],
		['before season with stock', {...seasonal, seasonStartDate: new Date(NOW.getTime() + DAY)}, 3, StockNotificationType.Unavailable],
		['before season without stock', {...seasonal, available: 0, seasonStartDate: new Date(NOW.getTime() + DAY)}, 0, StockNotificationType.Unavailable],
		['after season with stock', {...seasonal, seasonEndDate: new Date(NOW.getTime() - 1)}, 3, StockNotificationType.Unavailable],
		['after season without stock', {...seasonal, available: 0, seasonEndDate: new Date(NOW.getTime() - 1)}, 0, StockNotificationType.Unavailable],
		['in-season immediate restock', {...seasonal, available: 0, leadTime: 0}, 0, StockNotificationType.Delay],
		['fresh stock', expirable, 2, undefined],
		['last fresh unit', {...expirable, available: 1}, 0, undefined],
		['expiration is not yet passed', {...expirable, expiryDate: NOW}, 2, undefined],
		['expired stock', {...expirable, expiryDate: new Date(NOW.getTime() - 1)}, 0, StockNotificationType.Expired],
		['expired without stock', {...expirable, available: 0, expiryDate: new Date(NOW.getTime() - 1)}, 0, StockNotificationType.Expired],
		['unexpired shortage', {...expirable, available: 0}, 0, StockNotificationType.Delay],
		['unexpired immediate restock', {...expirable, available: 0, leadTime: 0}, 0, StockNotificationType.Delay],
	] satisfies Array<[string, Product, number, StockNotificationType | undefined]>)('%s', (_label, product, available, notification) => {
		const original = structuredClone(product);
		const decision = processProduct(Object.freeze(product), NOW);
		expect(decision.product.available).toBe(available);
		expect(decision.product.leadTime).toBe(product.leadTime);
		expect(decision.notification?.type).toBe(notification);
		expect(product).toEqual(original);
	});

	it('includes exact delay and expiration notification payloads', () => {
		expect(processProduct({...normal, available: 0}, NOW).notification)
			.toEqual({type: StockNotificationType.Delay, productName: 'Cable', leadTime: 5});
		const expiryDate = new Date(NOW.getTime() - 1);
		expect(processProduct({...expirable, expiryDate}, NOW).notification)
			.toEqual({type: StockNotificationType.Expired, productName: 'Cable', expiryDate});
	});
});
