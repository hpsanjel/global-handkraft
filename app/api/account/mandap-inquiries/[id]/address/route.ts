import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";

type AddressInput = {
	fullName: string;
	phone: string;
	email?: string;
	country: string;
	address: string;
	postalCode: string;
	city: string;
	companyName?: string;
	vatNumber?: string;
};

const REQUIRED_FIELDS: (keyof AddressInput)[] = ["fullName", "phone", "country", "address", "postalCode", "city"];

/** PATCH /api/account/mandap-inquiries/[id]/address — buyer submits/updates their own shipping address once a quote is accepted, ahead of paying the deposit. Same auth pattern as payment-response/route.ts. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user?.email) {
			return NextResponse.json({ error: "You must be signed in to add a shipping address." }, { status: 401 });
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const { id } = await params;
		const body = (await request.json()) as { address?: AddressInput };

		if (!body.address) {
			return NextResponse.json({ error: "Address is required." }, { status: 400 });
		}

		for (const field of REQUIRED_FIELDS) {
			if (!body.address[field]) {
				return NextResponse.json({ error: `${field} is required.` }, { status: 400 });
			}
		}

		if (!SHIPPING_COUNTRY_CODES.includes(body.address.country)) {
			return NextResponse.json({ error: "Unsupported country." }, { status: 400 });
		}

		const inquiry = await prisma.mandapInquiry.findUnique({ where: { id } });
		if (!inquiry || inquiry.email?.toLowerCase() !== user.email.toLowerCase()) {
			return NextResponse.json({ error: "Request not found or access denied." }, { status: 404 });
		}

		const addressData = {
			fullName: body.address.fullName,
			phone: body.address.phone,
			email: body.address.email || inquiry.email || user.email,
			country: body.address.country,
			address: body.address.address,
			postalCode: body.address.postalCode,
			city: body.address.city,
			companyName: body.address.companyName || null,
			vatNumber: body.address.vatNumber || null,
		};

		if (inquiry.addressId) {
			await prisma.address.update({ where: { id: inquiry.addressId }, data: addressData });
		} else {
			const created = await prisma.address.create({ data: addressData });
			await prisma.mandapInquiry.update({ where: { id }, data: { addressId: created.id } });
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to save address.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
