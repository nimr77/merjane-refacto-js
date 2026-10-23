import {
	describe, expect, it, vi,
} from 'vitest';
import {type Product} from '../../domain/models/product.js';
import {ProductFilter} from '../../domain/enums/product-filter.js';
import {InventoryState} from './inventory-state.js';
import {ProductType} from '@/features/inventory/domain/enums/product-type.js';

const items: Product[] = [
	{
		id: 1, name: 'Olive oil', available: 3, leadTime: 2, type: ProductType.Normal,
	},
	{
		id: 2, name: 'Milk', available: 0, leadTime: 1, type: ProductType.Expirable, expiryDate: new Date('2027-01-01'),
	},
];

describe('Inventory state', () => {
	it('requests the repository and notifies the UI of loading and loaded states', async () => {
		const list = vi.fn(async () => items);
		const state = new InventoryState({list});
		const snapshots: boolean[] = [];
		const unsubscribe = state.subscribe(() => snapshots.push(state.loading));
		await state.load();
		expect(list).toHaveBeenCalledTimes(1);
		expect(snapshots).toEqual([true, false]);
		expect(state.products).toEqual(items);
		unsubscribe();
		state.searchFor('oil');
		expect(snapshots).toHaveLength(2);
	});

	it('combines local search and category filters without requesting the repo', async () => {
		const list = vi.fn(async () => items);
		const state = new InventoryState({list});
		await state.load();
		state.searchFor('MILK');
		expect(state.visibleProducts.map(product => product.id)).toEqual([2]);
		state.filterBy(ProductFilter.Normal);
		expect(state.filter).toBe(ProductFilter.Normal);
		expect(state.visibleProducts).toEqual([]);
		state.searchFor('');
		expect(state.visibleProducts.map(product => product.id)).toEqual([1]);
		expect(list).toHaveBeenCalledTimes(1);
	});

	it('resolves selection from the latest repository data', async () => {
		const updatedItems = items.map(product => product.id === 1 ? {...product, available: 2} : product);
		const list = vi.fn<never[], Promise<Product[]>>().mockResolvedValueOnce(items).mockResolvedValueOnce(updatedItems);
		const state = new InventoryState({list});
		state.select(1);
		await state.load();
		expect(state.selectedProduct?.available).toBe(3);
		await state.load();
		expect(state.selectedProduct?.available).toBe(2);
		state.select(undefined);
		expect(state.selectedProduct).toBeUndefined();
	});

	it('keeps the last inventory and surfaces a refresh failure, then allows recovery', async () => {
		const list = vi.fn<never[], Promise<Product[]>>().mockResolvedValueOnce(items).mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(items);
		const state = new InventoryState({list});
		await state.load();
		await state.load();
		expect(state.products).toEqual(items);
		expect(state.error).toBe('Offline');
		expect(state.loading).toBe(false);
		await state.load();
		expect(state.error).toBeUndefined();
	});

	it('coalesces concurrent loads', async () => {
		let finish: (value: Product[]) => void = () => {
			throw new Error('Request has not started.');
		};

		const list = vi.fn(async () => new Promise<Product[]>(resolve => {
			finish = resolve;
		}));
		const state = new InventoryState({list});
		const pending = state.load();
		await state.load();
		expect(list).toHaveBeenCalledTimes(1);
		finish(items);
		await pending;
		expect(state.loading).toBe(false);
	});

	it('surfaces a message when a repository rejects with a non-Error value', async () => {
		const state = new InventoryState({list: vi.fn<never[], Promise<Product[]>>().mockRejectedValue('Offline')});
		await state.load();
		expect(state.error).toBe('Unable to load inventory.');
		expect(state.loading).toBe(false);
	});
});
