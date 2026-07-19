export type ProductVariant = {
	id: string;
	name: string;
	price: number;
	width: string;
	height: string;
	depth: string;
	weight: string;
	stock: number;
	sku: string;
};

export type ProductAddon = {
	id: string;
	name: string;
	price: number;
	description: string;
};

export type Product = {
	id: string;
	slug: string;
	name: string;
	shortDescription: string;
	description: string;
	category: string;
	material: string;
	image: string;
	gallery: string[];
	rating: number;
	reviewCount: number;
	featured: boolean;
	variants: ProductVariant[];
	addons: ProductAddon[];
	shippingInfo: string;
	returnPolicy: string;
};

export type CartItem = {
	productId: string;
	name: string;
	variantId: string;
	variantName: string;
	price: number;
	quantity: number;
	image: string;
	addonIds: string[];
};
