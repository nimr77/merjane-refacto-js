import {type Cradle} from '@fastify/awilix';
import {asClass, asFunction, asValue} from 'awilix';
import {type FastifyBaseLogger, type FastifyInstance} from 'fastify';
import {type Database} from '../db/type.js';
import {NotificationService} from '@/services/impl/notification.service.js';
import {type INotificationService} from '@/features/notifications/shared/index.js';
import {type InventoryRepository} from '@/features/inventory/shared/index.js';
import {SqliteInventoryRepository} from '@/features/inventory/repo/sqlite-inventory-repository.js';
import {type OrderRepository} from '@/features/orders/shared/index.js';
import {SqliteOrderRepository} from '@/features/orders/repo/sqlite-order-repository.js';
import {ProcessOrder} from '@/features/orders/application/process-order.js';
import {type Clock, systemClock} from '@/shared/domain/clock.js';

declare module '@fastify/awilix' {
	interface Cradle { // eslint-disable-line @typescript-eslint/consistent-type-definitions
		logger: FastifyBaseLogger;
		db: Database;
		ns: INotificationService;
		clock: Clock;
		inventoryRepository: InventoryRepository;
		orderRepository: OrderRepository;
		processOrder: ProcessOrder;
	}
}

export async function configureDiContext(server: FastifyInstance): Promise<void> {
	server.diContainer.register({
		logger: asValue(server.log),
		db: asValue(server.database),
		ns: asClass(NotificationService),
		clock: asValue(systemClock),
		inventoryRepository: asFunction<InventoryRepository>(({db}: Cradle) => new SqliteInventoryRepository(db)),
		orderRepository: asFunction<OrderRepository>(({db}: Cradle) => new SqliteOrderRepository(db)),
		processOrder: asFunction(({orderRepository, ns, clock}: Cradle) => new ProcessOrder(orderRepository, ns, clock)),
	});
}
