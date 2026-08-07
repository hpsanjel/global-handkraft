import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { generateDocument, isDocumentType, OrderNotFoundError } from "@/lib/documents";

export const runtime = "nodejs";

/** GET /api/admin/orders/[id]/documents/[type] — admin print/download. Defaults to inline (opens in a new tab for warehouse printing); add ?download=1 to force a download instead. */
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

		if (!user || !hasAdminRole(user)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const output = await generateDocument({ orderId: id, type, format: "buffer" });
		const download = new URL(request.url).searchParams.has("download");

		return new NextResponse(new Uint8Array(output.data), {
			headers: {
				"Content-Type": output.contentType,
				"Content-Disposition": `${download ? "attachment" : "inline"}; filename="${output.fileName}"`,
				"Content-Length": String(output.data.length),
			},
		});
	} catch (error) {
		if (error instanceof OrderNotFoundError) {
			return NextResponse.json({ error: "Order not found." }, { status: 404 });
		}
		const message = error instanceof Error ? error.message : "Unable to generate document.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
