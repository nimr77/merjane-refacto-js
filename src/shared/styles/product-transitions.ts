export function applyProductTransitions(
	grid: HTMLElement,
	detail: HTMLDialogElement,
	selectedId: number | undefined,
): void {
	for (const artwork of grid.querySelectorAll<HTMLElement>('[data-product-art]')) {
		const id = Number(artwork.dataset['productArt']);
		artwork.style.setProperty('view-transition-name', id === selectedId ? 'none' : `product-${id}`);
	}

	const detailArtwork = detail.querySelector<HTMLElement>('[data-product-art]');
	if (detailArtwork && selectedId !== undefined) {
		detailArtwork.style.setProperty('view-transition-name', `product-${selectedId}`);
	}
}
