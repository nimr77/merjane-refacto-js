import {type FastifyInstance} from 'fastify';
import {INVENTORY_ROUTES} from '../domain/const/inventory-routes.js';

export async function inventoryRoutes(server: FastifyInstance): Promise<void> {
	server.get(INVENTORY_ROUTES.list, async () => server.diContainer.resolve('inventoryRepository').list());
}
