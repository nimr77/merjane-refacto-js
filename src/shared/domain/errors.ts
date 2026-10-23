export class OrderNotFoundError extends Error {
	public get statusCode() {
		return 404;
	}

	public constructor(orderId: number) {
		super(`Order ${orderId} was not found.`);
	}
}

export class InvalidProductError extends Error {
	public get statusCode() {
		return 422;
	}

	public constructor(productId: number, reason: string) {
		super(`Product ${productId}: ${reason}`);
	}
}
