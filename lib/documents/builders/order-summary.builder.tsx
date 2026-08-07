import type { DocumentGenerator } from "../types";
import { OrderSummaryTemplate } from "../templates/documents";

export const orderSummaryGenerator: DocumentGenerator = {
	type: "ORDER_SUMMARY",
	build: (data) => <OrderSummaryTemplate data={data} />,
};
