import type { Product } from "@/types/store";

export const products: Product[] = [
	{
		id: "temple-aurora",
		slug: "aurora-wooden-temple",
		name: "Aurora Wooden Temple",
		shortDescription: "A sculpted statement temple for intimate spiritual spaces.",
		description: "Handcrafted in premium sheesham wood with smooth joinery and a refined lacquer finish. Designed for modern homes with timeless ritual presence.",
		category: "Temples",
		material: "Sheesham Wood",
		image: "/images/temple-1.webp",
		gallery: ["/images/temple-1.webp", "/images/temple-2.jpg", "/images/temple-3.webp"],
		rating: 4.9,
		reviewCount: 128,
		featured: true,
		shippingInfo: "Ships within 3-5 business days with white-glove packaging.",
		returnPolicy: "Free returns within 14 days for unused items.",
		variants: [
			{ id: "small", name: "Small", price: 149, width: "45 cm", height: "90 cm", depth: "35 cm", weight: "12 kg", stock: 8, sku: "AUR-S" },
			{ id: "medium", name: "Medium", price: 199, width: "55 cm", height: "110 cm", depth: "42 cm", weight: "16 kg", stock: 5, sku: "AUR-M" },
			{ id: "large", name: "Large", price: 299, width: "70 cm", height: "135 cm", depth: "50 cm", weight: "24 kg", stock: 3, sku: "AUR-L" },
			{ id: "xl", name: "XL", price: 399, width: "85 cm", height: "160 cm", depth: "60 cm", weight: "31 kg", stock: 2, sku: "AUR-XL" },
		],
		addons: [
			{ id: "led", name: "LED Lighting", price: 30, description: "Warm ambient lighting for the shrine" },
			{ id: "drawer", name: "Drawer", price: 45, description: "Storage drawer for ritual essentials" },
			{ id: "polish", name: "Premium Polish", price: 70, description: "Deep lacquer finish with richer grain" },
			{ id: "glass", name: "Glass Door", price: 85, description: "Elegant glass-front cabinet" },
		],
	},
	{
		id: "temple-sage",
		slug: "sage-harvest-temple",
		name: "Sage Harvest Temple",
		shortDescription: "A serene temple with hand-carved detailing and balanced proportions.",
		description: "Crafted from oak and walnut with layered detailing and a satin finish that feels cathedral calm in your sanctuary.",
		category: "Temples",
		material: "Oak & Walnut",
		image: "/images/temple-2.jpg",
		gallery: ["/images/temple-2.jpg", "/images/temple-3.webp", "/images/temple-1.webp"],
		rating: 4.8,
		reviewCount: 97,
		featured: true,
		shippingInfo: "Ships within 5-7 business days with climate-safe packaging.",
		returnPolicy: "Free returns within 14 days for unused items.",
		variants: [
			{ id: "small", name: "Small", price: 189, width: "48 cm", height: "95 cm", depth: "36 cm", weight: "13 kg", stock: 7, sku: "SAGE-S" },
			{ id: "medium", name: "Medium", price: 249, width: "58 cm", height: "118 cm", depth: "44 cm", weight: "18 kg", stock: 4, sku: "SAGE-M" },
			{ id: "large", name: "Large", price: 329, width: "72 cm", height: "142 cm", depth: "52 cm", weight: "26 kg", stock: 2, sku: "SAGE-L" },
		],
		addons: [
			{ id: "drawer", name: "Drawer", price: 45, description: "Storage drawer for ritual essentials" },
			{ id: "polish", name: "Premium Polish", price: 70, description: "Deep lacquer finish with richer grain" },
		],
	},
	{
		id: "altar-vela",
		slug: "vela-altar-stand",
		name: "Vela Altar Stand",
		shortDescription: "A lighter altar piece created for compact living areas.",
		description: "A graceful altar stand with a warm finish and hidden storage, perfect for apartments and contemporary homes.",
		category: "Altars",
		material: "Teak Wood",
		image: "/images/temple-3.webp",
		gallery: ["/images/temple-3.webp", "/images/temple-1.webp", "/images/temple-2.jpg"],
		rating: 4.7,
		reviewCount: 74,
		featured: false,
		shippingInfo: "Ships within 2-4 business days.",
		returnPolicy: "Extended return window for custom orders.",
		variants: [
			{ id: "single", name: "Single", price: 89, width: "35 cm", height: "70 cm", depth: "30 cm", weight: "7 kg", stock: 12, sku: "VELA-S" },
			{ id: "double", name: "Double", price: 129, width: "45 cm", height: "85 cm", depth: "35 cm", weight: "10 kg", stock: 6, sku: "VELA-D" },
		],
		addons: [{ id: "led", name: "LED Lighting", price: 30, description: "Warm ambient lighting for the shrine" }],
	},
];

export const categories = ["Temples", "Altars", "Accessories"];

export const testimonials = [
	{
		name: "Asha R.",
		quote: "The craftsmanship is extraordinary. Our temple arrived beautifully packed and feels like heirloom furniture.",
	},
	{
		name: "Nikhil P.",
		quote: "From ordering to delivery, everything felt premium and effortless. The finish is simply breathtaking.",
	},
];
