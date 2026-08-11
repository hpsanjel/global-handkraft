import type { DocumentGenerator } from "../types";
import { DepositReceiptTemplate } from "../templates/documents";

export const depositReceiptGenerator: DocumentGenerator = {
	type: "DEPOSIT_RECEIPT",
	build: (data) => <DepositReceiptTemplate data={data} />,
};
