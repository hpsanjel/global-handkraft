import { Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "../../styles/stylesheet";
import { spacing } from "../../styles/theme";

interface NotesSectionProps {
	title: string;
	notes: string[];
}

export function NotesSection({ title, notes }: NotesSectionProps) {
	if (notes.length === 0) return null;

	return (
		<View style={sharedStyles.sectionSpacing}>
			<Text style={sharedStyles.h3}>{title}</Text>
			{notes.map((note, index) => (
				<Text key={index} style={[sharedStyles.muted, { marginTop: spacing.xs }]}>
					{note}
				</Text>
			))}
		</View>
	);
}
