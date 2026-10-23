export enum AppRoute {
	Inventory = 'inventory',
	Orders = 'orders',
	Product = 'product',
}

const appRoutes = new Set<unknown>(Object.values(AppRoute));

export function isAppRoute(value: unknown): value is AppRoute {
	return appRoutes.has(value);
}

export function productRoute(productId: number): string {
	return `${AppRoute.Product}/${productId}`;
}
