import {type Product} from '../models/product.js';
import {type StockDecision} from '../models/stock-decision.js';
import {ProductType} from '../enums/product-type.js';
import {StockNotificationType} from '../enums/stock-notification-type.js';
import {MILLISECONDS_PER_DAY} from '../const/time.js';

function sellOrDelay(product: Product): StockDecision {
	if (product.available > 0) {
		return {product: {...product, available: product.available - 1}};
	}

	return {
		product,
		notification: {type: StockNotificationType.Delay, productName: product.name, leadTime: product.leadTime},
	};
}

export function processProduct(product: Product, now: Date): StockDecision {
	switch (product.type) {
		case ProductType.Normal: {
			return sellOrDelay(product);
		}

		case ProductType.Seasonal: {
			if (now < product.seasonStartDate || now > product.seasonEndDate) {
				return {product, notification: {type: StockNotificationType.Unavailable, productName: product.name}};
			}

			const restockDate = now.getTime() + (product.leadTime * MILLISECONDS_PER_DAY);
			if (product.available === 0 && restockDate > product.seasonEndDate.getTime()) {
				return {product, notification: {type: StockNotificationType.Unavailable, productName: product.name}};
			}

			return sellOrDelay(product);
		}

		case ProductType.Expirable: {
			if (now > product.expiryDate) {
				return {
					product: {...product, available: 0},
					notification: {type: StockNotificationType.Expired, productName: product.name, expiryDate: product.expiryDate},
				};
			}

			return sellOrDelay(product);
		}
	}
}
