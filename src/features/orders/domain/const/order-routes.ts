export const ORDER_ROUTES = {
	list: '/orders',
	process: '/orders/:orderId/processOrder',
} as const;

export function processOrderRoute(orderId: number): string {
	return ORDER_ROUTES.process.replace(':orderId', String(orderId));
}
