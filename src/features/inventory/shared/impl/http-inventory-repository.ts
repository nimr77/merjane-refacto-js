import {z} from 'zod';
import {type InventoryClientRepository} from '../../domain/repos/inventory-client-repository.js';
import {ProductType} from '../../domain/enums/product-type.js';
import {INVENTORY_ROUTES} from '../../domain/const/inventory-routes.js';
import {apiRequest} from '@/shared/http/api-client.js';

const base = z.object({
	id: z.number().int().positive(),
	name: z.string(),
	available: z.number().int().nonnegative(),
	leadTime: z.number().int().nonnegative(),
});

const productSchema = z.discriminatedUnion('type', [
	base.extend({type: z.literal(ProductType.Normal)}),
	base.extend({type: z.literal(ProductType.Seasonal), seasonStartDate: z.coerce.date(), seasonEndDate: z.coerce.date()}),
	base.extend({type: z.literal(ProductType.Expirable), expiryDate: z.coerce.date()}),
]);

export class HttpInventoryRepository implements InventoryClientRepository {
	public async list() {
		return productSchema.array().parse(await apiRequest(INVENTORY_ROUTES.list));
	}
}
