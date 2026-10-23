import {eq} from 'drizzle-orm';
import {type OrderRepository} from '../domain/repos/order-repository.js';
import {orders, products} from '@/core/db/schema.js';
import {type Database} from '@/core/db/type.js';
import {toProduct, type Product, type StockDecision} from '@/features/inventory/shared/index.js';
import {OrderNotFoundError} from '@/shared/domain/errors.js';

export class SqliteOrderRepository implements OrderRepository {
	public constructor(private readonly database: Database) {}

	public list() {
		return this.database.query.orders.findMany({with: {products: true}}).sync()
			.map(order => ({id: order.id, productCount: order.products.length}));
	}

	public process(orderId: number, decide: (product: Product) => StockDecision): StockDecision[] {
		return this.database.transaction(tx => {
			const order = tx.query.orders.findFirst({
				where: eq(orders.id, orderId),
				with: {products: {with: {product: true}}},
			}).sync();
			if (!order) {
				throw new OrderNotFoundError(orderId);
			}

			return order.products.map(({product: row}) => {
				const decision = decide(toProduct(row));
				tx.update(products).set({available: decision.product.available}).where(eq(products.id, row.id)).run();
				return decision;
			});
		});
	}
}
