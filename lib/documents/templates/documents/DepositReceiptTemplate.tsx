import { Document, Text, View } from "@react-pdf/renderer";
import type { OrderDocumentData } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { colors, spacing } from "../../styles/theme";
import { formatMoney } from "../../utils/currency";
import { DocumentPage, CompanyHeader, CompanyFooter, OrderMetaBlock, PaymentInfo, NotesSection } from "../components";

interface DepositReceiptTemplateProps {
	data: OrderDocumentData;
}

export function DepositReceiptTemplate({ data }: DepositReceiptTemplateProps) {
	const { business, order, payment } = data;

	return (
		<Document title={`${data.metadata.documentNumber} — Advance Payment Receipt`} author={business.seller.legalName}>
			<DocumentPage footer={<CompanyFooter seller={business.seller} />}>
				<CompanyHeader seller={business.seller} documentTitle="Advance Payment Receipt" documentNumber={data.metadata.documentNumber} issuedAt={data.metadata.issuedAt} />

				<View style={[sharedStyles.sectionSpacing, { padding: spacing.sm, backgroundColor: colors.neutral[50] }]}>
					<Text style={[sharedStyles.value, sharedStyles.bold, { color: colors.primaryGreen }]}>Advance payment received — thank you.</Text>
					<Text style={[sharedStyles.muted, { marginTop: spacing.xs }]}>This confirms funds received on account of goods not yet delivered. It is not a tax invoice; a commercial invoice for the full order follows once the balance is settled.</Text>
				</View>

				<OrderMetaBlock
					order={order}
					extraFields={[
						{ label: "Order total", value: formatMoney(order.grandTotal, order.currency) },
						{ label: "Amount received today", value: formatMoney(payment.amountPaid ?? payment.amount, order.currency) },
						...(payment.balanceDue !== undefined ? [{ label: "Balance due", value: formatMoney(payment.balanceDue, order.currency) }] : []),
					]}
				/>

				<PaymentInfo payment={payment} currency={order.currency} />

				<NotesSection title="What happens next" notes={["Production continues/begins on the strength of this advance payment.", "The remaining balance is payable before the order ships — you'll receive a payment link for the outstanding amount."]} />
			</DocumentPage>
		</Document>
	);
}
