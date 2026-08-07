import { StyleSheet } from "@react-pdf/renderer";
import { colors, fonts, fontSize, spacing, page } from "./theme";

/**
 * Shared react-pdf styles used across every document template. Keeping these
 * centralized is what makes the 8 document types look like one consistent
 * system instead of 8 hand-tuned layouts.
 */
export const sharedStyles = StyleSheet.create({
	page: {
		paddingTop: page.marginPt,
		paddingBottom: page.marginPt + spacing.lg,
		paddingHorizontal: page.marginPt,
		fontFamily: fonts.body,
		fontSize: fontSize.body,
		color: colors.neutral[900],
		backgroundColor: colors.white,
	},

	row: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	rowStart: {
		flexDirection: "row",
		alignItems: "flex-start",
	},
	column: {
		flexDirection: "column",
	},

	h1: {
		fontFamily: fonts.heading,
		fontSize: fontSize.h1,
		fontWeight: 700,
		color: colors.darkNavy,
	},
	h2: {
		fontFamily: fonts.heading,
		fontSize: fontSize.h2,
		fontWeight: 700,
		color: colors.darkNavy,
	},
	h3: {
		fontFamily: fonts.body,
		fontSize: fontSize.h3,
		fontWeight: 700,
		color: colors.neutral[900],
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
	label: {
		fontSize: fontSize.small,
		color: colors.neutral[500],
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	value: {
		fontSize: fontSize.body,
		color: colors.neutral[900],
	},
	muted: {
		fontSize: fontSize.small,
		color: colors.neutral[500],
	},
	bold: {
		fontWeight: 700,
	},

	divider: {
		borderBottomWidth: 1,
		borderBottomColor: colors.neutral[200],
		marginVertical: spacing.sm,
	},
	sectionSpacing: {
		marginTop: spacing.lg,
	},

	table: {
		marginTop: spacing.sm,
	},
	tableHeaderRow: {
		flexDirection: "row",
		backgroundColor: colors.darkNavy,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.xs,
	},
	tableHeaderCell: {
		fontSize: fontSize.small,
		fontWeight: 700,
		color: colors.white,
		textTransform: "uppercase",
		letterSpacing: 0.4,
	},
	tableRow: {
		flexDirection: "row",
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.xs,
		borderBottomWidth: 1,
		borderBottomColor: colors.neutral[200],
	},
	tableRowAlt: {
		backgroundColor: colors.neutral[50],
	},
	tableCell: {
		fontSize: fontSize.body,
		color: colors.neutral[900],
	},

	footer: {
		position: "absolute",
		bottom: spacing.lg,
		left: page.marginPt,
		right: page.marginPt,
		paddingTop: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.neutral[200],
		flexDirection: "row",
		justifyContent: "space-between",
		fontSize: fontSize.tiny,
		color: colors.neutral[500],
	},
	pageNumber: {
		position: "absolute",
		bottom: spacing.lg,
		right: page.marginPt,
		fontSize: fontSize.tiny,
		color: colors.neutral[500],
	},
});
