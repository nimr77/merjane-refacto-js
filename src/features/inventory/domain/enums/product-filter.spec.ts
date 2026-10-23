import {describe, expect, it} from 'vitest';
import {FILTER_PRODUCT_TYPES} from '../const/product-filters.js';
import {ProductType} from './product-type.js';
import {isProductFilter, ProductFilter} from './product-filter.js';

describe('Product filter enum boundary', () => {
	it.each(Object.values(ProductFilter))('accepts filter %s', filter => {
		expect(isProductFilter(filter)).toBe(true);
	});

	it.each([undefined, null, '', 'UNKNOWN', 'normal', 1, {}])('rejects invalid filter %j', value => {
		expect(isProductFilter(value)).toBe(false);
	});

	it('maps each category filter to its domain type without conflating enums', () => {
		expect(FILTER_PRODUCT_TYPES).toEqual({
			[ProductFilter.All]: undefined,
			[ProductFilter.Normal]: ProductType.Normal,
			[ProductFilter.Seasonal]: ProductType.Seasonal,
			[ProductFilter.Expirable]: ProductType.Expirable,
		});
	});
});
