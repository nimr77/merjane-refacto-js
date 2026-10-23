import {describe, expect, it} from 'vitest';
import {AppRoute, isAppRoute, productRoute} from './routes.js';

describe('Route enum contracts', () => {
	it('preserves existing navigation destinations', () => {
		expect(Object.values(AppRoute)).toEqual(['inventory', 'orders', 'product']);
		expect(productRoute(42)).toBe('product/42');
	});

	it.each(Object.values(AppRoute))('recognizes route %s', route => {
		expect(isAppRoute(route)).toBe(true);
	});

	it.each([undefined, null, '', 'unknown', 'product/1', 1])('rejects invalid route %j', value => {
		expect(isAppRoute(value)).toBe(false);
	});
});
