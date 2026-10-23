import {type OrderSummary} from '../models/order-summary.js';
import {type Product, type StockDecision} from '@/features/inventory/shared/index.js';

export type OrderRepository = {
	list(): OrderSummary[];
	process(orderId: number, decide: (product: Product) => StockDecision): StockDecision[];
};
