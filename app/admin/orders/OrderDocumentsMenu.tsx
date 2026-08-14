"use client";

import { useId, useState } from "react";
// Import from the pure types module, not the "@/lib/documents" barrel — that barrel
// also re-exports the server-only generation pipeline (Prisma, react-pdf), which would
// otherwise get pulled into this client component's browser bundle.
import { SHIPPING_ONLY_DOCUMENT_TYPES, type DocumentType } from "@/lib/documents/types";

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

const DOCUMENT_ORDER: DocumentType[] = ["COMMERCIAL_INVOICE", "PACKING_LIST", "RECEIPT", "CUSTOMS_INVOICE", "SHIPPING_SUMMARY", "ORDER_SUMMARY", "RETURN_CARD", "GIFT_RECEIPT"];

type Props = {
	orderId: string;
	/** Store pickup orders have no shipment, so packing/customs/shipping documents don't apply. */
	isPickup: boolean;
};

/** Opens the selected document inline in a new tab, ready for the admin to view or print (Cmd/Ctrl+P). */
export function OrderDocumentsMenu({ orderId, isPickup }: Props) {
	const selectId = useId();
	const [value, setValue] = useState("");
	const availableTypes = isPickup ? DOCUMENT_ORDER.filter((type) => !SHIPPING_ONLY_DOCUMENT_TYPES.includes(type)) : DOCUMENT_ORDER;

	const handleChange = (type: string) => {
		if (!type) return;
		const url = type === "ALL" ? `/api/admin/orders/${orderId}/documents/all` : `/api/admin/orders/${orderId}/documents/${type}`;
		window.open(url, "_blank", "noopener,noreferrer");
		setValue("");
	};

	return (
		<select
			id={selectId}
			aria-label="Open a document for this order"
			value={value}
			onChange={(event) => handleChange(event.target.value)}
			className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100"
		>
			<option value="">Documents…</option>
			<option value="ALL">Download all (.zip)</option>
			{availableTypes.map((type) => (
				<option key={type} value={type}>
					{DOCUMENT_LABELS[type]}
				</option>
			))}
		</select>
	);
}
