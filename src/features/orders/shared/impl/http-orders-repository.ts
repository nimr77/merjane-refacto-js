import {z} from 'zod';
import {type OrdersClientRepository} from '../../domain/repos/orders-client-repository.js';
import {ORDER_ROUTES, processOrderRoute} from '../../domain/const/order-routes.js';
import {apiRequest} from '@/shared/http/api-client.js';
import {HttpMethod} from '@/shared/http/http-method.js';

export class HttpOrdersRepository implements OrdersClientRepository {
	public async list() {
		return z.object({id: z.number().int().positive(), productCount: z.number().int().nonnegative()})
			.array().parse(await apiRequest(ORDER_ROUTES.list));
	}

	public async process(orderId: number) {
		return z.object({orderId: z.number().int().positive()})
			.parse(await apiRequest(processOrderRoute(orderId), HttpMethod.Post));
	}
}
