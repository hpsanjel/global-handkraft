import type { Product } from "@/types/store";

const DEFAULT_SHIPPING_INFO = "Delivery in 3-7 business days across Norway and Europe.";
const DEFAULT_RETURN_POLICY = "Returns within 14 days for unused items in original packaging.";

const categoryAliases: Record<string, string> = {
	Temples: "Handcrafted Wooden Temples",
	Clothes: "Traditional Clothes",
	Pooja: "Pooja Items",
	Mandap: "Pooja Mandap",
	Gifts: "Gift Collection",
};

function normalizeCategory(categoryName: string) {
	return categoryAliases[categoryName] ?? categoryName;
}

function inferWoodType(material: string) {
	const value = material.toLowerCase();
	if (value.includes("rosewood")) {
		return "Rosewood";
	}
	if (value.includes("teak")) {
		return "Teak";
	}
	if (value.includes("sheesham")) {
		return "Sheesham";
	}
	if (value.includes("wood")) {
		return "Mixed Wood";
	}

	return "Not Applicable";
}

function inferColor(category: string) {
	if (category === "Traditional Clothes") {
		return "Festive Multi Tone";
	}
	if (category === "Pooja Items") {
		return "Brass and Copper";
	}
	if (category === "Pooja Mandap") {
		return "Natural and Gold Accent";
	}

	return "Natural Wood";
}

type DbProductRecord = {
	id: string;
	slug: string;
	name: string;
	shortDescription: string;
	description: string;
	material: string;
	image: string;
	gallery: string[];
	featured: boolean;
	rating: number;
	reviewCount: number;
	category: {
		name: string;
	};
	variants: Array<{
		id: string;
		name: string;
		price: number;
		width: string;
		height: string;
		depth: string;
		weight: string;
		stock: number;
		sku: string;
	}>;
	addons: Array<{
		id: string;
		name: string;
		price: number;
		description: string;
	}>;
};

export function toStoreProduct(record: DbProductRecord): Product {
	const category = normalizeCategory(record.category.name);
	const material = record.material || "Mixed Artisan Materials";
	const firstVariant = record.variants[0];

	return {
		id: record.id,
		slug: record.slug,
		name: record.name,
		shortDescription: record.shortDescription,
		description: record.description,
		category,
		material,
		materials: [material],
		woodType: inferWoodType(material),
		sizeLabel: firstVariant?.name ?? "Standard",
		color: inferColor(category),
		image: record.image,
		gallery: record.gallery.length > 0 ? record.gallery : [record.image],
		rating: record.rating,
		reviewCount: record.reviewCount,
		featured: record.featured,
		variants: record.variants.map((variant) => ({
			id: variant.id,
			name: variant.name,
			price: variant.price,
			width: variant.width,
			height: variant.height,
			depth: variant.depth,
			weight: variant.weight,
			stock: variant.stock,
			sku: variant.sku,
		})),
		addons: record.addons.map((addon) => ({
			id: addon.id,
			name: addon.name,
			price: addon.price,
			description: addon.description,
		})),
		shippingInfo: DEFAULT_SHIPPING_INFO,
		returnPolicy: DEFAULT_RETURN_POLICY,
	};
}

export function resolveCategoryForDb(categoryName: string) {
	return normalizeCategory(categoryName);
}

export function createCategorySlug(categoryName: string) {
	return normalizeCategory(categoryName)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}
