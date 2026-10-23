import {type ProductType} from '../enums/product-type.js';

type ProductBase = {
	readonly id: number;
	readonly name: string;
	readonly available: number;
	readonly leadTime: number;
};

export type Product = ProductBase & (
	| {readonly type: ProductType.Normal}
	| {readonly type: ProductType.Seasonal; readonly seasonStartDate: Date; readonly seasonEndDate: Date}
	| {readonly type: ProductType.Expirable; readonly expiryDate: Date}
);
