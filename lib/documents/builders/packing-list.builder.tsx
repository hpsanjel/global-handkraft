import type { DocumentGenerator } from "../types";
import { PackingListTemplate } from "../templates/documents";

export const packingListGenerator: DocumentGenerator = {
	type: "PACKING_LIST",
	build: (data) => <PackingListTemplate data={data} />,
};
