import { Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "../../styles/stylesheet";
import { colors, spacing } from "../../styles/theme";

interface SignatureBlockProps {
	label: string;
}

export function SignatureBlock({ label }: SignatureBlockProps) {
	return (
		<View style={{ width: 200, marginTop: spacing.xl }}>
			<View style={{ borderTopWidth: 1, borderTopColor: colors.neutral[400], paddingTop: spacing.xs }}>
				<Text style={sharedStyles.muted}>{label}</Text>
			</View>
		</View>
	);
}
