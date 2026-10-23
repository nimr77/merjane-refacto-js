import {type InventoryRepository} from '../domain/repos/inventory-repository.js';
import {toProduct} from './product-mapper.js';
import {products} from '@/core/db/schema.js';
import {type Database} from '@/core/db/type.js';

export class SqliteInventoryRepository implements InventoryRepository {
	public constructor(private readonly database: Database) {}

	public list() {
		return this.database.select().from(products).orderBy(products.id).all().map(row => toProduct(row));
	}
}
