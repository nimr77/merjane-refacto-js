import {
	afterEach, describe, expect, it, vi,
} from 'vitest';
import {ProductType, HttpInventoryRepository} from '@/features/inventory/shared/index.js';
import {HttpOrdersRepository} from '@/features/orders/shared/index.js';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('HTTP repository implementations', () => {
	it('hydrates inventory dates from JSON', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([{
			id: 1, name: 'Milk', type: ProductType.Expirable, available: 2, leadTime: 3, expiryDate: '2026-07-01T00:00:00.000Z',
		}]))));
		const [product] = await new HttpInventoryRepository().list();
		expect(product?.type === ProductType.Expirable && product.expiryDate).toEqual(new Date('2026-07-01T00:00:00.000Z'));
	});

	it('rejects malformed inventory instead of passing it to state', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([{id: 1}]))));
		await expect(new HttpInventoryRepository().list()).rejects.toThrow();
	});

	it('uses the existing process-order endpoint and validates the result', async () => {
		const fetch = vi.fn(async () => new Response('{"orderId":7}'));
		vi.stubGlobal('fetch', fetch);
		expect(await new HttpOrdersRepository().process(7)).toEqual({orderId: 7});
		expect(fetch).toHaveBeenCalledWith('/orders/7/processOrder', {method: 'POST', headers: {accept: 'application/json'}});
	});

	it('propagates API error messages', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response('{"message":"Order 7 was not found."}', {status: 404})));
		await expect(new HttpOrdersRepository().process(7)).rejects.toThrow('Order 7 was not found.');
	});

	it('reports HTTP failures even when the error shape is unrecognized', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', {status: 503})));
		await expect(new HttpOrdersRepository().list()).rejects.toThrow('Request failed (503).');
	});
});
