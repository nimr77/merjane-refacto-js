import {
	describe, it, expect, vi,
} from 'vitest';
import {type OrderSummary} from '../../domain/models/order-summary.js';
import {OrdersState} from './orders-state.js';

describe('Orders state', () => {
	it('loads order summaries through its repository', async () => {
		const list = vi.fn(async () => [{id: 1, productCount: 2}]);
		const state = new OrdersState({list, process: async orderId => ({orderId})});
		const listener = vi.fn();
		state.subscribe(listener);
		await state.load();
		expect(state.orders).toEqual([{id: 1, productCount: 2}]);
		expect(state.loading).toBe(false);
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it('processes via its repo and prevents a second submission in the session', async () => {
		const process = vi.fn(async (orderId: number) => ({orderId}));
		const state = new OrdersState({list: async () => [], process});
		expect(await state.process(4)).toBe(true);
		expect(state.isCompleted(4)).toBe(true);
		expect(await state.process(4)).toBe(false);
		expect(process).toHaveBeenCalledTimes(1);
		expect(process).toHaveBeenCalledWith(4);
	});

	it('blocks concurrent order submissions while the repository is pending', async () => {
		let finish: (value: {orderId: number}) => void = () => {
			throw new Error('Request has not started.');
		};

		const process = vi.fn(async () => new Promise<{orderId: number}>(resolve => {
			finish = resolve;
		}));
		const state = new OrdersState({list: async () => [], process});
		const pending = state.process(1);
		expect(state.processingId).toBe(1);
		expect(await state.process(2)).toBe(false);
		finish({orderId: 1});
		expect(await pending).toBe(true);
		expect(state.processingId).toBeUndefined();
		expect(process).toHaveBeenCalledTimes(1);
	});

	it('surfaces process failures without marking the order complete', async () => {
		const process = vi.fn<[number], Promise<{orderId: number}>>().mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce({orderId: 1});
		const state = new OrdersState({list: async () => [], process});
		expect(await state.process(1)).toBe(false);
		expect(state.error).toBe('Unavailable');
		expect(state.isCompleted(1)).toBe(false);
		expect(state.processingId).toBeUndefined();
		expect(await state.process(1)).toBe(true);
		expect(state.error).toBeUndefined();
	});

	it('surfaces list errors and resets loading', async () => {
		const state = new OrdersState({
			async list() {
				throw new Error('Cannot list orders');
			},
			process: async orderId => ({orderId}),
		});
		await state.load();
		expect(state.error).toBe('Cannot list orders');
		expect(state.loading).toBe(false);
	});

	it('prevents duplicate load requests while loading', async () => {
		let finish: (value: OrderSummary[]) => void = () => {
			throw new Error('Request has not started.');
		};

		const list = vi.fn(async () => new Promise<OrderSummary[]>(resolve => {
			finish = resolve;
		}));
		const state = new OrdersState({list, process: async orderId => ({orderId})});
		const pending = state.load();
		await state.load();
		expect(list).toHaveBeenCalledTimes(1);
		finish([]);
		await pending;
		expect(state.loading).toBe(false);
	});

	it('surfaces messages for non-Error rejections from either repository operation', async () => {
		const state = new OrdersState({
			list: vi.fn<never[], Promise<OrderSummary[]>>().mockRejectedValue('Offline'),
			process: vi.fn<[number], Promise<{orderId: number}>>().mockRejectedValue('Offline'),
		});
		await state.load();
		expect(state.error).toBe('Unable to load orders.');
		expect(await state.process(1)).toBe(false);
		expect(state.error).toBe('Unable to process order.');
		expect(state.isCompleted(1)).toBe(false);
	});
});
