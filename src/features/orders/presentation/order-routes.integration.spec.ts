import {
	describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import {type FastifyInstance} from 'fastify';
import {eq} from 'drizzle-orm';
import {asValue} from 'awilix';
import {mockDeep} from 'vitest-mock-extended';
import {ProductType} from '@/features/inventory/shared/index.js';
import {type INotificationService} from '@/features/notifications/shared/index.js';
import {
	type ProductInsert, products, orders, ordersToProducts,
} from '@/core/db/schema.js';
import {buildFastify} from '@/fastify.js';
import {createTestDatabase} from '@/shared/testing/database.js';

const NOW = new Date('2026-06-15T12:00:00Z');
const DAY = 86_400_000;

describe('Order processing HTTP and persistence', () => {
	let server: FastifyInstance;
	let context: ReturnType<typeof createTestDatabase>;
	const notifications = mockDeep<INotificationService>();

	beforeEach(async () => {
		vi.clearAllMocks();
		context = createTestDatabase();
		server = await buildFastify(context.database);
		server.diContainer.register({
			ns: asValue<INotificationService>(notifications),
			clock: asValue({now: () => NOW}),
		});
		await server.ready();
	});

	afterEach(async () => {
		await server.close();
		context.close();
	});

	function createOrder(items: ProductInsert[]): number {
		const {database} = context;
		return database.transaction(tx => {
			const order = tx.insert(orders).values({}).returning().get();
			if (items.length > 0) {
				const inserted = tx.insert(products).values(items).returning().all();
				tx.insert(ordersToProducts).values(inserted.map(product => ({orderId: order.id, productId: product.id}))).run();
			}

			return order.id;
		});
	}

	const normal = {
		name: 'Cable', type: ProductType.Normal, available: 3, leadTime: 5,
	};

	it('processes the original six-product scenario and preserves the response contract', async () => {
		const orderId = createOrder([
			normal,
			{
				...normal, name: 'Dongle', available: 0, leadTime: 10,
			},
			{
				...normal, name: 'Butter', type: ProductType.Expirable, expiryDate: new Date(NOW.getTime() + DAY),
			},
			{
				...normal, name: 'Milk', type: ProductType.Expirable, expiryDate: new Date(NOW.getTime() - DAY),
			},
			{
				...normal, name: 'Watermelon', type: ProductType.Seasonal, seasonStartDate: new Date(NOW.getTime() - DAY), seasonEndDate: new Date(NOW.getTime() + (10 * DAY)),
			},
			{
				...normal, name: 'Grapes', type: ProductType.Seasonal, seasonStartDate: new Date(NOW.getTime() + DAY), seasonEndDate: new Date(NOW.getTime() + (10 * DAY)),
			},
		]);
		const response = await server.inject({method: 'POST', url: `/orders/${orderId}/processOrder`});
		expect(response.statusCode).toBe(200);
		expect(response.headers['content-type']).toMatch(/application\/json/);
		expect(response.json<unknown>()).toEqual({orderId});
		const stock = context.database.select().from(products).orderBy(products.id).all();
		expect(stock.map(product => product.available)).toEqual([2, 0, 2, 0, 2, 3]);
		expect(stock.map(product => product.leadTime)).toEqual([5, 10, 5, 5, 5, 5]);
		expect(notifications.sendDelayNotification).toHaveBeenCalledTimes(1);
		expect(notifications.sendDelayNotification).toHaveBeenCalledWith(10, 'Dongle');
		expect(notifications.sendExpirationNotification).toHaveBeenCalledTimes(1);
		expect(notifications.sendExpirationNotification).toHaveBeenCalledWith('Milk', new Date(NOW.getTime() - DAY));
		expect(notifications.sendOutOfStockNotification).toHaveBeenCalledTimes(1);
		expect(notifications.sendOutOfStockNotification).toHaveBeenCalledWith('Grapes');
	});

	it('notifies delay rather than expiration for unexpired empty stock', async () => {
		const orderId = createOrder([{
			...normal, available: 0, type: ProductType.Expirable, expiryDate: new Date(NOW.getTime() + DAY),
		}]);
		const response = await server.inject({method: 'POST', url: `/orders/${orderId}/processOrder`});
		expect(response.statusCode).toBe(200);
		expect(notifications.sendDelayNotification).toHaveBeenCalledWith(5, 'Cable');
		expect(notifications.sendExpirationNotification).not.toHaveBeenCalled();
	});

	it('notifies unavailability before the season even when restock fits in the season', async () => {
		const orderId = createOrder([{
			...normal, available: 0, type: ProductType.Seasonal,
			seasonStartDate: new Date(NOW.getTime() + DAY), seasonEndDate: new Date(NOW.getTime() + (10 * DAY)),
		}]);
		const response = await server.inject({method: 'POST', url: `/orders/${orderId}/processOrder`});
		expect(response.statusCode).toBe(200);
		expect(notifications.sendOutOfStockNotification).toHaveBeenCalledWith('Cable');
		expect(notifications.sendDelayNotification).not.toHaveBeenCalled();
	});

	it('does not touch products outside the order', async () => {
		const orderId = createOrder([normal]);
		context.database.insert(products).values({...normal, id: 99, name: 'Unrelated'}).run();
		await server.inject({method: 'POST', url: `/orders/${orderId}/processOrder`});
		expect(context.database.select().from(products).where(eq(products.id, 99)).get()?.available).toBe(3);
	});

	it('accepts an empty order', async () => {
		const orderId = createOrder([]);
		const response = await server.inject({method: 'POST', url: `/orders/${orderId}/processOrder`});
		expect(response.statusCode).toBe(200);
		expect(response.json<unknown>()).toEqual({orderId});
	});

	it.each(['abc', '0', '-1', '1.5', 'Infinity'])('rejects invalid order id %s', async orderId => {
		const response = await server.inject({method: 'POST', url: `/orders/${orderId}/processOrder`});
		expect(response.statusCode).toBe(400);
	});

	it('returns 404 for a missing order', async () => {
		const response = await server.inject({method: 'POST', url: '/orders/999/processOrder'});
		expect(response.statusCode).toBe(404);
		expect(response.json<{message: string}>().message).toBe('Order 999 was not found.');
	});

	it('rolls back all stock and sends no notifications if a later product is invalid', async () => {
		const orderId = createOrder([normal, {...normal, available: 0}, {...normal, type: ProductType.Expirable}]);
		const response = await server.inject({method: 'POST', url: `/orders/${orderId}/processOrder`});
		expect(response.statusCode).toBe(422);
		expect(context.database.select().from(products).all().map(product => product.available)).toEqual([3, 0, 3]);
		expect(notifications.sendDelayNotification).not.toHaveBeenCalled();
		expect(notifications.sendExpirationNotification).not.toHaveBeenCalled();
		expect(notifications.sendOutOfStockNotification).not.toHaveBeenCalled();
	});

	it('reports notification failures instead of returning success', async () => {
		notifications.sendDelayNotification.mockImplementationOnce(() => {
			throw new Error('Notification provider unavailable');
		});
		const orderId = createOrder([{...normal, available: 0}]);
		const response = await server.inject({method: 'POST', url: `/orders/${orderId}/processOrder`});
		expect(response.statusCode).toBe(500);
	});

	it('lists inventory and orders for the dashboard', async () => {
		const expiryDate = new Date(NOW.getTime() + DAY);
		const orderId = createOrder([{...normal, type: ProductType.Expirable, expiryDate}]);
		const inventoryResponse = await server.inject('/products');
		expect(inventoryResponse.statusCode).toBe(200);
		expect(inventoryResponse.json<unknown>()).toEqual([{
			...normal, id: 1, type: ProductType.Expirable, expiryDate: expiryDate.toISOString(),
		}]);
		const ordersResponse = await server.inject('/orders');
		expect(ordersResponse.json<unknown>()).toEqual([{id: orderId, productCount: 1}]);
	});

	it('serves the dashboard shell', async () => {
		const response = await server.inject('/');
		expect(response.statusCode).toBe(200);
		expect(response.headers['content-type']).toContain('text/html');
		expect(response.body).toContain('product-detail');
	});
});
