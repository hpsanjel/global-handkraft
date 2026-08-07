"use client";

import { useId, useState } from "react";
import type { DocumentType } from "@/lib/documents";

const DOCUMENT_LABELS: Record<DocumentType, string> = {
	COMMERCIAL_INVOICE: "Commercial Invoice",
	PACKING_LIST: "Packing List",
	RECEIPT: "Receipt",
	CUSTOMS_INVOICE: "Customs Invoice",
	RETURN_CARD: "Return Card",
	SHIPPING_SUMMARY: "Shipping Summary",
	ORDER_SUMMARY: "Order Summary",
	GIFT_RECEIPT: "Gift Receipt",
};

const DOCUMENT_ORDER: DocumentType[] = ["COMMERCIAL_INVOICE", "PACKING_LIST", "RECEIPT", "CUSTOMS_INVOICE", "SHIPPING_SUMMARY", "ORDER_SUMMARY", "RETURN_CARD", "GIFT_RECEIPT"];

type Props = {
	orderId: string;
};

/** Opens the selected document inline in a new tab, ready for the admin to view or print (Cmd/Ctrl+P). */
export function OrderDocumentsMenu({ orderId }: Props) {
	const selectId = useId();
	const [value, setValue] = useState("");

	const handleChange = (type: string) => {
		if (!type) return;
		window.open(`/api/admin/orders/${orderId}/documents/${type}`, "_blank", "noopener,noreferrer");
		setValue("");
	};

	return (
		<select
			id={selectId}
			aria-label="Open a document for this order"
			value={value}
			onChange={(event) => handleChange(event.target.value)}
			className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-medium text-stone-700"
		>
			<option value="">Documents…</option>
			{DOCUMENT_ORDER.map((type) => (
				<option key={type} value={type}>
					{DOCUMENT_LABELS[type]}
				</option>
			))}
		</select>
	);
}
