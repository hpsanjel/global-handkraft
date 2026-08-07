import { Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "../../styles/stylesheet";

interface AddressLike {
	line1: string;
	line2?: string;
	city: string;
	postalCode: string;
	country: string;
}

interface AddressBlockProps {
	title: string;
	name?: string;
	address: AddressLike;
	phone?: string;
	email?: string;
	vatNumber?: string;
}

export function AddressBlock({ title, name, address, phone, email, vatNumber }: AddressBlockProps) {
	return (
		<View style={sharedStyles.column}>
			<Text style={sharedStyles.label}>{title}</Text>
			{name ? (
				<Text style={[sharedStyles.value, sharedStyles.bold, { marginTop: 2 }]} wrap={false}>
					{name}
				</Text>
			) : null}
			<Text style={[sharedStyles.value, { marginTop: 2 }]}>{address.line1}</Text>
			{address.line2 ? <Text style={sharedStyles.value}>{address.line2}</Text> : null}
			<Text style={sharedStyles.value}>
				{address.postalCode} {address.city}
			</Text>
			<Text style={sharedStyles.value}>{address.country}</Text>
			{phone ? <Text style={[sharedStyles.muted, { marginTop: 2 }]}>{phone}</Text> : null}
			{email ? <Text style={sharedStyles.muted}>{email}</Text> : null}
			{vatNumber ? <Text style={sharedStyles.muted}>VAT: {vatNumber}</Text> : null}
		</View>
	);
}
