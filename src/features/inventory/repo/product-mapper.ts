import {type Product} from '../domain/models/product.js';
import {isProductType, ProductType} from '../domain/enums/product-type.js';
import {type Product as ProductRow} from '@/core/db/schema.js';
import {InvalidProductError} from '@/shared/domain/errors.js';

function requiredDate(value: ProductRow['expiryDate'], productId: number, field: string): Date {
	if (!value || !Number.isFinite(value.getTime())) {
		throw new InvalidProductError(productId, `${field} must be a valid date.`);
	}

	return value;
}

export function toProduct(row: ProductRow): Product {
	const {type} = row;
	if (!isProductType(type)) {
		throw new InvalidProductError(row.id, `unsupported type "${type}".`);
	}

	if (!Number.isInteger(row.available) || row.available < 0 || !Number.isInteger(row.leadTime) || row.leadTime < 0) {
		throw new InvalidProductError(row.id, 'stock and lead time must be non-negative integers.');
	}

	const base = {
		id: row.id, name: row.name, available: row.available, leadTime: row.leadTime,
	};
	switch (type) {
		case ProductType.Normal: {
			return {...base, type: ProductType.Normal};
		}

		case ProductType.Expirable: {
			return {...base, type: ProductType.Expirable, expiryDate: requiredDate(row.expiryDate, row.id, 'expiryDate')};
		}

		case ProductType.Seasonal: {
			const seasonStartDate = requiredDate(row.seasonStartDate, row.id, 'seasonStartDate');
			const seasonEndDate = requiredDate(row.seasonEndDate, row.id, 'seasonEndDate');
			if (seasonStartDate > seasonEndDate) {
				throw new InvalidProductError(row.id, 'season start must not follow season end.');
			}

			return {
				...base, type: ProductType.Seasonal, seasonStartDate, seasonEndDate,
			};
		}
	}
}
