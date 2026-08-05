import { NextResponse } from "next/server";
import { getBringShippingOptions } from "@/lib/bring";
import type { BringPackage } from "@/lib/bring";

export const runtime = "nodejs";

type BringShippingRequest = {
	toPostalCode: string;
	toCountry: string;
	packages: BringPackage[];
};

/**
 * POST /api/bring-shipping
 *
 * Proxies shipping option requests to the Bring Shipping Guide API v2.
 * Returns available shipping services with prices and delivery estimates.
 *
 * Request body:
 * {
 *   toPostalCode: string;
 *   toCountry: string;
 *   packages: Array<{ weightInGrams: number; length?: number; width?: number; height?: number }>;
 * }
 */
export async function POST(request: Request) {
	try {
		const body = (await request.json()) as BringShippingRequest;

		if (!body.toPostalCode) {
			return NextResponse.json({ error: "Postal code is required." }, { status: 400 });
		}

		if (!body.toCountry) {
			return NextResponse.json({ error: "Country is required." }, { status: 400 });
		}

		if (!body.packages || body.packages.length === 0) {
			return NextResponse.json({ error: "At least one package is required." }, { status: 400 });
		}

		// Validate that total package weight is reasonable
		for (const pkg of body.packages) {
			if (!pkg.weightInGrams || pkg.weightInGrams <= 0) {
				return NextResponse.json({ error: "Each package must have a valid weightInGrams." }, { status: 400 });
			}
		}

		const result = await getBringShippingOptions(body.toPostalCode, body.toCountry, body.packages);

		return NextResponse.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to fetch Bring shipping options.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
