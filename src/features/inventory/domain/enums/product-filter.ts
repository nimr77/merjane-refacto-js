export enum ProductFilter {
	All = 'ALL',
	Normal = 'NORMAL',
	Seasonal = 'SEASONAL',
	Expirable = 'EXPIRABLE',
}

const productFilters = new Set<unknown>(Object.values(ProductFilter));

export function isProductFilter(value: unknown): value is ProductFilter {
	return productFilters.has(value);
}
