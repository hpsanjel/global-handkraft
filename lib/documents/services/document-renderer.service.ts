import type { ReactElement } from "react";
import { renderToBuffer, renderToStream, type DocumentProps } from "@react-pdf/renderer";
import { registerDocumentFonts } from "../styles/fonts";
import type { DocumentOutput, OutputFormat } from "../types";

function pdfFileName(documentNumber: string): string {
	return `${documentNumber}.pdf`;
}

export async function renderDocument(element: ReactElement, documentNumber: string, format: "buffer"): Promise<Extract<DocumentOutput, { format: "buffer" }>>;
export async function renderDocument(element: ReactElement, documentNumber: string, format: "stream"): Promise<Extract<DocumentOutput, { format: "stream" }>>;
export async function renderDocument(element: ReactElement, documentNumber: string, format: "blob"): Promise<Extract<DocumentOutput, { format: "blob" }>>;
// General fallback overload for callers passing a non-literal (widened) format value.
export async function renderDocument(element: ReactElement, documentNumber: string, format: OutputFormat): Promise<DocumentOutput>;
/** Renders a react-pdf <Document> element into the requested container format. Fonts are registered lazily and once per process. */
export async function renderDocument(element: ReactElement, documentNumber: string, format: OutputFormat): Promise<DocumentOutput> {
	registerDocumentFonts();

	// DocumentGenerator.build() is typed to return a framework-agnostic ReactElement
	// (types/ stays independent of @react-pdf/renderer); this is the one seam where
	// it meets the concrete rendering library, so the cast belongs here.
	const document = element as ReactElement<DocumentProps>;

	if (format === "buffer") {
		const data = await renderToBuffer(document);
		return { format: "buffer", contentType: "application/pdf", data, fileName: pdfFileName(documentNumber), documentNumber };
	}

	if (format === "stream") {
		const data = await renderToStream(document);
		return { format: "stream", contentType: "application/pdf", data, fileName: pdfFileName(documentNumber), documentNumber };
	}

	const buffer = await renderToBuffer(document);
	const data = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });
	return { format: "blob", contentType: "application/pdf", data, fileName: pdfFileName(documentNumber), documentNumber };
}
