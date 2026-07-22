import type { Product } from "@/types/store";

const baseProducts: Product[] = [
	{
		id: "temple-small-nepal",
		slug: "small-handcrafted-temple-nepal",
		name: "Small Handcrafted Temple",
		shortDescription: "Compact pooja temple for apartments and family prayer corners.",
		description: "Hand-carved by artisans in Bhaktapur using seasoned sheesham wood. Features floral lattice panels, handcrafted joinery, and a natural polish finish. Handmade process: wood selection, hand carving, sun-drying, fine sanding, and protective coating.",
		category: "Temples",
		material: "Sheesham Wood",
		image: "/images/temple-1.webp",
		gallery: ["/images/temple-1.webp", "/images/temple-2.jpg", "/images/temple-3.webp"],
		rating: 4.8,
		reviewCount: 84,
		featured: true,
		shippingInfo: "Norway: 3-5 days. Sweden/Denmark: 4-7 days. Finland/Germany: 5-10 days.",
		returnPolicy: "Returns within 14 days for unused items in original packaging.",
		variants: [
			{ id: "small", name: "Standard", price: 249, width: "40 cm", height: "62 cm", depth: "30 cm", weight: "10 kg", stock: 14, sku: "TMP-SM-NEP-STD" },
			{ id: "small-deluxe", name: "Deluxe", price: 319, width: "45 cm", height: "70 cm", depth: "34 cm", weight: "12 kg", stock: 8, sku: "TMP-SM-NEP-DLX" },
		],
		addons: [
			{ id: "led", name: "LED Diya Lighting", price: 39, description: "Warm integrated lighting strip for evening pooja" },
			{ id: "drawer", name: "Storage Drawer", price: 49, description: "Hidden drawer for incense, kumkum, and accessories" },
		],
	},
	{
		id: "temple-medium-heritage",
		slug: "medium-heritage-wooden-temple",
		name: "Medium Heritage Temple",
		shortDescription: "Balanced size temple with carved pillars and deep platform space.",
		description: "Built from rosewood and teak in a multi-step handmade process with hand-routed edges and carved side vents. Suitable for larger living rooms and dedicated prayer areas.",
		category: "Temples",
		material: "Rosewood & Teak",
		image: "/images/temple-2.jpg",
		gallery: ["/images/temple-2.jpg", "/images/temple-3.webp", "/images/temple-1.webp"],
		rating: 4.9,
		reviewCount: 112,
		featured: true,
		shippingInfo: "Delivered in 4-8 days across Scandinavia and 5-10 days in Germany.",
		returnPolicy: "Returns within 14 days. Custom engraving items are exchange-only.",
		variants: [
			{ id: "medium-std", name: "Standard", price: 449, width: "58 cm", height: "96 cm", depth: "40 cm", weight: "18 kg", stock: 9, sku: "TMP-MD-HER-STD" },
			{ id: "medium-prem", name: "Premium", price: 579, width: "65 cm", height: "108 cm", depth: "44 cm", weight: "22 kg", stock: 5, sku: "TMP-MD-HER-PRM" },
		],
		addons: [
			{ id: "brass-handle", name: "Brass Handle Set", price: 35, description: "Traditional brass hardware for drawers and doors" },
			{ id: "temple-bell", name: "Temple Bell Pair", price: 42, description: "Hand-cast brass bells for front arch" },
		],
	},
	{
		id: "temple-premium-regal",
		slug: "premium-regal-temple",
		name: "Premium Regal Temple",
		shortDescription: "Signature heirloom temple with layered domes and hand-engraved motifs.",
		description: "Master artisan build with premium teak and rosewood panels, hand-chiseled motifs, and gold accent inlays. Handmade process includes carving, assembly without visible screws, and multi-layer polish.",
		category: "Temples",
		material: "Teak & Rosewood",
		image: "/images/temple-3.webp",
		gallery: ["/images/temple-3.webp", "/images/temple-1.webp", "/images/temple-2.jpg"],
		rating: 5,
		reviewCount: 63,
		featured: true,
		shippingInfo: "White-glove pallet shipping with tracking. Delivery 5-10 business days.",
		returnPolicy: "Returns accepted within 14 days. White-glove return pickup available.",
		variants: [
			{ id: "regal-m", name: "Regal Medium", price: 899, width: "78 cm", height: "128 cm", depth: "52 cm", weight: "34 kg", stock: 4, sku: "TMP-PR-RGL-M" },
			{ id: "regal-l", name: "Regal Large", price: 1199, width: "92 cm", height: "152 cm", depth: "60 cm", weight: "46 kg", stock: 2, sku: "TMP-PR-RGL-L" },
		],
		addons: [
			{ id: "gold-inlay", name: "Gold Inlay Finish", price: 110, description: "Accent gold carving finish for selected motifs" },
			{ id: "glass-door", name: "Tempered Glass Door", price: 95, description: "Dust protection with elegant transparent doors" },
		],
	},
	{
		id: "temple-wall-mounted",
		slug: "wall-mounted-temple",
		name: "Wall Mounted Temple",
		shortDescription: "Space-saving temple design with handcrafted back panel carvings.",
		description: "Designed for modern apartments. Built from kiln-dried teak with hand-carved lotus patterns and hidden wall brackets. Handmade process emphasizes precise balancing and corner finishing.",
		category: "Temples",
		material: "Teak Wood",
		image: "/images/temple-3.webp",
		gallery: ["/images/temple-3.webp", "/images/temple-1.webp", "/images/temple-2.jpg"],
		rating: 4.7,
		reviewCount: 57,
		featured: false,
		shippingInfo: "Ships in reinforced packaging with mounting template. Delivery in 3-7 days.",
		returnPolicy: "14-day return policy for standard variants.",
		variants: [
			{ id: "wall-s", name: "Small", price: 199, width: "36 cm", height: "52 cm", depth: "24 cm", weight: "7 kg", stock: 15, sku: "TMP-WL-S" },
			{ id: "wall-m", name: "Medium", price: 269, width: "45 cm", height: "62 cm", depth: "28 cm", weight: "9 kg", stock: 10, sku: "TMP-WL-M" },
		],
		addons: [{ id: "mount-kit", name: "Premium Mount Kit", price: 25, description: "Heavy-duty wall anchors and Nordic wall compatibility kit" }],
	},
	{
		id: "temple-teak-classic",
		slug: "teak-wood-classic-temple",
		name: "Teak Wood Classic Temple",
		shortDescription: "Solid teak pooja temple with minimal Scandinavian silhouette.",
		description: "A clean, premium profile that blends Nordic interiors with South Asian spiritual traditions. Handmade from FSC-aligned teak and finished with low-VOC sealant.",
		category: "Temples",
		material: "FSC Teak Wood",
		image: "/images/temple-1.webp",
		gallery: ["/images/temple-1.webp", "/images/temple-3.webp", "/images/temple-2.jpg"],
		rating: 4.9,
		reviewCount: 91,
		featured: true,
		shippingInfo: "Carbon-aware shipping partners across Norway and EU.",
		returnPolicy: "14-day standard returns, 30-day structural warranty support.",
		variants: [
			{ id: "teak-std", name: "Standard", price: 529, width: "62 cm", height: "102 cm", depth: "42 cm", weight: "19 kg", stock: 8, sku: "TMP-TK-STD" },
			{ id: "teak-xl", name: "XL", price: 699, width: "76 cm", height: "122 cm", depth: "50 cm", weight: "28 kg", stock: 4, sku: "TMP-TK-XL" },
		],
		addons: [{ id: "brass-diya-tray", name: "Brass Diya Tray", price: 44, description: "Removable brass tray for lamp rituals" }],
	},
	{
		id: "temple-rosewood-ornate",
		slug: "rosewood-ornate-temple",
		name: "Rosewood Ornate Temple",
		shortDescription: "Traditional carved rosewood temple with decorative arch crown.",
		description: "Premium rosewood build with deep hand-carved ethnic motifs inspired by temple architecture. Finished with grain-enhancing oil and humidity-safe treatment.",
		category: "Temples",
		material: "Rosewood",
		image: "/images/temple-2.jpg",
		gallery: ["/images/temple-2.jpg", "/images/temple-1.webp", "/images/temple-3.webp"],
		rating: 4.8,
		reviewCount: 66,
		featured: false,
		shippingInfo: "Tracked shipping with moisture-control wrapping for long-distance delivery.",
		returnPolicy: "14-day returns for non-custom variants.",
		variants: [
			{ id: "rose-m", name: "Medium", price: 599, width: "64 cm", height: "106 cm", depth: "45 cm", weight: "23 kg", stock: 6, sku: "TMP-RS-M" },
			{ id: "rose-l", name: "Large", price: 779, width: "82 cm", height: "136 cm", depth: "54 cm", weight: "33 kg", stock: 3, sku: "TMP-RS-L" },
		],
		addons: [{ id: "carving-upgrade", name: "Deep Carving Upgrade", price: 120, description: "Extra-depth hand carving on side pillars and crown" }],
	},
	{
		id: "temple-custom-builder",
		slug: "custom-handcrafted-temple",
		name: "Custom Temple Build",
		shortDescription: "Made-to-order temple tailored to your room size, rituals, and style.",
		description: "Collaborative design service for custom dimensions, wood type, shelves, and decorative style. Handmade process includes consultation, sketch approval, artisan production, and quality checks.",
		category: "Temples",
		material: "Custom: Teak, Rosewood, or Sheesham",
		image: "/images/temple-3.webp",
		gallery: ["/images/temple-3.webp", "/images/temple-2.jpg", "/images/temple-1.webp"],
		rating: 4.9,
		reviewCount: 41,
		featured: true,
		shippingInfo: "Production 3-6 weeks. Delivery 5-10 days after completion.",
		returnPolicy: "Custom builds are non-refundable after production begins.",
		variants: [
			{ id: "custom-consult", name: "Design Consultation", price: 99, width: "Custom", height: "Custom", depth: "Custom", weight: "Custom", stock: 20, sku: "TMP-CST-CONSULT" },
			{ id: "custom-build", name: "Custom Build Deposit", price: 899, width: "Custom", height: "Custom", depth: "Custom", weight: "Custom", stock: 12, sku: "TMP-CST-DEP" },
		],
		addons: [{ id: "3d-preview", name: "3D Preview Pack", price: 149, description: "Room-fit mockup and 3D visual preview before production" }],
	},
	{
		id: "clothes-daura-suruwal",
		slug: "daura-suruwal-classic-set",
		name: "Daura Suruwal Classic Set",
		shortDescription: "Traditional Nepali menswear set for ceremonies and festive occasions.",
		description: "Hand-stitched daura suruwal set using breathable cotton blend fabric with tailored finish. Includes tunic, trouser, and matching waist detail.",
		category: "Clothes",
		material: "Cotton Blend",
		image: "/images/temple-1.webp",
		gallery: ["/images/temple-1.webp", "/images/temple-2.jpg", "/images/temple-3.webp"],
		rating: 4.7,
		reviewCount: 38,
		featured: false,
		shippingInfo: "Ships in 3-6 days across Norway and EU.",
		returnPolicy: "Size exchanges within 14 days.",
		variants: [
			{ id: "m-size-m", name: "Size M", price: 129, width: "M", height: "Regular", depth: "N/A", weight: "0.8 kg", stock: 20, sku: "CLOTH-DAURA-M" },
			{ id: "m-size-l", name: "Size L", price: 129, width: "L", height: "Regular", depth: "N/A", weight: "0.85 kg", stock: 16, sku: "CLOTH-DAURA-L" },
		],
		addons: [{ id: "topi", name: "Dhaka Topi Add-on", price: 25, description: "Matching traditional Dhaka topi" }],
	},
	{
		id: "clothes-saree-heritage",
		slug: "heritage-saree-collection",
		name: "Heritage Saree Collection",
		shortDescription: "Elegant sarees with traditional motifs for pooja and celebrations.",
		description: "Curated sarees from South Asian weaving clusters with soft drape, detailed borders, and festive tones. Designed for cultural events and temple ceremonies.",
		category: "Clothes",
		material: "Silk Blend",
		image: "/images/temple-2.jpg",
		gallery: ["/images/temple-2.jpg", "/images/temple-1.webp", "/images/temple-3.webp"],
		rating: 4.8,
		reviewCount: 49,
		featured: true,
		shippingInfo: "Gift-ready packaging. Delivery in 4-8 business days.",
		returnPolicy: "Returns accepted within 14 days for unworn items.",
		variants: [
			{ id: "saree-red", name: "Ruby Red", price: 159, width: "5.5 m", height: "Standard", depth: "N/A", weight: "0.7 kg", stock: 12, sku: "CLOTH-SAR-RED" },
			{ id: "saree-gold", name: "Gold Beige", price: 169, width: "5.5 m", height: "Standard", depth: "N/A", weight: "0.72 kg", stock: 10, sku: "CLOTH-SAR-GLD" },
		],
		addons: [{ id: "blouse", name: "Stitched Blouse", price: 35, description: "Custom stitched blouse as per selected size" }],
	},
	{
		id: "clothes-shawls-handloom",
		slug: "handloom-shawls",
		name: "Handloom Shawls",
		shortDescription: "Soft woven shawls for daily wear, gifting, and temple visits.",
		description: "Artisan-woven shawls with traditional patterns and winter-ready warmth. A versatile accessory collection for men and women.",
		category: "Clothes",
		material: "Wool Blend",
		image: "/images/temple-3.webp",
		gallery: ["/images/temple-3.webp", "/images/temple-2.jpg", "/images/temple-1.webp"],
		rating: 4.6,
		reviewCount: 35,
		featured: false,
		shippingInfo: "Ships within 2-4 business days.",
		returnPolicy: "14-day returns for unused items.",
		variants: [
			{ id: "shawl-earth", name: "Earth Tones", price: 69, width: "200 cm", height: "70 cm", depth: "N/A", weight: "0.5 kg", stock: 24, sku: "CLOTH-SHW-ERTH" },
			{ id: "shawl-royal", name: "Royal Tones", price: 79, width: "200 cm", height: "70 cm", depth: "N/A", weight: "0.52 kg", stock: 18, sku: "CLOTH-SHW-RYL" },
		],
		addons: [{ id: "gift-box", name: "Gift Box", price: 9, description: "Premium hard-box festive gift wrapping" }],
	},
	{
		id: "pooja-brass-diya-set",
		slug: "brass-diya-bell-kalash-set",
		name: "Brass Diya Bell Kalash Set",
		shortDescription: "Essential brass pooja starter set with diya, bell, and kalash.",
		description: "Hand-finished brass pooja essentials made by metal artisans. Includes diya, temple bell, and kalash bowl suitable for daily rituals and festive pooja.",
		category: "Pooja",
		material: "Solid Brass",
		image: "/images/temple-1.webp",
		gallery: ["/images/temple-1.webp", "/images/temple-3.webp", "/images/temple-2.jpg"],
		rating: 4.8,
		reviewCount: 77,
		featured: true,
		shippingInfo: "Ships in protective anti-tarnish packing. Delivery 3-7 days.",
		returnPolicy: "14-day return policy.",
		variants: [
			{ id: "brass-set-s", name: "3-Piece Set", price: 59, width: "Standard", height: "Standard", depth: "Standard", weight: "1.3 kg", stock: 25, sku: "POOJA-BRS-3" },
			{ id: "brass-set-l", name: "5-Piece Set", price: 89, width: "Standard", height: "Standard", depth: "Standard", weight: "2.1 kg", stock: 18, sku: "POOJA-BRS-5" },
		],
		addons: [{ id: "aarti-lamp", name: "Aarti Lamp", price: 29, description: "Matching brass aarti lamp add-on" }],
	},
	{
		id: "pooja-copper-essentials",
		slug: "copper-lota-plate-spoon-set",
		name: "Copper Essentials Set",
		shortDescription: "Traditional copper lota, plate, and spoon ritual set.",
		description: "Hammered copper ritualware with smooth edges and balanced weight. Crafted for abhishek, offerings, and daily temple routines.",
		category: "Pooja",
		material: "Pure Copper",
		image: "/images/temple-2.jpg",
		gallery: ["/images/temple-2.jpg", "/images/temple-1.webp", "/images/temple-3.webp"],
		rating: 4.7,
		reviewCount: 52,
		featured: false,
		shippingInfo: "Ships within 2-5 days with anti-dent packaging.",
		returnPolicy: "14-day return policy.",
		variants: [
			{ id: "copper-basic", name: "Basic", price: 49, width: "Standard", height: "Standard", depth: "Standard", weight: "1.1 kg", stock: 30, sku: "POOJA-CPR-BSC" },
			{ id: "copper-prem", name: "Premium", price: 75, width: "Standard", height: "Standard", depth: "Standard", weight: "1.6 kg", stock: 19, sku: "POOJA-CPR-PRM" },
		],
		addons: [{ id: "cleaning-kit", name: "Copper Care Kit", price: 14, description: "Natural cleaner and polishing cloth set" }],
	},
	{
		id: "pooja-rudraksha-mala",
		slug: "rudraksha-mala-pooja-accessories",
		name: "Rudraksha & Pooja Accessories",
		shortDescription: "Curated pooja accessories including rudraksha mala and ritual powders.",
		description: "Includes incense, camphor, kumkum, sindoor, and authentic rudraksha mala. Ideal for home temple upkeep and gifting.",
		category: "Pooja",
		material: "Natural Seed, Herb, and Ritual Blends",
		image: "/images/temple-3.webp",
		gallery: ["/images/temple-3.webp", "/images/temple-1.webp", "/images/temple-2.jpg"],
		rating: 4.9,
		reviewCount: 68,
		featured: true,
		shippingInfo: "Ships in 1-3 days. Secure pouch packaging.",
		returnPolicy: "Returns accepted for unopened packs only.",
		variants: [
			{ id: "acc-basic", name: "Basic Pack", price: 29, width: "N/A", height: "N/A", depth: "N/A", weight: "0.4 kg", stock: 44, sku: "POOJA-ACC-BSC" },
			{ id: "acc-festive", name: "Festive Pack", price: 45, width: "N/A", height: "N/A", depth: "N/A", weight: "0.7 kg", stock: 31, sku: "POOJA-ACC-FEST" },
		],
		addons: [{ id: "diya-oil", name: "Diya Oil Pack", price: 11, description: "Temple-grade diya oil blend" }],
	},
	{
		id: "mandap-indoor-classic",
		slug: "indoor-pooja-mandap-classic",
		name: "Indoor Pooja Mandap Classic",
		shortDescription: "Elegant indoor mandap for ceremonies, havan, and festive rituals.",
		description: "Modular indoor mandap with carved columns and detachable canopy. Crafted for repeated setup in homes, halls, and community spaces.",
		category: "Mandap",
		material: "Wood & Metal Framework",
		image: "/images/temple-1.webp",
		gallery: ["/images/temple-1.webp", "/images/temple-2.jpg", "/images/temple-3.webp"],
		rating: 4.8,
		reviewCount: 27,
		featured: false,
		shippingInfo: "Flat-pack shipping with guided assembly support. Delivery in 5-10 days.",
		returnPolicy: "Returns within 14 days for unopened kits.",
		variants: [
			{ id: "indoor-s", name: "2m x 2m", price: 799, width: "200 cm", height: "240 cm", depth: "200 cm", weight: "38 kg", stock: 6, sku: "MAND-IN-2X2" },
			{ id: "indoor-m", name: "3m x 3m", price: 1199, width: "300 cm", height: "270 cm", depth: "300 cm", weight: "56 kg", stock: 3, sku: "MAND-IN-3X3" },
		],
		addons: [{ id: "fabric-drape", name: "Ceremony Drape Set", price: 129, description: "Festival-ready premium fabric draping kit" }],
	},
	{
		id: "mandap-outdoor-festival",
		slug: "outdoor-festival-mandap",
		name: "Outdoor Festival Mandap",
		shortDescription: "Weather-resistant outdoor mandap for temple and festival events.",
		description: "Outdoor-grade frame with decorative panels for weddings and community festivals. Supports lighting and decor attachments.",
		category: "Mandap",
		material: "Coated Metal, Wood Panels",
		image: "/images/temple-2.jpg",
		gallery: ["/images/temple-2.jpg", "/images/temple-3.webp", "/images/temple-1.webp"],
		rating: 4.7,
		reviewCount: 19,
		featured: true,
		shippingInfo: "Freight shipping with setup coordination available.",
		returnPolicy: "Commercial/event orders are exchange-only after dispatch.",
		variants: [
			{ id: "outdoor-m", name: "Standard Event", price: 1499, width: "350 cm", height: "300 cm", depth: "350 cm", weight: "74 kg", stock: 2, sku: "MAND-OUT-STD" },
			{ id: "outdoor-l", name: "Grand Event", price: 1999, width: "450 cm", height: "340 cm", depth: "450 cm", weight: "102 kg", stock: 1, sku: "MAND-OUT-GRAND" },
		],
		addons: [{ id: "lighting-rig", name: "Lighting Rig", price: 249, description: "Integrated warm-light frame for evening ceremonies" }],
	},
];

