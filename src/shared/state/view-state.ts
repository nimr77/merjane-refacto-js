export abstract class ViewState {
	private readonly listeners = new Set<() => void>();

	public subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	protected changed(): void {
		for (const listener of this.listeners) {
			listener();
		}
	}
}
