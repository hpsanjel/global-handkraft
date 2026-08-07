import { Document, Text, View } from "@react-pdf/renderer";
import type { OrderDocumentData } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { spacing } from "../../styles/theme";
import { DocumentPage, CompanyHeader, CompanyFooter, CustomerBlock, AddressBlock, OrderMetaBlock, ItemsTable, PriceSummary, PaymentInfo, PageNumber } from "../components";

interface OrderSummaryTemplateProps {
	data: OrderDocumentData;
}

export function OrderSummaryTemplate({ data }: OrderSummaryTemplateProps) {
	const { business, customer, order, payment, shipping } = data;

	return (
		<Document title={`${data.metadata.documentNumber} — Order Summary`} author={business.seller.legalName}>
			<DocumentPage footer={<><CompanyFooter seller={business.seller} /><PageNumber /></>}>
				<CompanyHeader seller={business.seller} documentTitle="Order Summary" documentNumber={data.metadata.documentNumber} issuedAt={data.metadata.issuedAt} />

				<OrderMetaBlock order={order} extraFields={[{ label: "Shipping method", value: shipping.method ?? "—" }]} />

				<View style={sharedStyles.sectionSpacing}>
					<CustomerBlock customer={customer} />
				</View>

				<View style={{ marginTop: spacing.lg }}>
					<Text style={sharedStyles.h3}>Items</Text>
					<ItemsTable items={order.items} currency={order.currency} />
				</View>

				<PriceSummary currency={order.currency} subtotal={order.subtotal} shippingCost={order.shippingCost} discountTotal={order.discountTotal} vatTotal={order.vatTotal} grandTotal={order.grandTotal} />

				<PaymentInfo payment={payment} />

				<View style={sharedStyles.sectionSpacing}>
					<AddressBlock title="Delivery address" name={shipping.address.fullName} address={shipping.address} phone={shipping.address.phone} />
				</View>
			</DocumentPage>
		</Document>
	);
}
