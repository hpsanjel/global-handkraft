import { Document, Text, View } from "@react-pdf/renderer";
import type { OrderDocumentData } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { colors, spacing } from "../../styles/theme";
import { formatMoney } from "../../utils/currency";
import { DocumentPage, CompanyHeader, CompanyFooter, CustomerBlock, OrderMetaBlock, ItemsTable, PriceSummary, NotesSection, TermsAndConditions } from "../components";

const DISCLAIMER = "This is a non-binding cost estimate, not a tax invoice and not a demand for payment. Prices are quoted in the currency and validity period shown above and may change after that date. A legal commercial invoice is issued once the order is paid in full.";

const VALIDITY_DAYS = 30;

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

interface ProFormaInvoiceTemplateProps {
	data: OrderDocumentData;
}

export function ProFormaInvoiceTemplate({ data }: ProFormaInvoiceTemplateProps) {
	const { business, customer, order, payment, shipping } = data;
	const validUntil = new Date(data.metadata.issuedAt.getTime() + VALIDITY_DAYS * 24 * 60 * 60 * 1000);
	const incoterm = shipping.incoterm ?? business.defaultIncoterm;

	return (
		<Document title={`${data.metadata.documentNumber} — Pro Forma Invoice`} author={business.seller.legalName}>
			<DocumentPage footer={<CompanyFooter seller={business.seller} />}>
				<CompanyHeader seller={business.seller} documentTitle="Pro Forma Invoice / Estimate" documentNumber={data.metadata.documentNumber} issuedAt={data.metadata.issuedAt} />

				<View style={[sharedStyles.sectionSpacing, { padding: spacing.sm, backgroundColor: colors.neutral[50], borderLeftWidth: 3, borderLeftColor: colors.primaryOrange }]}>
					<Text style={[sharedStyles.value, sharedStyles.bold, { color: colors.primaryOrange }]}>Estimate only — not a tax invoice</Text>
				</View>

				<OrderMetaBlock
					order={order}
					extraFields={[
						{ label: "Valid until", value: formatDate(validUntil) },
						...(payment.depositRequired ? [{ label: "Deposit required", value: formatMoney(payment.depositRequired, order.currency) }] : []),
						{ label: "Country of origin", value: business.defaultCountryOfOrigin },
						...(incoterm ? [{ label: "Proposed Incoterm", value: incoterm }] : []),
					]}
				/>

				<View style={sharedStyles.sectionSpacing}>
					<CustomerBlock customer={customer} />
				</View>

				<View style={{ marginTop: spacing.lg }}>
					<ItemsTable items={order.items} currency={order.currency} columns={["description", "quantity", "unitPrice", "lineTotal", "hsCode", "countryOfOrigin"]} />
				</View>

				<PriceSummary currency={order.currency} subtotal={order.subtotal} shippingCost={order.shippingCost} discountTotal={order.discountTotal} vatTotal={order.vatTotal} grandTotal={order.grandTotal} />

				<NotesSection
					title="Notes"
					notes={[
						"Production begins once the deposit shown above (if any) is received; lead time depends on the complexity of the commission and will be confirmed in writing.",
						"This estimate may also support a buyer's own import-financing or permit application ahead of production.",
					]}
				/>

				<TermsAndConditions text={DISCLAIMER} />
			</DocumentPage>
		</Document>
	);
}
