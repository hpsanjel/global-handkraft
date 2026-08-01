import type { Product } from "@/types/store";

const DEFAULT_SHIPPING_INFO = "Delivery in 3-7 business days across Norway and Europe.";
const DEFAULT_RETURN_POLICY = "Returns within 14 days for unused items in original packaging.";

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

function inferColorFromMaterial(material: string) {
	const value = material.toLowerCase();
	if (value.includes("brass") || value.includes("copper")) {
		return "Brass and Copper";
	}
	if (value.includes("gold")) {
		return "Gold Accent";
	}
	if (value.includes("rosewood")) {
		return "Rosewood Tone";
	}
	if (value.includes("teak") || value.includes("sheesham") || value.includes("wood")) {
		return "Natural Wood";
	}

	return "Natural";
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
		slug: string;
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
	const category = record.category.name;
	const material = record.material || "Mixed Artisan Materials";
	const firstVariant = record.variants[0];

	return {
		id: record.id,
		slug: record.slug,
		name: record.name,
		shortDescription: record.shortDescription,
		description: record.description,
		category,
		categorySlug: record.category.slug,
		material,
		materials: [material],
		woodType: inferWoodType(material),
		sizeLabel: firstVariant?.name ?? "Standard",
		color: inferColorFromMaterial(material),
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
