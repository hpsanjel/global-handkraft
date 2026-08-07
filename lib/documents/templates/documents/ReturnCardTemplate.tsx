import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { OrderDocumentData } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { colors, spacing } from "../../styles/theme";
import { AddressBlock, QRCodeBlock } from "../components";

interface ReturnCardTemplateProps {
	data: OrderDocumentData;
}

export function ReturnCardTemplate({ data }: ReturnCardTemplateProps) {
	const { business, returnInformation, order } = data;

	return (
		<Document title={`${data.metadata.documentNumber} — Return Card`} author={business.seller.legalName}>
			<Page size="A6" style={[sharedStyles.page, { padding: spacing.lg }]}>
				<Text style={sharedStyles.h1}>{business.seller.tradingName}</Text>
				<Text style={[sharedStyles.h3, { marginTop: spacing.sm, color: colors.primaryOrange }]}>Return information</Text>

				<View style={sharedStyles.sectionSpacing}>
					<AddressBlock title="Return to" address={returnInformation.returnAddress} />
				</View>

				<View style={sharedStyles.sectionSpacing}>
					<Text style={sharedStyles.muted}>Order reference: {order.orderNumber}</Text>
					<Text style={sharedStyles.muted}>Return window: {returnInformation.returnWindowDays} days from delivery</Text>
				</View>

				<View style={sharedStyles.sectionSpacing}>
					<Text style={sharedStyles.h3}>How to return</Text>
					{returnInformation.instructions.map((instruction, index) => (
						<Text key={index} style={[sharedStyles.muted, { marginTop: spacing.xs }]}>
							{index + 1}. {instruction}
						</Text>
					))}
				</View>

				<Text style={[sharedStyles.muted, sharedStyles.sectionSpacing]}>{returnInformation.policySummary}</Text>

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
