import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateDocument, isDocumentType, OrderNotFoundError, DocumentNotApplicableError } from "@/lib/documents";

export const runtime = "nodejs";

/** GET /api/account/orders/[id]/documents/[type] — customer download of their own order's documents. Add ?preview=1 to view inline instead of downloading. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string; type: string }> }) {
	try {
		const { id, type } = await params;

		if (!isDocumentType(type)) {
			return NextResponse.json({ error: "Unknown document type." }, { status: 400 });
		}

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user?.email) {
			return NextResponse.json({ error: "You must be signed in to download order documents." }, { status: 401 });
		}

		const order = await prisma.order.findUnique({ where: { id }, select: { address: { select: { email: true } } } });
		if (!order) {
			return NextResponse.json({ error: "Order not found." }, { status: 404 });
		}
		if (order.address.email.toLowerCase() !== user.email.toLowerCase()) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const output = await generateDocument({ orderId: id, type, format: "buffer" });
		const preview = new URL(request.url).searchParams.has("preview");

		return new NextResponse(new Uint8Array(output.data), {
			headers: {
				"Content-Type": output.contentType,
				"Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${output.fileName}"`,
				"Content-Length": String(output.data.length),
			},
		});
	} catch (error) {
		if (error instanceof OrderNotFoundError) {
			return NextResponse.json({ error: "Order not found." }, { status: 404 });
		}
		if (error instanceof DocumentNotApplicableError) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}
		const message = error instanceof Error ? error.message : "Unable to generate document.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
