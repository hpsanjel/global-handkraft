import { Document, Text, View } from "@react-pdf/renderer";
import type { OrderDocumentData } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { colors, spacing } from "../../styles/theme";
import { DocumentPage, CompanyHeader, CompanyFooter, OrderMetaBlock, ItemsTable, PriceSummary, PaymentInfo, QRCodeBlock } from "../components";

interface ReceiptTemplateProps {
	data: OrderDocumentData;
}

export function ReceiptTemplate({ data }: ReceiptTemplateProps) {
	const { business, order, payment } = data;

	return (
		<Document title={`${data.metadata.documentNumber} — Receipt`} author={business.seller.legalName}>
			<DocumentPage footer={<CompanyFooter seller={business.seller} />}>
				<CompanyHeader seller={business.seller} documentTitle="Receipt" documentNumber={data.metadata.documentNumber} issuedAt={data.metadata.issuedAt} />

				<View style={[sharedStyles.sectionSpacing, { padding: spacing.sm, backgroundColor: colors.neutral[50] }]}>
					<Text style={[sharedStyles.value, sharedStyles.bold, { color: colors.primaryGreen }]}>Payment confirmed — thank you for your order!</Text>
				</View>

				<OrderMetaBlock order={order} />

				<View style={{ marginTop: spacing.lg }}>
					<ItemsTable items={order.items} currency={order.currency} />
				</View>

				<PriceSummary currency={order.currency} subtotal={order.subtotal} shippingCost={order.shippingCost} discountTotal={order.discountTotal} vatTotal={order.vatTotal} grandTotal={order.grandTotal} />

				<PaymentInfo payment={payment} />

				<View style={[sharedStyles.row, sharedStyles.sectionSpacing, { alignItems: "center" }]}>
					<View>
						<Text style={sharedStyles.h3}>Need help?</Text>
						<Text style={[sharedStyles.muted, { marginTop: spacing.xs }]}>{business.seller.supportEmail}</Text>
						<Text style={sharedStyles.muted}>{business.seller.supportPhone}</Text>
					</View>
					<QRCodeBlock value={`https://${business.seller.website}/account/orders?order=${encodeURIComponent(order.orderNumber)}`} caption="View this order online" />
				</View>
			</DocumentPage>
		</Document>
	);
}
