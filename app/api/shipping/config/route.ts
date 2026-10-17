import { NextResponse } from "next/server";
import { getShippingConfig } from "@/lib/shipping-config";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const config = await getShippingConfig();
		return NextResponse.json(config);
	} catch {
		return NextResponse.json(
			{
				norwayRate: 76,
				internationalRate: 200,
				freeShippingThreshold: 1500,
			},
			{ status: 200 }
		);
	}
}

