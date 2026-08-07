import type { ReactNode } from "react";
import { Page } from "@react-pdf/renderer";
import { sharedStyles } from "../../styles/stylesheet";

interface DocumentPageProps {
	children: ReactNode;
	footer?: ReactNode;
}

/** A4 page shell shared by every document template: consistent margins, base typography, and an optional footer slot. */
export function DocumentPage({ children, footer }: DocumentPageProps) {
	return (
		<Page size="A4" style={sharedStyles.page} wrap>
			{children}
			{footer}
		</Page>
	);
}
