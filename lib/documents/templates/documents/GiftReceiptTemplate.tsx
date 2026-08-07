import { Document, Text, View } from "@react-pdf/renderer";
import type { OrderDocumentData } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { colors, spacing } from "../../styles/theme";
import { DocumentPage, CompanyHeader, CompanyFooter, OrderMetaBlock, ItemsTable } from "../components";

interface GiftReceiptTemplateProps {
	data: OrderDocumentData;
}

/** Prices are intentionally omitted throughout — that's what distinguishes a gift receipt from a regular receipt. */
export function GiftReceiptTemplate({ data }: GiftReceiptTemplateProps) {
	const { business, order } = data;

	return (
		<Document title={`${data.metadata.documentNumber} — Gift Receipt`} author={business.seller.legalName}>
			<DocumentPage footer={<CompanyFooter seller={business.seller} />}>
				<CompanyHeader seller={business.seller} documentTitle="Gift Receipt" documentNumber={data.metadata.documentNumber} issuedAt={data.metadata.issuedAt} />

				<View style={[sharedStyles.sectionSpacing, { padding: spacing.sm, backgroundColor: colors.neutral[50] }]}>
					<Text style={[sharedStyles.value, sharedStyles.bold, { color: colors.accentGold }]}>A handcrafted gift, made with care.</Text>
				</View>

				<OrderMetaBlock order={order} />

				<View style={{ marginTop: spacing.lg }}>
					<ItemsTable items={order.items} currency={order.currency} columns={["description", "quantity"]} />
				</View>

				<Text style={[sharedStyles.muted, sharedStyles.sectionSpacing]}>No pricing is shown on this gift receipt. For exchanges, contact {business.seller.supportEmail} with the order number above.</Text>
			</DocumentPage>
		</Document>
	);
}
