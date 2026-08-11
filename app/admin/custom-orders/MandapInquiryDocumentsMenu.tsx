"use client";

import { useId, useState } from "react";
// Import from the pure types module, not the "@/lib/documents" barrel — that barrel
// also re-exports the server-only generation pipeline (Prisma, react-pdf), which would
// otherwise get pulled into this client component's browser bundle.
import { mandapDocumentRequiresAddress, type DocumentType } from "@/lib/documents/types";

const DOCUMENT_LABELS: Record<DocumentType, string> = {
	PRO_FORMA_INVOICE: "Pro Forma Invoice / Estimate",
	DEPOSIT_RECEIPT: "Advance Payment Receipt",
	COMMERCIAL_INVOICE: "Commercial Invoice",
	RECEIPT: "Receipt",
	ORDER_SUMMARY: "Order Summary",
	PACKING_LIST: "Packing List",
	CUSTOMS_INVOICE: "Customs Invoice",
	SHIPPING_SUMMARY: "Shipping Summary",
	RETURN_CARD: "Return Policy",
	GIFT_RECEIPT: "Gift Receipt",
};

const DOCUMENT_ORDER: DocumentType[] = ["PRO_FORMA_INVOICE", "DEPOSIT_RECEIPT", "COMMERCIAL_INVOICE", "RECEIPT", "ORDER_SUMMARY", "PACKING_LIST", "CUSTOMS_INVOICE", "SHIPPING_SUMMARY"];

type Props = {
	inquiryId: string;
	/** Whether a shipping address is on file — every document except the Pro Forma requires one. */
	hasAddress: boolean;
};

/** Opens the selected document inline in a new tab, ready for the admin to view or print (Cmd/Ctrl+P). */
export function MandapInquiryDocumentsMenu({ inquiryId, hasAddress }: Props) {
	const selectId = useId();
	const [value, setValue] = useState("");
	const availableTypes = DOCUMENT_ORDER;

	const handleChange = (type: string) => {
		if (!type) return;
		const url = type === "ALL" ? `/api/admin/mandap-inquiries/${inquiryId}/documents/all` : `/api/admin/mandap-inquiries/${inquiryId}/documents/${type}`;
		window.open(url, "_blank", "noopener,noreferrer");
		setValue("");
	};

	return (
		<div>
			<select
				id={selectId}
				aria-label="Open a document for this custom order request"
				value={value}
				onChange={(event) => handleChange(event.target.value)}
				className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100"
			>
				<option value="">Documents…</option>
				<option value="ALL">Download all (.zip)</option>
				{availableTypes.map((type) => (
					<option key={type} value={type} disabled={!hasAddress && mandapDocumentRequiresAddress(type)}>
						{DOCUMENT_LABELS[type]}
						{!hasAddress && mandapDocumentRequiresAddress(type) ? " (needs address)" : ""}
					</option>
				))}
			</select>
			{!hasAddress ? <p className="mt-1 text-xs text-amber-600">Add a shipping address below to unlock most documents.</p> : null}
		</div>
	);
}
