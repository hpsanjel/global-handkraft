import type { DocumentGenerator } from "../types";
import { GiftReceiptTemplate } from "../templates/documents";

export const giftReceiptGenerator: DocumentGenerator = {
	type: "GIFT_RECEIPT",
	build: (data) => <GiftReceiptTemplate data={data} />,
};
