import {type OrderRepository} from '../domain/repos/order-repository.js';
import {type ProcessedOrder} from '../domain/models/processed-order.js';
import {processProduct} from '@/features/inventory/shared/index.js';
import {type INotificationService, sendStockNotification} from '@/features/notifications/shared/index.js';
import {type Clock} from '@/shared/domain/clock.js';

export class ProcessOrder {
	public constructor(
		private readonly repository: OrderRepository,
		private readonly notifications: INotificationService,
		private readonly clock: Clock,
	) {}

	public execute(orderId: number): ProcessedOrder {
		const now = this.clock.now();
		const decisions = this.repository.process(orderId, product => processProduct(product, now));
		for (const decision of decisions) {
			if (decision.notification) {
				sendStockNotification(this.notifications, decision.notification);
			}
		}

		return {orderId};
	}
}
