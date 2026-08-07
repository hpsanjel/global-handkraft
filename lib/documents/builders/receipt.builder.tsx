import type { DocumentGenerator } from "../types";
import { ReceiptTemplate } from "../templates/documents";

export const receiptGenerator: DocumentGenerator = {
	type: "RECEIPT",
	build: (data) => <ReceiptTemplate data={data} />,
};
