export type BringPackage = {
	/** Weight in grams */
	weightInGrams: number;
	/** Length in cm (optional but recommended for accurate pricing) */
	length?: number;
	/** Width in cm (optional but recommended for accurate pricing) */
	width?: number;
	/** Height in cm (optional but recommended for accurate pricing) */
	height?: number;
};

export type BringProduct = {
	/** Product ID (e.g. "5600", "BUSINESS_PARCEL") */
	productId: string;
	/** Display name (e.g. "Pakke hjem pluss", "Business Parcel") */
	displayName: string;
	/** Price in cents (NOK) */
	priceCents: number;
	/** Expected delivery time description (e.g. "1 virkedag") */
	expectedDelivery: string | null;
	/** Estimated delivery date in ISO format */
	estimatedDeliveryDate: string | null;
	/** Maximum delivery days */
	maxDays: number | null;
	/** Whether this is a home delivery or pickup point service */
	deliveryType: "HOME" | "PICKUP" | "MAILBOX";
	/** Gui information / description text */
	guiInformation: string | null;
	/** Service code for filtering */
	serviceCode: string;
};

export type BringShippingGuideResponse = {
	products: BringProduct[];
	raw: unknown;
};

/**
 * Default sender postal code (Bring customer's warehouse/office).
 * Should be configured via BRING_POSTAL_CODE env var.
 */
function getSenderPostalCode(): string {
	return process.env.BRING_POSTAL_CODE || "0000";
}

/**
 * Product codes to query for shipping options.
 * These cover home delivery, pickup point, and business delivery options.
 * The API returns errors for products not applicable to the given country pair,
 * which the parser skips.
 */
const DOMESTIC_PRODUCT_CODES = ["PA_DOREN", "SERVICEPAKKE", "BUSINESS_PARCEL", "EKSPRESS09"];

/**
 * Builds the query parameters for the Bring Shipping Guide API v2.
 *
 * The v2 API is a GET endpoint where each query parameter is a scalar
 * (not nested JSON). Product codes can be repeated to query multiple
 * shipping products in a single request.
 */
function buildQueryParams(toPostalCode: string, toCountry: string, packages: BringPackage[]): URLSearchParams {
	const params = new URLSearchParams();
	params.set("fromCountry", "NO");
	params.set("fromPostalCode", getSenderPostalCode());
	params.set("toCountry", toCountry.toUpperCase());
	params.set("toPostalCode", toPostalCode);

	// The v2 API accepts a single package per request (one set of measurement params).
	// Use the first package's weight/dimensions for the query.
	const primaryPackage = packages[0];
	if (primaryPackage) {
		params.set("weight", String(primaryPackage.weightInGrams));

		// Bring v2 expects dimensions in cm
		if (primaryPackage.length) params.set("length", String(primaryPackage.length));
		if (primaryPackage.width) params.set("width", String(primaryPackage.width));
		if (primaryPackage.height) params.set("height", String(primaryPackage.height));
	}

	// The API accepts multiple `product` query params to fetch several products
	// in a single request. Query the common domestic product codes.
	for (const code of DOMESTIC_PRODUCT_CODES) {
		params.append("product", code);
	}

	return params;
}

/**
 * Fetches shipping options from the Bring Shipping Guide API v2.
 *
 * @see https://developer.bring.com/api/shipping-guide_2/
 *
 * Headers required:
 * - X-MyBring-API-Uid: Mybring login ID (email)
 * - X-MyBring-API-Key: API key from Mybring
 *
 * @returns Available shipping products with prices and delivery estimates.
 */
