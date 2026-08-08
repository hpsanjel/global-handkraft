import { useEffect, useState } from "react";
import type { CategorySummary } from "@/lib/category-utils";

let inMemoryCategories: CategorySummary[] | null = null;

async function fetchCategoriesFromApi(): Promise<CategorySummary[]> {
	const response = await fetch("/api/categories", {
		method: "GET",
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Unable to fetch categories.");
	}

	const data = (await response.json()) as CategorySummary[];
	if (!Array.isArray(data)) {
		return [];
	}

	return data;
}

export async function refreshCategoriesCatalog() {
	if (typeof window === "undefined") {
		return;
	}

	inMemoryCategories = await fetchCategoriesFromApi();
	window.dispatchEvent(new Event("categories:updated"));
}

export function useCategoriesCatalog(initialCategories?: CategorySummary[]) {
	const [categories, setCategories] = useState<CategorySummary[]>(() => inMemoryCategories ?? initialCategories ?? []);

	useEffect(() => {
		let isDisposed = false;

		const syncCategories = async () => {
			try {
				if (inMemoryCategories) {
					setCategories(inMemoryCategories);
					return;
				}

				if (initialCategories) {
					inMemoryCategories = initialCategories;
					setCategories(initialCategories);
					return;
				}

				const nextCategories = await fetchCategoriesFromApi();
				inMemoryCategories = nextCategories;
				if (!isDisposed) {
					setCategories(nextCategories);
				}
			} catch {
				if (!isDisposed) {
					setCategories([]);
				}
			}
		};

		const handleCategoriesUpdated = () => {
			inMemoryCategories = null;
			void syncCategories();
		};

		void syncCategories();
		window.addEventListener("categories:updated", handleCategoriesUpdated);

		return () => {
			isDisposed = true;
			window.removeEventListener("categories:updated", handleCategoriesUpdated);
		};
		// initialCategories only seeds the first mount and shouldn't re-trigger this effect
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return categories;
}
