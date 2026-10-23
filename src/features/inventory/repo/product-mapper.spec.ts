import {describe, it, expect} from 'vitest';
import {toProduct} from './product-mapper.js';
import {ProductType} from '@/features/inventory/domain/enums/product-type.js';
import {type Product} from '@/core/db/schema.js';

const row: Product = {
	id: 1, name: 'Milk', type: ProductType.Normal, leadTime: 2, available: 5,
	expiryDate: null, seasonStartDate: null, seasonEndDate: null,
};

describe('Product persistence mapping', () => {
	it('maps a normal product without leaking nullable storage fields', () => {
		expect(toProduct(row)).toEqual({
			id: 1, name: 'Milk', type: ProductType.Normal, leadTime: 2, available: 5,
		});
	});

	it.each([
		{type: 'UNKNOWN'},
		{available: -1},
		{available: 0.5},
		{leadTime: -1},
		{type: ProductType.Expirable},
		{type: ProductType.Expirable, expiryDate: new Date('invalid')},
		{type: ProductType.Seasonal},
		{type: ProductType.Seasonal, seasonStartDate: new Date('2026-02-01'), seasonEndDate: new Date('2026-01-01')},
	])('rejects invalid persisted data: %j', patch => {
		expect(() => toProduct({...row, ...patch})).toThrow(/Product 1:/);
	});
});
