import {type Product} from '../../domain/models/product.js';
import {type InventoryClientRepository} from '../../domain/repos/inventory-client-repository.js';
import {FILTER_PRODUCT_TYPES} from '../../domain/const/product-filters.js';
import {ProductFilter} from '../../domain/enums/product-filter.js';
import {ViewState} from '@/shared/state/view-state.js';

export class InventoryState extends ViewState {
	private items: Product[] = [];
	private search = '';
	private category = ProductFilter.All;
	private selected: number | undefined;
	private pending = false;
	private failure: string | undefined;

	public constructor(private readonly repository: InventoryClientRepository) {
		super();
	}

	public get products(): readonly Product[] {
		return this.items;
	}

	public get loading(): boolean {
		return this.pending;
	}

	public get error(): string | undefined {
		return this.failure;
	}

	public get filter(): ProductFilter {
		return this.category;
	}

	public get selectedProduct(): Product | undefined {
		return this.items.find(product => product.id === this.selected);
	}

	public get visibleProducts(): readonly Product[] {
		const productType = FILTER_PRODUCT_TYPES[this.category];
		return this.items.filter(product => (productType === undefined || product.type === productType)
			&& product.name.toLocaleLowerCase().includes(this.search.toLocaleLowerCase()));
	}

	public searchFor(query: string): void {
		this.search = query;
		this.changed();
	}

	public filterBy(filter: ProductFilter): void {
		this.category = filter;
		this.changed();
	}

	public select(id: number | undefined): void {
		this.selected = id;
		this.changed();
	}

	public async load(): Promise<void> {
		if (this.pending) {
			return;
		}

		this.pending = true;
		this.failure = undefined;
		this.changed();
		try {
			this.items = await this.repository.list();
		} catch (error) {
			this.failure = error instanceof Error ? error.message : 'Unable to load inventory.';
		} finally {
			this.pending = false;
			this.changed();
		}
	}
}
