import { NextResponse } from "next/server";
import JSZip from "jszip";
import { hasAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateMandapInquiryDocument, MANDAP_DOCUMENT_TYPES, mandapDocumentRequiresAddress, MandapInquiryNotFoundError, type DocumentType } from "@/lib/documents";

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
	PRO_FORMA_INVOICE: "Pro Forma Invoice",
	DEPOSIT_RECEIPT: "Deposit Receipt",
};

/** GET /api/admin/mandap-inquiries/[id]/documents/all — bundles every document applicable to this custom order request into a single zip. */
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

		const inquiry = await prisma.mandapInquiry.findUnique({ where: { id }, select: { addressId: true, referenceNumber: true } });
		if (!inquiry) {
			return NextResponse.json({ error: "Custom order request not found." }, { status: 404 });
		}

		const hasAddress = inquiry.addressId != null;
		const applicableTypes = MANDAP_DOCUMENT_TYPES.filter((type) => hasAddress || !mandapDocumentRequiresAddress(type));

		const zip = new JSZip();
		for (const type of applicableTypes) {
			const output = await generateMandapInquiryDocument({ inquiryId: id, type, format: "buffer" });
			zip.file(`${DOCUMENT_LABELS[type]} - ${output.fileName}`, output.data);
		}

		const archive = await zip.generateAsync({ type: "nodebuffer" });
		const zipName = inquiry.referenceNumber ?? id;

		return new NextResponse(new Uint8Array(archive), {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="Custom-Order-${zipName}-Documents.zip"`,
				"Content-Length": String(archive.length),
			},
		});
	} catch (error) {
		if (error instanceof MandapInquiryNotFoundError) {
			return NextResponse.json({ error: "Custom order request not found." }, { status: 404 });
		}
		const message = error instanceof Error ? error.message : "Unable to generate documents.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
