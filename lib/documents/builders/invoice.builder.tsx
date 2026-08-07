import type { DocumentGenerator } from "../types";
import { CommercialInvoiceTemplate } from "../templates/documents";

export const invoiceGenerator: DocumentGenerator = {
	type: "COMMERCIAL_INVOICE",
	build: (data) => <CommercialInvoiceTemplate data={data} />,
};
