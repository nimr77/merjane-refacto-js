import {describe, expect, it} from 'vitest';
import {ORDER_ROUTES, processOrderRoute} from './order-routes.js';

describe('Order route constants', () => {
	it('preserves the existing public API paths', () => {
		expect(ORDER_ROUTES).toEqual({list: '/orders', process: '/orders/:orderId/processOrder'});
	});

	it('builds client URLs from the server route template', () => {
		expect(processOrderRoute(42)).toBe('/orders/42/processOrder');
	});
});
