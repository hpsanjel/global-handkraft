import type { Product } from "@/types/store";

export const DEFAULT_SHIPPING_INFO = "Delivery in 1-3 business days across Norway and in 1-3 weeks across Europe.";
export const DEFAULT_RETURN_POLICY = "No return policy. All sales are final.";

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
	galleryColors: string[];
	featured: boolean;
	active: boolean;
	rating: number;
	reviewCount: number;
	dimensions: string | null;
	weight: string | null;
	category: {
		name: string;
		slug: string;
	};
	variants: Array<{
		id: string;
		name: string;
		color: string;
		price: number;
		width: string;
		height: string;
		depth: string;
		weight: string;
		stock: number;
	}>;
	addons: Array<{
		id: string;
		name: string;
		price: number;
		description: string;
	}>;
};

export function variantLabel(name?: string | null, color?: string | null): string {
	return [name?.trim(), color?.trim()].filter((part): part is string => Boolean(part)).join(" - ");
}

export function toStoreProduct(record: DbProductRecord): Product {
	const category = record.category.name;
	const material = record.material || "Mixed Artisan Materials";
	const firstVariant = record.variants[0];
	const gallery = record.gallery.length > 0 ? record.gallery : [record.image];
	// galleryColors is index-aligned with gallery; pad/truncate to stay in sync
	// with older records saved before per-photo colour tagging existed.
	const galleryColors = gallery.map((_, index) => record.galleryColors[index] ?? "");

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
		gallery,
		galleryColors,
		rating: record.rating,
		reviewCount: record.reviewCount,
		featured: record.featured,
		active: record.active,
		dimensions: record.dimensions ?? undefined,
		weight: record.weight ?? undefined,
		variants: record.variants.map((variant) => ({
			id: variant.id,
			name: variant.name,
			color: variant.color,
			price: variant.price,
			width: variant.width,
			height: variant.height,
			depth: variant.depth,
			weight: variant.weight,
			stock: variant.stock,
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
