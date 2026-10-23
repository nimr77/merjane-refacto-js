import {type FastifyInstance} from 'fastify';
import {type ZodTypeProvider} from 'fastify-type-provider-zod';
import {z} from 'zod';
import {ORDER_ROUTES} from '../domain/const/order-routes.js';

export async function orderRoutes(server: FastifyInstance): Promise<void> {
	const api = server.withTypeProvider<ZodTypeProvider>();
	api.get(ORDER_ROUTES.list, async () => server.diContainer.resolve('orderRepository').list());
	api.post(ORDER_ROUTES.process, {
		schema: {params: z.object({orderId: z.coerce.number().int().positive()})},
	}, async request => server.diContainer.resolve('processOrder').execute(request.params.orderId));
}
