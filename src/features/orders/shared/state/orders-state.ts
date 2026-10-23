import {type OrderSummary} from '../../domain/models/order-summary.js';
import {type OrdersClientRepository} from '../../domain/repos/orders-client-repository.js';
import {ViewState} from '@/shared/state/view-state.js';

export class OrdersState extends ViewState {
	private items: OrderSummary[] = [];
	private readonly completed = new Set<number>();
	private active: number | undefined;
	private pending = false;
	private failure: string | undefined;

	public constructor(private readonly repository: OrdersClientRepository) {
		super();
	}

	public get orders(): readonly OrderSummary[] {
		return this.items;
	}

	public get processingId(): number | undefined {
		return this.active;
	}

	public get loading(): boolean {
		return this.pending;
	}

	public get error(): string | undefined {
		return this.failure;
	}

	public isCompleted(orderId: number): boolean {
		return this.completed.has(orderId);
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
			this.failure = error instanceof Error ? error.message : 'Unable to load orders.';
		} finally {
			this.pending = false;
			this.changed();
		}
	}

	public async process(orderId: number): Promise<boolean> {
		if (this.active !== undefined || this.completed.has(orderId)) {
			return false;
		}

		this.active = orderId;
		this.failure = undefined;
		this.changed();
		try {
			await this.repository.process(orderId);
			this.completed.add(orderId);
			return true;
		} catch (error) {
			this.failure = error instanceof Error ? error.message : 'Unable to process order.';
			return false;
		} finally {
			this.active = undefined;
			this.changed();
		}
	}
}
