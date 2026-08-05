export type BringPickupPoint = {
	id: string;
	name: string;
	address: string;
	postalCode: string;
	city: string;
	country: string;
	distance: number | null;
	openingHours: string | null;
	latitude: number | null;
	longitude: number | null;
};

/**
 * Fetches Bring pickup points for a given postal code and country.
 *
 * Uses Bring Pickup Point API:
 * GET https://api.bring.com/pickuppoint/api/pickuppoint/{country}/postalCode/{postalCode}.json
 *
 * Headers required:
 * - X-MyBring-API-Uid: Mybring login ID (email)
 * - X-MyBring-API-Key: API key from Mybring
 *
 * @see https://developer.bring.com/api/pickup-point/
 */
export async function getBringPickupPoints(postalCode: string, country: string): Promise<BringPickupPoint[]> {
	const apiUid = process.env.BRING_API_UID;
	const apiKey = process.env.BRING_API_KEY;

	if (!apiUid || !apiKey) {
		throw new Error("Bring API credentials are not configured.");
	}

	const countryLower = country.toLowerCase();
	const url = `https://api.bring.com/pickuppoint/api/pickuppoint/${countryLower}/postalCode/${postalCode}.json`;

	try {
		const response = await fetch(url, {
			headers: {
				"X-MyBring-API-Uid": apiUid,
				"X-MyBring-API-Key": apiKey,
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Bring Pickup Point API error (${response.status}): ${errorText}`);
		}

		const data = (await response.json()) as Record<string, unknown>;
		const pickupPoints = data.pickupPoints as Array<Record<string, unknown>> | undefined;

		if (!pickupPoints) {
			return [];
		}

		return pickupPoints.map((point) => ({
			id: String(point.id || ""),
			name: String(point.name || ""),
			address: String(point.address || point.street || ""),
			postalCode: String(point.postalCode || point.zip || ""),
			city: String(point.city || ""),
			country: country.toUpperCase(),
			distance: point.distance ? Number(point.distance) : null,
			openingHours: point.openingHours ? String(point.openingHours) : null,
			latitude: point.latitude ? Number(point.latitude) : null,
			longitude: point.longitude ? Number(point.longitude) : null,
		}));
	} catch (error) {
		if (error instanceof Error && error.message.startsWith("Bring Pickup Point API error")) {
			throw error;
		}
		throw new Error(`Failed to fetch Bring pickup points: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}
