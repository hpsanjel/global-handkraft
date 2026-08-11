import type { DocumentGenerator } from "../types";
import { ProFormaInvoiceTemplate } from "../templates/documents";

export const proFormaInvoiceGenerator: DocumentGenerator = {
	type: "PRO_FORMA_INVOICE",
	build: (data) => <ProFormaInvoiceTemplate data={data} />,
};
