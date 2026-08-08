import { NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/exchange-rates";

export const runtime = "nodejs";

/**
 * GET /api/exchange-rates
 *
 * Returns cached, NOK-based live exchange rates for client components to
 * render an estimated price in the buyer's preferred currency alongside the
 * NOK price. See lib/exchange-rates.ts for caching/fallback behaviour.
 */
export async function GET() {
	const rates = await getExchangeRates();
	return NextResponse.json(rates);
}
