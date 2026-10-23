import {processProduct} from '../domain/services/process-product.js';
import {type Product} from '../domain/models/product.js';
import {ProductType} from '../domain/enums/product-type.js';
import {StockNotificationType} from '../domain/enums/stock-notification-type.js';
import {type InventoryState, isProductFilter} from '../shared/index.js';
import {escapeHtml, element} from '@/shared/presentation/html.js';
import {AppRoute, productRoute} from '@/core/router/routes.js';
import {Tone} from '@/shared/styles/tone.js';
import {applyProductTransitions} from '@/shared/styles/product-transitions.js';

const LABELS: Record<ProductType, string> = {
	[ProductType.Normal]: 'Everyday', [ProductType.Seasonal]: 'Seasonal', [ProductType.Expirable]: 'Fresh',
};
const ICONS: Record<ProductType, string> = {
	[ProductType.Normal]: '▧', [ProductType.Seasonal]: '✳', [ProductType.Expirable]: '◒',
};

function availability(product: Product): {label: string; tone: Tone} {
	const now = new Date();
	const decision = processProduct(product, now);
	if (decision.notification?.type === StockNotificationType.Expired) {
		return {label: 'Expired', tone: Tone.Danger};
	}

	if (decision.notification?.type === StockNotificationType.Unavailable) {
		const outsideSeason = product.type === ProductType.Seasonal && (now < product.seasonStartDate || now > product.seasonEndDate);
		return {label: outsideSeason ? 'Out of season' : 'Unavailable', tone: Tone.Muted};
	}

	return product.available > 0 ? {label: 'In stock', tone: Tone.Success} : {label: 'Restocking', tone: Tone.Warning};
}

export function mountInventory(state: InventoryState): () => void {
	const grid = element('#product-grid', HTMLElement);
	const detail = element('#product-detail', HTMLDialogElement);
	const search = element('#search', HTMLInputElement);
	const filters = element('#filters', HTMLElement);

	search.addEventListener('input', () => {
		state.searchFor(search.value);
	});
	filters.addEventListener('click', event => {
		if (event.target instanceof HTMLButtonElement) {
			const {filter} = event.target.dataset;
			if (isProductFilter(filter)) {
				state.filterBy(filter);
			}
		}
	});
	grid.addEventListener('click', event => {
		const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-product]') : null;
		if (button) {
			window.location.hash = productRoute(Number(button.dataset['product']));
		}
	});
	detail.addEventListener('close', () => {
		if (window.location.hash.startsWith(`#${AppRoute.Product}/`)) {
			window.location.hash = AppRoute.Inventory;
		}
	});
	detail.addEventListener('click', event => {
		if (event.target instanceof Element && event.target.closest('[data-close]')) {
			window.location.hash = AppRoute.Inventory;
		}
	});
	detail.addEventListener('cancel', event => {
		event.preventDefault();
		window.location.hash = AppRoute.Inventory;
	});
	detail.addEventListener('keydown', event => {
		if (event.key === 'Escape') {
			event.preventDefault();
			window.location.hash = AppRoute.Inventory;
		}
	});

	const render = () => {
		element('#product-count', HTMLElement).textContent = `${state.visibleProducts.length} products`;
		element('#total-products', HTMLElement).textContent = String(state.products.length).padStart(2, '0');
		element('#total-units', HTMLElement).textContent = String(state.products.reduce((sum, product) => sum + product.available, 0));
		element('#attention-count', HTMLElement).textContent = String(state.products.filter(product => availability(product).tone !== Tone.Success).length).padStart(2, '0');
		for (const button of filters.querySelectorAll('button')) {
			button.setAttribute('aria-pressed', String(button.dataset['filter'] === state.filter));
		}

		element('#inventory-error', HTMLElement).textContent = state.error ?? '';
		grid.setAttribute('aria-busy', String(state.loading));
		const {selectedProduct} = state;
		grid.innerHTML = state.visibleProducts.map(product => {
			const status = availability(product);
			return `<button class="product-card" data-product="${product.id}" aria-label="View ${escapeHtml(product.name)}">
				<span class="product-art ${product.type.toLowerCase()}" data-product-art="${product.id}"><span>${ICONS[product.type]}</span><small>${LABELS[product.type]}</small></span>
				<span class="card-body"><span class="card-top"><span class="eyebrow">${LABELS[product.type]}</span><span class="card-arrow" aria-hidden="true">↗</span></span>
				<strong>${escapeHtml(product.name)}</strong><span class="card-bottom"><span class="badge ${status.tone}">${status.label}</span><span>${product.available} units</span></span></span>
			</button>`;
		}).join('');
		if (state.visibleProducts.length === 0) {
			grid.innerHTML = `<div class="empty">${state.loading ? 'Loading inventory…' : (state.products.length > 0 ? 'No products match your filters.' : 'Your shelves are ready. Run pnpm demo to add sample inventory, then refresh.')}</div>`;
		}

		const product = state.selectedProduct;
		if (product) {
			const status = availability(product);
			const date = product.type === ProductType.Seasonal
				? `Season · ${product.seasonStartDate.toLocaleDateString()} — ${product.seasonEndDate.toLocaleDateString()}`
				: (product.type === ProductType.Expirable ? `Expires · ${product.expiryDate.toLocaleDateString()}` : 'Available throughout the year');
			detail.innerHTML = `<button class="close-button" data-close aria-label="Close product details">×</button>
				<div class="detail-art product-art ${product.type.toLowerCase()}" data-product-art="${product.id}">${ICONS[product.type]}</div>
				<div class="detail-body"><p class="eyebrow">${LABELS[product.type]} / Product ${product.id}</p>
				<h2>${escapeHtml(product.name)}</h2><span class="badge ${status.tone}">${status.label}</span>
				<dl><div><dt>Physical stock</dt><dd>${product.available} units</dd></div><div><dt>Replenishment</dt><dd>${product.leadTime} days</dd></div></dl>
				<p class="muted">${escapeHtml(date)}</p></div>`;
			if (!detail.open) {
				detail.showModal();
			}
		} else if (detail.open) {
			detail.close();
		}

		applyProductTransitions(grid, detail, selectedProduct?.id);
	};

	render();
	return state.subscribe(render);
}