function inferWoodType(material: string) {
	if (material.toLowerCase().includes("rosewood")) {
		return "Rosewood";
	}
	if (material.toLowerCase().includes("teak")) {
		return "Teak";
	}
	if (material.toLowerCase().includes("sheesham")) {
		return "Sheesham";
	}
	if (material.toLowerCase().includes("wood")) {
		return "Mixed Wood";
	}

	return "Not Applicable";
}

function inferColor(category: string) {
	if (category === "Clothes") {
		return "Festive Multi Tone";
	}
	if (category === "Pooja") {
		return "Brass and Copper";
	}
	if (category === "Mandap") {
		return "Natural and Gold Accent";
	}

	return "Natural Wood";
}

export const products: Product[] = baseProducts.map((product) => {
	const defaultReview = {
		id: `${product.id}-review-1`,
		author: "Verified Customer",
		rating: product.rating,
		title: "Excellent craftsmanship",
		comment: "Premium finish, accurate details, and reliable delivery experience.",
		date: "2026-06-14",
	};

	return {
		...product,
		materials: product.materials ?? [product.material],
		woodType: product.woodType ?? inferWoodType(product.material),
		sizeLabel: product.sizeLabel ?? product.variants[0]?.name ?? "Standard",
		color: product.color ?? inferColor(product.category),
		handcraftedStory: product.handcraftedStory ?? product.description,
		handmadeProcess: product.handmadeProcess ?? "Wood and material selection, artisan shaping, hand-finishing, and quality inspection before dispatch.",
		dimensions: product.dimensions ?? `${product.variants[0]?.width ?? "N/A"} x ${product.variants[0]?.height ?? "N/A"} x ${product.variants[0]?.depth ?? "N/A"}`,
		weight: product.weight ?? product.variants[0]?.weight ?? "N/A",
		careInstructions: product.careInstructions ?? "Keep dry, clean with a soft cloth, and avoid prolonged direct sunlight.",
		specifications: product.specifications ?? [`Category: ${product.category}`, `Material: ${product.material}`, `SKU: ${product.variants[0]?.sku ?? "N/A"}`],
		reviews: product.reviews ?? [defaultReview],
	};
});

export const categories = ["Temples", "Clothes", "Pooja", "Mandap"];

export const testimonials = [
	{
		name: "Saroj Thapa, Oslo",
		quote: "The temple quality exceeded expectations. Packaging, delivery updates, and finish quality all felt premium and trustworthy.",
		image: "/images/testimonial-1.avif",
	},
	{
		name: "Jaya Devi Bista, Stockholm",
		quote: "Our mandap and pooja set were beautifully crafted and arrived on schedule. The team understood our cultural requirements perfectly.",
		image: "/images/testimonial-2.avif",
	},
	{
		name: "Satakkar Singh, Berlin",
		quote: "The saree and gift collection were elegant and authentic. This is the first store that feels both modern and deeply cultural.",
		image: "/images/testimonial-3.webp",
	},
];
