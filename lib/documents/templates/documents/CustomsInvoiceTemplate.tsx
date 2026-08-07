import { Document, View } from "@react-pdf/renderer";
import type { OrderDocumentData } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { spacing } from "../../styles/theme";
import { DocumentPage, CompanyHeader, CompanyFooter, CustomerBlock, OrderMetaBlock, ItemsTable, PriceSummary, NotesSection, TermsAndConditions, PageNumber } from "../components";

const CUSTOMS_DECLARATION = "This is a customs declaration for the goods described below. No commercial samples. Declared value reflects the actual transaction value paid by the buyer. Goods are not for resale.";

interface CustomsInvoiceTemplateProps {
	data: OrderDocumentData;
}

export function CustomsInvoiceTemplate({ data }: CustomsInvoiceTemplateProps) {
	const { business, customer, order, shipping } = data;
	const totalWeightKg = shipping.shipment ? (shipping.shipment.totalWeightInGrams / 1000).toFixed(2) : order.items.reduce((sum, item) => sum + (item.weightInGrams ?? 0) * item.quantity, 0) / 1000;

	return (
		<Document title={`${data.metadata.documentNumber} — Customs Invoice`} author={business.seller.legalName}>
			<DocumentPage footer={<><CompanyFooter seller={business.seller} /><PageNumber /></>}>
				<CompanyHeader seller={business.seller} documentTitle="Customs Invoice" documentNumber={data.metadata.documentNumber} issuedAt={data.metadata.issuedAt} />

				<OrderMetaBlock
					order={order}
					extraFields={[
						{ label: "Country of origin", value: business.defaultCountryOfOrigin },
						{ label: "Package weight", value: `${totalWeightKg} kg` },
						{ label: "Declared value", value: order.currency },
					]}
				/>

				<View style={sharedStyles.sectionSpacing}>
					<CustomerBlock customer={customer} />
				</View>

				<View style={{ marginTop: spacing.lg }}>
					<ItemsTable items={order.items} currency={order.currency} columns={["description", "hsCode", "countryOfOrigin", "quantity", "weight", "unitPrice", "lineTotal"]} />
				</View>

				<PriceSummary currency={order.currency} subtotal={order.subtotal} shippingCost={order.shippingCost} discountTotal={order.discountTotal} vatTotal={order.vatTotal} grandTotal={order.grandTotal} />

				<NotesSection title="Customs notes" notes={["Goods are handcrafted items imported for retail sale.", "No batteries, liquids, or restricted materials included."]} />

				<TermsAndConditions text={CUSTOMS_DECLARATION} />
			</DocumentPage>
		</Document>
	);
}
