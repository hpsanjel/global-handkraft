export type CategorySummary = {
	id: string;
	name: string;
	slug: string;
	productCount: number;
	imagePath?: string | null;
	imageUrl?: string | null;
};

export function createCategorySlug(categoryName: string) {
	return categoryName
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}
