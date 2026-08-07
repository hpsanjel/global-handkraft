import { Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "../../styles/stylesheet";

interface TermsAndConditionsProps {
	text: string;
}

export function TermsAndConditions({ text }: TermsAndConditionsProps) {
	return (
		<View style={[sharedStyles.sectionSpacing, sharedStyles.divider]}>
			<Text style={[sharedStyles.muted, { fontSize: 7 }]}>{text}</Text>
		</View>
	);
}