export async function getBringShippingOptions(toPostalCode: string, toCountry: string, packages: BringPackage[]): Promise<BringShippingGuideResponse> {
	const apiUid = process.env.BRING_API_UID;
	const apiKey = process.env.BRING_API_KEY;

	if (!apiUid || !apiKey) {
		throw new Error("Bring API credentials are not configured. Set BRING_API_UID and BRING_API_KEY.");
	}

	const url = "https://api.bring.com/shippingguide/v2/products";
	const queryParams = buildQueryParams(toPostalCode, toCountry, packages);
	const fullUrl = `${url}?${queryParams.toString()}`;

	try {
		const response = await fetch(fullUrl, {
			method: "GET",
			headers: {
				"X-MyBring-API-Uid": apiUid,
				"X-MyBring-API-Key": apiKey,
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Bring API error (${response.status}): ${errorText}`);
		}

		const data = (await response.json()) as Record<string, unknown>;
		const products = extractProducts(data);

		return { products, raw: data };
	} catch (error) {
		if (error instanceof Error && error.message.startsWith("Bring API error")) {
			throw error;
		}
		throw new Error(`Failed to fetch Bring shipping options: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}

/**
 * Extracts product information from the Bring Shipping Guide API v2 response.
 *
 * v2 response structure:
 * {
 *   consignments: [
 *     {
 *       products: [
 *         {
 *           id: "5600",
 *           productionCode: "5600",
 *           shippingWeight: 0.5,
 *           guiInformation: { displayName: "...", descriptionText: "...", deliveryType: "..." },
 *           price: {
 *             listPrice: {
 *               priceWithoutAdditionalServices: { amountWithoutVAT: "215.72" }
 *             }
 *           },
 *           expectedDelivery: { workingDays: "1", formattedExpectedDeliveryDate: "..." }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
function extractProducts(data: Record<string, unknown>): BringProduct[] {
	const consignments = data.consignments as Array<Record<string, unknown>> | undefined;
	if (!consignments) {
		return [];
	}

	const products: BringProduct[] = [];

	for (const consignment of consignments) {
		const productList = consignment.products as Array<Record<string, unknown>> | undefined;
		if (!productList) continue;

		for (const product of productList) {
			// Skip products with errors (e.g. "INVALID_COUNTRY_PAIR")
			if (product.errors && Array.isArray(product.errors) && product.errors.length > 0) {
				continue;
			}

			const productId = String(product.id || "");
			if (!productId) continue;

			// Extract price from v2 structure: price.listPrice.priceWithoutAdditionalServices.amountWithoutVAT
			const priceData = product.price as Record<string, unknown> | undefined;
			const listPrice = priceData?.listPrice as Record<string, unknown> | undefined;
			const priceWithoutAdditionalServices = listPrice?.priceWithoutAdditionalServices as Record<string, unknown> | undefined;
			const amountWithoutVAT = priceWithoutAdditionalServices?.amountWithoutVAT;
			const priceCents = amountWithoutVAT !== undefined ? Math.round(Number(amountWithoutVAT) * 100) : 0;

			// Extract delivery time from v2 structure
			const expectedDelivery = product.expectedDelivery as Record<string, unknown> | undefined;
			let maxDays: number | null = null;
			let deliveryText: string | null = null;
			let deliveryDate: string | null = null;

			if (expectedDelivery) {
				// workingDays is a string like "1" or "2-4"
				const workingDays = expectedDelivery.workingDays;
				if (typeof workingDays === "string") {
					deliveryText = workingDays.includes("-") ? `${workingDays} virkedager` : `${workingDays} virkedag`;
					const parts = workingDays.split("-");
					const first = parseInt(parts[0], 10);
					const last = parts.length > 1 ? parseInt(parts[1], 10) : first;
					if (!Number.isNaN(last)) {
						maxDays = last;
					}
				} else if (typeof workingDays === "number") {
					deliveryText = `${workingDays} virkedag${workingDays === 1 ? "" : "er"}`;
					maxDays = workingDays;
				}

				// formattedExpectedDeliveryDate is like "06.08.2026" (DD.MM.YYYY)
				const formattedDate = expectedDelivery.formattedExpectedDeliveryDate;
				if (typeof formattedDate === "string") {
					const [day, month, year] = formattedDate.split(".");
					if (day && month && year) {
						deliveryDate = `${year}-${month}-${day}`;
					}
				}
			}

			// Extract GUI information / description
			const guiInfo = product.guiInformation as Record<string, unknown> | undefined;
			const guiText = (guiInfo?.descriptionText as string | undefined) || null;
			const displayName = (guiInfo?.displayName as string | undefined) || (guiInfo?.productName as string | undefined) || productId;

			// Determine delivery type from GUI info
			let deliveryType: "HOME" | "PICKUP" | "MAILBOX" = "HOME";
			const guiDeliveryType = guiInfo?.deliveryType as string | undefined;
			if (guiDeliveryType) {
				const dt = guiDeliveryType.toLowerCase();
				if (dt.includes("post") || dt.includes("butikk") || dt.includes("hentested")) {
					deliveryType = "PICKUP";
				} else if (dt.includes("dør") || dt.includes("dor") || dt.includes("hjem")) {
					deliveryType = "HOME";
				}
			}

			// Fallback: infer from product ID pattern
			const id = productId.toUpperCase();
			if (deliveryType === "HOME") {
				if (id.includes("PICKUP") || id.includes("SERVPAKKE") || id === "0340" || id === "0342") {
					deliveryType = "PICKUP";
				} else if (id.includes("MAILBOX") || id.includes("DOREN") || id === "3584" || id === "3570") {
					deliveryType = "MAILBOX";
				}
			}

			products.push({
				productId,
				displayName,
				priceCents,
				expectedDelivery: deliveryText,
				estimatedDeliveryDate: deliveryDate,
				maxDays,
				deliveryType,
				guiInformation: guiText,
				serviceCode: String(product.productionCode || productId),
			});
		}
	}

	// Sort by price ascending
	products.sort((a, b) => a.priceCents - b.priceCents);

	return products;
}
