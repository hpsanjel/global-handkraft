import type { DocumentGenerator } from "../types";
import { CustomsInvoiceTemplate } from "../templates/documents";

export const customsInvoiceGenerator: DocumentGenerator = {
	type: "CUSTOMS_INVOICE",
	build: (data) => <CustomsInvoiceTemplate data={data} />,
};
