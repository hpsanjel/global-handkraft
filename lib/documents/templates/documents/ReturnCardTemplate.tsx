import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { OrderDocumentData } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { colors, spacing } from "../../styles/theme";
import { QRCodeBlock } from "../components";

interface ReturnCardTemplateProps {
	data: OrderDocumentData;
}

export function ReturnCardTemplate({ data }: ReturnCardTemplateProps) {
	const { business, returnInformation, order } = data;

	return (
		<Document title={`${data.metadata.documentNumber} — Returns Policy`} author={business.seller.legalName}>
			<Page size="A6" style={[sharedStyles.page, { padding: spacing.lg }]}>
				<Text style={sharedStyles.h1}>{business.seller.tradingName}</Text>
				<Text style={[sharedStyles.h3, { marginTop: spacing.sm, color: colors.primaryOrange }]}>Returns policy</Text>

				<View style={sharedStyles.sectionSpacing}>
					<Text style={sharedStyles.muted}>Order reference: {order.orderNumber}</Text>
				</View>

				<Text style={[sharedStyles.value, sharedStyles.bold, sharedStyles.sectionSpacing]}>All sales are final.</Text>
				<Text style={[sharedStyles.muted, { marginTop: spacing.xs }]}>{returnInformation.policySummary}</Text>

				<View style={[sharedStyles.row, sharedStyles.sectionSpacing, { alignItems: "center" }]}>
					<View>
						<Text style={sharedStyles.muted}>{returnInformation.supportEmail}</Text>
						<Text style={sharedStyles.muted}>{returnInformation.supportPhone}</Text>
						<Text style={sharedStyles.muted}>{returnInformation.website}</Text>
					</View>
					<QRCodeBlock value={`https://${returnInformation.website}/returns`} size={56} />
				</View>
			</Page>
		</Document>
	);
}
