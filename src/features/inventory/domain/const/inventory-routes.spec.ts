import {describe, expect, it} from 'vitest';
import {INVENTORY_ROUTES} from './inventory-routes.js';

describe('Inventory route constants', () => {
	it('preserves the public inventory endpoint', () => {
		expect(INVENTORY_ROUTES.list).toBe('/products');
	});
});
