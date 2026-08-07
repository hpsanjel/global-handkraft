import { NextResponse } from "next/server";
import JSZip from "jszip";
import { hasAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { generateDocument, assembleOrderDocumentData, DOCUMENT_TYPES, isShippingOnlyDocumentType, OrderNotFoundError, type DocumentType } from "@/lib/documents";

export const runtime = "nodejs";

const DOCUMENT_LABELS: Record<DocumentType, string> = {
	COMMERCIAL_INVOICE: "Commercial Invoice",
	PACKING_LIST: "Packing List",
	RECEIPT: "Receipt",
	CUSTOMS_INVOICE: "Customs Invoice",
	RETURN_CARD: "Return Policy",
	SHIPPING_SUMMARY: "Shipping Summary",
	ORDER_SUMMARY: "Order Summary",
	GIFT_RECEIPT: "Gift Receipt",
};

/** GET /api/admin/orders/[id]/documents/all — bundles every document applicable to this order into a single zip for the admin to download. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !hasAdminRole(user)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// RECEIPT applies to every order (pickup or shipped), so it's a safe probe to
		// resolve the order number and pickup status once, up front — the same data
		// assembly generateDocument() runs per-type below, exposed for reuse per its
		// own doc comment.
		const { order, shipping } = await assembleOrderDocumentData(id, "RECEIPT");
		const applicableTypes = DOCUMENT_TYPES.filter((type) => shipping.isPickup === false || !isShippingOnlyDocumentType(type));

		const zip = new JSZip();
		for (const type of applicableTypes) {
			const output = await generateDocument({ orderId: id, type, format: "buffer" });
			zip.file(`${DOCUMENT_LABELS[type]} - ${output.fileName}`, output.data);
		}

		const archive = await zip.generateAsync({ type: "nodebuffer" });

		return new NextResponse(new Uint8Array(archive), {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="Order-${order.orderNumber}-Documents.zip"`,
				"Content-Length": String(archive.length),
			},
		});
	} catch (error) {
		if (error instanceof OrderNotFoundError) {
			return NextResponse.json({ error: "Order not found." }, { status: 404 });
		}
		const message = error instanceof Error ? error.message : "Unable to generate documents.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
