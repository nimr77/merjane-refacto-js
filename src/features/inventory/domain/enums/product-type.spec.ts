import {describe, expect, it} from 'vitest';
import {isProductType, ProductType} from './product-type.js';
import {StockNotificationType} from './stock-notification-type.js';

describe('Product enum contracts', () => {
	it('preserves product types in existing database rows and API payloads', () => {
		expect(Object.values(ProductType)).toEqual(['NORMAL', 'SEASONAL', 'EXPIRABLE']);
	});

	it('preserves notification discriminators', () => {
		expect(Object.values(StockNotificationType)).toEqual(['delay', 'unavailable', 'expired']);
	});

	it.each(Object.values(ProductType))('recognizes persisted product type %s', type => {
		expect(isProductType(type)).toBe(true);
	});

	it.each([undefined, null, '', 'UNKNOWN', 'normal', 1, {}])('rejects invalid product type %j', value => {
		expect(isProductType(value)).toBe(false);
	});
});
