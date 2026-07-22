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
	shippingNote?: string;
};

export type ProductAddon = {
	id: string;
	name: string;
	price: number;
	description: string;
};

export type ProductReview = {
	id: string;
	author: string;
	rating: number;
	title: string;
	comment: string;
	date: string;
};

export type Product = {
	id: string;
	slug: string;
	name: string;
	shortDescription: string;
	description: string;
	category: string;
	material: string;
	materials?: string[];
	woodType?: string;
	sizeLabel?: string;
	color?: string;
	image: string;
	gallery: string[];
	rating: number;
	reviewCount: number;
	featured: boolean;
	variants: ProductVariant[];
	addons: ProductAddon[];
	shippingInfo: string;
	returnPolicy: string;
	handmadeProcess?: string;
	handcraftedStory?: string;
	dimensions?: string;
	weight?: string;
	careInstructions?: string;
	specifications?: string[];
	reviews?: ProductReview[];
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
