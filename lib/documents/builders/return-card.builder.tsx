import type { DocumentGenerator } from "../types";
import { ReturnCardTemplate } from "../templates/documents";

export const returnCardGenerator: DocumentGenerator = {
	type: "RETURN_CARD",
	build: (data) => <ReturnCardTemplate data={data} />,
};
