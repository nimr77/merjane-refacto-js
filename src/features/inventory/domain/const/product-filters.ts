import {ProductType} from '../enums/product-type.js';
import {ProductFilter} from '../enums/product-filter.js';

export const FILTER_PRODUCT_TYPES: Record<ProductFilter, ProductType | undefined> = {
	[ProductFilter.All]: undefined,
	[ProductFilter.Normal]: ProductType.Normal,
	[ProductFilter.Seasonal]: ProductType.Seasonal,
	[ProductFilter.Expirable]: ProductType.Expirable,
};
