import type { DocumentGenerator } from "../types";
import { ShippingSummaryTemplate } from "../templates/documents";

export const shippingSummaryGenerator: DocumentGenerator = {
	type: "SHIPPING_SUMMARY",
	build: (data) => <ShippingSummaryTemplate data={data} />,
};
