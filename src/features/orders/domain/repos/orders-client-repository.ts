import {type OrderSummary} from '../models/order-summary.js';
import {type ProcessedOrder} from '../models/processed-order.js';

export type OrdersClientRepository = {
	list(): Promise<OrderSummary[]>;
	process(orderId: number): Promise<ProcessedOrder>;
};
