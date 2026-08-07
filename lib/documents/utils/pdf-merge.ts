import { PDFDocument } from "pdf-lib";

/**
 * Merges multiple PDF buffers (in order) into a single PDF buffer.
 * Intended for combining our own generated documents with carrier-issued
 * shipping labels (Bring/DHL/UPS/FedEx typically return a label as its own PDF).
 */
export async function mergePdfBuffers(buffers: Buffer[]): Promise<Buffer> {
	const merged = await PDFDocument.create();

	for (const buffer of buffers) {
		const source = await PDFDocument.load(buffer);
		const pages = await merged.copyPages(source, source.getPageIndices());
		for (const page of pages) {
			merged.addPage(page);
		}
	}

	return Buffer.from(await merged.save());
}
