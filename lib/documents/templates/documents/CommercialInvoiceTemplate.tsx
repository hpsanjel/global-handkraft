import { Document, View } from "@react-pdf/renderer";
import type { OrderDocumentData } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { spacing } from "../../styles/theme";
import { DocumentPage, CompanyHeader, CompanyFooter, CustomerBlock, OrderMetaBlock, ItemsTable, TaxSummary, PriceSummary, TermsAndConditions, PageNumber } from "../components";

const DECLARATION = "We declare that the information contained in this invoice is true and correct to the best of our knowledge. All goods described herein are of the stated country of origin and are declared for commercial/customs purposes.";

interface CommercialInvoiceTemplateProps {
	data: OrderDocumentData;
}

export function CommercialInvoiceTemplate({ data }: CommercialInvoiceTemplateProps) {
	const { business, customer, order, taxes } = data;

	return (
		<Document title={`${data.metadata.documentNumber} — Commercial Invoice`} author={business.seller.legalName}>
			<DocumentPage footer={<><CompanyFooter seller={business.seller} /><PageNumber /></>}>
				<CompanyHeader seller={business.seller} documentTitle="Commercial Invoice" documentNumber={data.metadata.documentNumber} issuedAt={data.metadata.issuedAt} />

				<OrderMetaBlock
					order={order}
					extraFields={[
						{ label: "Country of origin", value: business.defaultCountryOfOrigin },
						...(business.defaultIncoterm ? [{ label: "Incoterm", value: business.defaultIncoterm }] : []),
						{ label: "Payment status", value: data.payment.status },
					]}
				/>

				<View style={sharedStyles.sectionSpacing}>
					<CustomerBlock customer={customer} showBillingAddress />
				</View>

				<View style={{ marginTop: spacing.lg }}>
					<ItemsTable items={order.items} currency={order.currency} columns={["description", "quantity", "unitPrice", "lineTotal", "hsCode", "countryOfOrigin"]} />
				</View>

				<TaxSummary taxes={taxes} currency={order.currency} />

				<PriceSummary currency={order.currency} subtotal={order.subtotal} shippingCost={order.shippingCost} discountTotal={order.discountTotal} vatTotal={order.vatTotal} grandTotal={order.grandTotal} />

				<TermsAndConditions text={DECLARATION} />
			</DocumentPage>
		</Document>
	);
}
