import { Text } from "@react-pdf/renderer";
import { sharedStyles } from "../../styles/stylesheet";

export function PageNumber() {
	return <Text style={sharedStyles.pageNumber} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />;
}
