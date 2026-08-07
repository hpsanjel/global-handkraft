import { View } from "@react-pdf/renderer";
import type { Customer } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { AddressBlock } from "./AddressBlock";

interface CustomerBlockProps {
	customer: Customer;
	showBillingAddress?: boolean;
}

function isSameAddress(a: Customer["billingAddress"], b: Customer["shippingAddress"]): boolean {
	return a.line1 === b.line1 && a.postalCode === b.postalCode && a.country === b.country;
}

export function CustomerBlock({ customer, showBillingAddress = false }: CustomerBlockProps) {
	const billingDiffers = showBillingAddress && !isSameAddress(customer.billingAddress, customer.shippingAddress);

	return (
		<View style={sharedStyles.row}>
			<AddressBlock title="Ship to" name={customer.fullName} address={customer.shippingAddress} phone={customer.phone} email={customer.email} />
			{billingDiffers ? <AddressBlock title="Bill to" name={customer.fullName} address={customer.billingAddress} vatNumber={customer.billingAddress.vatNumber} /> : null}
		</View>
	);
}
