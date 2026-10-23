export enum ProductType {
	Normal = 'NORMAL',
	Seasonal = 'SEASONAL',
	Expirable = 'EXPIRABLE',
}

const productTypes = new Set<unknown>(Object.values(ProductType));

export function isProductType(value: unknown): value is ProductType {
	return productTypes.has(value);
}
